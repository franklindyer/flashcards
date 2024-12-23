// Types

interface IDictionary<a> {
    [key: string]: a;
}

type Flashcard<a> = {
    params: a,
    prompt: string,
    answers: string[],
    hint: string,
    uuid: string
}

type FlashcardTemplate<a, s> = {
    generator: (seed: a, st: s) => Flashcard<a>
}

type FlashcardGenEditor<s> = {
    element: HTMLElement,
    menuToState: () => s
}

type FlashcardGenerator<a, s> = {
    ftemp: FlashcardTemplate<a, s>,
    state: s,
    seeder: (st: s) => a,
    updater: (correct: boolean, card: Flashcard<a>, st: s) => s,
    history: [Flashcard<a>, boolean][],
    editor: (st: s) => FlashcardGenEditor<s>
}

// Utilities

// https://stackoverflow.com/questions/6860853/generate-random-string-for-div-id
function guidGenerator(): string {
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

function uniformRandomFGen(cards: [string, string][]): 
    FlashcardGenerator<number, [string, string][]> {
    var gen = {
        ftemp: {
            generator: function(seed: number, st: [string, string][]) {
                console.log(seed);
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
            console.log(st);
            console.log(st.length);
            return Math.floor(Math.random() * arrayLen(st));
        },
        updater: (correct: boolean, card: Flashcard<number>, st: [string, string][]) => st,
        history: [],
        editor: (ls: [string, string][]) => multipleEditors(ls, ["", ""], doubleTextFieldEditor)
    }
    return gen;
}

/*
function evilFGen(cards: [string, string, [string]][], alpha: number): 
    FlashcardGenerator<number, [[string, string, [string]][], IDictionary<number>]> {
    return {
        ftemp: {
            generator: function(seed: number, st) {
                return {
                    params: seed,
                    prompt: [seed][0],
                    answers: [st[0][seed][1]],
                    hint: st[0][seed][1],
                    uuid: guidGenerator()
                }
            }
        },
        state: [cards, zeroDict([...new Set(cards.map((c) => c[2]).flat())])],
        seeder: function(st) {
            var keys = Object.keys(st).map((n) => +n);
            var weights = st[1].map((card) => 1 + card[2].map((p) => st[p]).reduce((a, b) => a + b, 0));
            return weightedRandomIndex(weights);
        },
        updater: function(correct, card, st) {
            if (correct)
                return st;
            var props = st[0][card.params][2];
            for (var k in st) {
                st[1][k] = alpha*st[1][k];
            }
            for (var i in props) {
                st[1][props[i]] += 1;
            }
            return st;
        },
        history: []
    }
}
*/

function nextCard<a, s>(fgen: FlashcardGenerator<a, s>): Flashcard<a> {
    console.log(fgen.state);
    var seed = fgen.seeder(fgen.state);
    console.log(seed); 
    var card = fgen.ftemp.generator(seed, fgen.state);
    return card;
}

function isGuessCorrect<a>(card: Flashcard<a>, guess: string): boolean {
    return card.answers.indexOf(guess) > -1;
}

// View

function singleTextFieldEditor(txt: string): FlashcardGenEditor<string> {
    var editor: FlashcardGenEditor<string> = {
        element: document.createElement("input"),
        menuToState: () => (<HTMLInputElement>editor.element).value
    };
    (<HTMLInputElement>editor.element).value = txt;
    return editor;
}

function doubleTextFieldEditor(txts: [string, string]): FlashcardGenEditor<[string, string]> {
    var children = [singleTextFieldEditor(txts[0]), singleTextFieldEditor(txts[1])];
    var editor: FlashcardGenEditor<[string, string]> = {
        element: document.createElement("div"),
        menuToState: () => <[string, string]>children.map((c) => c.menuToState())
    }
    editor.element.appendChild(children[0].element);
    editor.element.appendChild(children[1].element);
    return editor;
}

function multipleEditors<a>(ls: a[], empty: a, ed: (st: a) => FlashcardGenEditor<a>): 
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

function runFlashcardController<a, s>(fgen: FlashcardGenerator<a, s>) {
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
        }
    }
    var flashcardLoop = () => {
        isCorrect = false;
        var card = nextCard(fgen);
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

/* var additionQuizzer: FlashcardGenerator<[number, number], null> = {
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
    state: null,
    seeder: function(_: null) {
        var g = () => Math.floor(Math.random() * 100);
        return [g(), g()];
    },
    updater: (correct, card, st) => null,
    history: [],
    editor: function(_): FlashcardGenEditor<null> {
        element: null!,
        stateToMenu: (_) => null!,
        menuToState: () => null!
    }
} */

/*
var ruPrepQuizzer: FlashcardGenerator<number, IDictionary<number>> = evilFGen([
    ["forest", "лес", ["simple"]],
    ["garden", "сад", ["simple"]],
    ["house", "дом", ["simple"]],
    ["in the forest", "в лесу", ["prep"]],
    ["in the garden", "в саду", ["prep"]],
    ["in the house", "в доме", ["prep"]]
], 0.9);
*/
var ruPrepQuizzer: FlashcardGenerator<number, [string, string][]> = uniformRandomFGen([
    ["forest", "лес"],
    ["garden", "сад"],
    ["house", "дом"],
    ["in the forest", "в лесу"],
    ["in the garden", "в саду"],
    ["in the house", "в доме"]
]);

window.onload = () => { runFlashcardController(ruPrepQuizzer); }
