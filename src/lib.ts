// Types

interface IDictionary<a> {
    [key: string]: a;
}

export type Flashcard<a> = {
    params: a,
    prompt: string,
    answers: string[],
    hint: string,
    uuid: string
}

export type FlashcardTemplate<a, s> = {
    generator: (seed: a, st: s) => Flashcard<a>
}

export type FlashcardGenEditor<s> = {
    element: HTMLElement,
    menuToState: () => s
}

export type FlashcardGenerator<a, s> = {
    name: string,
    ftemp: FlashcardTemplate<a, s>,
    state: s,
    seeder: (st: s) => a,
    updater: (correct: boolean, card: Flashcard<a>, st: s) => s,
    history: [Flashcard<a>, boolean][],
    editor: (st: s) => FlashcardGenEditor<s>
}

// Utilities

// https://stackoverflow.com/questions/6860853/generate-random-string-for-div-id
export function guidGenerator(): string {
    var S4 = function() {
       return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}

function zeroDict(keys: string[]): IDictionary<number> {
    var d: IDictionary<number> = {};
    for (var k in keys) {
        d[keys[k]] = 0;
    }
    return d;
}

function weightedRandomIndex(weights: number[]): number {
    var weightSums = weights.map((sum => value => sum += value)(0));
    var totalSum = weights.reduce((a, b) => a + b, 0);
    var ind = weightSums.findIndex((w) => w >= Math.random()*totalSum);
    return ind;
}

function arrayLen<a>(ls: a[]): number {
    var n = 0;
    for (var i in ls) {
        if (ls[i] !== undefined) n++;
    }
    return n;
}

function arrayReindex<a>(ls: a[]): a[] { 
    return ls.filter((_) => true);
}

// Logic

function uniformRandomFGen(name: string, cards: [string, string][]): 
    FlashcardGenerator<number, [string, string][]> {
    var gen = {
        name: name,
        ftemp: {
            generator: function(seed: number, st: [string, string][]) {
                return {
                    params: seed,
                    prompt: st[seed][0],
                    answers: [st[seed][1]],
                    hint: st[seed][1],
                    uuid: guidGenerator() 
                }
            }
        },
        state: cards,
        seeder: function(st: [string, string][]) {
            return Math.floor(Math.random() * arrayLen(st));
        },
        updater: (correct: boolean, card: Flashcard<number>, st: [string, string][]) => st,
        history: [],
        editor: (ls: [string, string][]) => multipleEditors(ls, ["", ""], doubleTextFieldEditor)
    }
    return gen;
}

export function evilFGen(name: string, cards: [string, string, string[]][], alpha: number): 
    FlashcardGenerator<number, [[string, string, string[]][], IDictionary<number>]> {
    return {
        name: name,
        ftemp: {
            generator: function(seed: number, st) {
                return {
                    params: seed,
                    prompt: st[0][seed][0],
                    answers: [st[0][seed][1]],
                    hint: st[0][seed][1],
                    uuid: guidGenerator()
                }
            }
        },
        state: [cards, zeroDict([...new Set(cards.map((c) => c[2]).flat())])],
        seeder: function(st) {
            var weights = st[0].map((card) => 1 + card[2].map((p) => st[1][p]).reduce((a, b) => a + b, 0));
            return weightedRandomIndex(weights);
        },
        updater: function(correct, card, st) {
            var props = st[0][card.params][2];
            for (var i in props) {
                if (correct) {
                    st[1][props[i]] *= alpha;
                } else {
                    st[1][props[i]] += 1;
                }
            }
            return st;
        },
        history: [],
        editor: (st) => {
            var propWeights = st[1];
            var cards = st[0].map((c) => [c[0], c[1], c[2].join(',')]);
            var editor = multipleEditors(cards, ["", "", ""], (c) => fixedNumEditors(c, singleTextFieldEditor))
            var newWeights = zeroDict([...new Set(cards.map((c) => c[2]).flat())]);
            for (var i in propWeights) {
                if (propWeights[i] in Object.keys(newWeights)) {
                    newWeights[propWeights[i]] = propWeights[propWeights[i]]
                }
            }
            return {
                element: editor.element,
                menuToState: () => {
                    return [editor.menuToState().map((c) => [c[0], c[1], c[2].split(',')]), newWeights];
                }
            };
        }
    }
}

function nextCard<a, s>(fgen: FlashcardGenerator<a, s>): Flashcard<a> {
    var seed = fgen.seeder(fgen.state);
    var card = fgen.ftemp.generator(seed, fgen.state);
    return card;
}

function isGuessCorrect<a>(card: Flashcard<a>, guess: string): boolean {
    return card.answers.indexOf(guess) > -1;
}

// View

export function singleTextFieldEditor(txt: string): FlashcardGenEditor<string> {
    var editor: FlashcardGenEditor<string> = {
        element: document.createElement("input"),
        menuToState: () => (<HTMLInputElement>editor.element).value
    };
    (<HTMLInputElement>editor.element).value = txt;
    return editor;
}

export function validatedTextFieldEditor(txt: string, pred: (s: string) => boolean):
    FlashcardGenEditor<string> {
    var editor = singleTextFieldEditor(txt);
    editor.element.oninput = (e) => {
        if (!pred((<HTMLInputElement>editor.element).value)) {
            editor.element.style.backgroundColor = "#ffeeee";
        } else {
            editor.element.style.backgroundColor = "white";
        }
    }
    return editor;
}

export function doubleTextFieldEditor(txts: [string, string]): FlashcardGenEditor<[string, string]> {
    var children = [singleTextFieldEditor(txts[0]), singleTextFieldEditor(txts[1])];
    var editor: FlashcardGenEditor<[string, string]> = {
        element: document.createElement("div"),
        menuToState: () => <[string, string]>children.map((c) => c.menuToState())
    }
    editor.element.appendChild(children[0].element);
    editor.element.appendChild(children[1].element);
    return editor;
}

export function combineEditors<a, b>(
    st: [a, b], 
    gen1: (x: a) => FlashcardGenEditor<a>,
    gen2: (x: b) => FlashcardGenEditor<b>): 
    FlashcardGenEditor<[a, b]> {
    var children = [gen1(st[0]), gen2(st[1])];
    var editor: FlashcardGenEditor<[a, b]> = {
        element: document.createElement("div"),
        menuToState: () => [<a>children[0].menuToState(), <b>children[1].menuToState()]
    }
    editor.element.appendChild(children[0].element);
    editor.element.appendChild(children[1].element);
    return editor;
}

export function fixedNumEditors<a>(ls: a[], ed: (st: a) => FlashcardGenEditor<a>):
    FlashcardGenEditor<a[]> {
    var children: FlashcardGenEditor<a>[] = [];
    var editor: FlashcardGenEditor<a[]> = {
        element: document.createElement("div"),
        menuToState: () => arrayReindex(children.map((c) => c.menuToState()))
    }
    
    var statePartEditorFactory = (statePart: a) => {
        var newEditor = ed(statePart);
        children.push(newEditor);
        editor.element.appendChild(newEditor.element);
    }
    for (var i in ls) {
        statePartEditorFactory(ls[i])
    }

    return editor;

}

export function multipleEditors<a>(ls: a[], empty: a, ed: (st: a) => FlashcardGenEditor<a>): 
    FlashcardGenEditor<a[]> {
    var children: FlashcardGenEditor<a>[] = [];
    var editor: FlashcardGenEditor<a[]> = {
        element: document.createElement("div"),
        menuToState: () => arrayReindex(children.map((c) => c.menuToState()))
    }
    
    var addBtn = document.createElement("button");
    addBtn.classList.add("add-new-field-button");
    addBtn.textContent = "Add another";
    var statePartEditorFactory = (statePart: a) => {
        var newEditor = ed(statePart);
        children.push(newEditor);
        var ind = children.length - 1;
        var statePartDiv = document.createElement("div");
        statePartDiv.appendChild(newEditor.element);
        newEditor.element.style.display = "inline-block";
        var delBtn = document.createElement("button");
        delBtn.textContent = "remove";
        delBtn.onclick = (e) => {
            delete children[ind];
            editor.element.removeChild(statePartDiv);
        }
        statePartDiv.appendChild(delBtn);
        editor.element.appendChild(statePartDiv);
    }
    addBtn.onclick = (e) => { statePartEditorFactory(empty); };
    editor.element.appendChild(addBtn);
    for (var i in ls) {
        statePartEditorFactory(ls[i])
    }

    return editor;
}

function buildCardDiv<a>(card: Flashcard<a>) {
    var cardDiv = document.createElement("div");
    cardDiv.classList.add("flashcard");
    cardDiv.textContent = card.prompt;
    cardDiv.id = card.uuid;
    var fontSize = 100.0/(10.0*Math.log(10+card.prompt.length));
    cardDiv.style.fontSize = `${fontSize}vw`; 
    return cardDiv;
}

function slideCardIntoDiv<a>(divId: string, card: Flashcard<a>) {
    var container = document.getElementById(divId);
    var cardDiv = buildCardDiv(card);
    cardDiv.classList.add("flashcard-slide-in");
    cardDiv!.onanimationend = () => { cardDiv!.classList.remove("flashcard-slide-in"); };
    container?.appendChild(cardDiv); 
}

function slideCardOutOfDiv(cardId: string) {
    var cardDiv = document.getElementById(cardId);
    cardDiv?.classList.add("flashcard-slide-out");
    cardDiv!.onanimationend = () => { cardDiv!.style.display = "none"; };
}

function markCardIncorrect(cardId: string) {
    var cardDiv = document.getElementById(cardId);
    cardDiv?.classList?.add("flashcard-incorrect");
    cardDiv!.onanimationend = () => { cardDiv!.classList.remove("flashcard-incorrect"); };
    cardDiv!.offsetHeight; 
}
    
function setHintText(hint: string) {
    var hintBox = <HTMLInputElement>document.getElementById("flashcard-answer-hint");
    hintBox!.value = hint;
}

function updateProgressBar<a, s>(fgen: FlashcardGenerator<a, s>) {
    var progressBar = document.getElementById("flashcard-progress-bar")!;
    var cardsDone: number = fgen.history.length;
    var cardsCorrect = fgen.history.filter((x) => x[1]).length;
    var percent = Math.floor(100*cardsCorrect/cardsDone);
    var progressMsg = `${cardsDone} cards complete, ${percent}% correct`;
    progressBar.textContent = progressMsg;
    progressBar.style.backgroundColor = `rgba(${225-percent/3},${155+percent}, 150)`;
}

function saveDeckToLocal<a, s>(deckname: string, fgen: FlashcardGenerator<a, s>) {
    var decks = JSON.parse(<string>localStorage.getItem("decks"));
    decks[deckname] = fgen.state;
    localStorage.setItem("decks", JSON.stringify(decks));
}

function loadDeckFromLocal<a, s>(deckname: string, fgen: FlashcardGenerator<a, s>): boolean {
    if (localStorage.getItem("decks") === null) {
        localStorage.setItem("decks", "{}");
    }
    var decks = JSON.parse(<string>localStorage.getItem("decks"));
    if (typeof(decks[deckname]) == typeof(fgen.state)) {
        fgen.state = decks[deckname];
        return true;
    }
    return false;
}

export function runFlashcardController<a, s>(fgen: FlashcardGenerator<a, s>) {
    loadDeckFromLocal(fgen.name, fgen);

    var isCorrect = false;
    var guessBox = <HTMLInputElement>document.getElementById("flashcard-answer-input");
    var guessController = function(card: Flashcard<a>) {
        var correct = isGuessCorrect(card, guessBox!.value);
        isCorrect = correct;
        if (!correct) {
            setHintText(card.hint);
            markCardIncorrect(card.uuid);
        }
        return isCorrect; 
    }
    var editDeck = <HTMLInputElement>document.getElementById("deck-edit-button");
    editDeck.onclick = (e) => {
        var editor = fgen.editor(fgen.state);
        var deckEditor = document.getElementById("flashcard-deck-editor")!;
        var deckEditorOverlay = document.getElementById("flashcard-deck-editor-overlay")!;
        deckEditor.replaceChildren(editor.element);
        deckEditorOverlay.style.display = "block";
        var closeEditor = <HTMLInputElement>document.getElementById("flashcard-deck-editor-close");
        var deckOverlay = <HTMLInputElement>document.getElementById("flashcard-deck-editor-overlay")!;
        closeEditor.onclick = (e) => {
            fgen.state = editor.menuToState();
            deckOverlay.style.display = "none";
            saveDeckToLocal(fgen.name, fgen);
            flashcardLoop();
        }
    }
    var lastCardId: string = null!;
    var flashcardLoop = () => {
        isCorrect = false;
        document.getElementById(lastCardId)?.remove();
        var card = nextCard(fgen);
        lastCardId = card.uuid;
        slideCardIntoDiv("flashcard-container", card);
        setHintText("");
        var firstCorrect = true;
        var addedToHistory = false;
        guessBox!.onkeydown = (e) => {
            if (e.key == "Enter") {
                if (guessController(card)) {
                    guessBox.value = "";
                    slideCardOutOfDiv(card.uuid);
                    setTimeout(() => flashcardLoop(), 1000);
                } else {
                    guessBox.oninput = () => { guessBox.value = ""; guessBox.oninput = () => {}; }
                    firstCorrect = false;
                }
                if (!addedToHistory) {
                    fgen.history.push([card, firstCorrect]);
                    fgen.state = fgen.updater(firstCorrect, card, fgen.state);
                    addedToHistory = true;
                    updateProgressBar(fgen);
                }
            }
        }
    }
    flashcardLoop(); 
}

// Demos

var additionQuizzer: FlashcardGenerator<[number, number], number> = {
    name: "addition-quiz",
    ftemp: {
        generator: function(seed: [number, number]) {
            return {
                params: seed,
                prompt: `${seed[0]} + ${seed[1]}`,
                answers: [`${seed[0] + seed[1]}`],
                hint: `${seed[0] + seed[1]}`,
                uuid: guidGenerator()
            }
        }
    },
    state: 10,
    seeder: function(m: number) {
        var g = () => Math.floor(Math.random() * m);
        return [g(), g()];
    },
    updater: (correct, card, st) => st,
    history: [],
    editor: (m: number) => {
        var editor = {
            element: document.createElement("div"),
            menuToState: () => +(<HTMLInputElement>editor.element.children[0]).value
        };
        var inputNum = document.createElement("input");
        editor.element.textContent = "Maximum value: ";
        inputNum.type = "number";
        inputNum.min = "1";
        inputNum.max = "1000";
        inputNum.value = m.toString();
        editor.element.appendChild(inputNum);
        return editor;
    }
}

var ruPrepQuizzer = evilFGen("evil-russian-prepositions", [
    ["forest", "лес", ["simple"]],
    ["garden", "сад", ["simple"]],
    ["house", "дом", ["simple"]],
    ["in the forest", "в лесу", ["prep"]],
    ["in the garden", "в саду", ["prep"]],
    ["in the house", "в доме", ["prep"]]
], 0.9);
