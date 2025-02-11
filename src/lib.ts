// Types

export interface IDictionary<a> {
    [key: string]: a;
}

export type Flashcard<a> = {
    params: a,
    prompt: string,
    answers: string[],
    hint: string,
    info?: string,
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
    ftemp: FlashcardTemplate<a, s>,
    state: s,
    seeder: (st: s) => a,
    updater: (correct: boolean, answer: string, card: Flashcard<a>, st: s) => s,
    history: [Flashcard<a>, boolean][],
    editor: (st: s) => FlashcardGenEditor<s>
}

export type FlashcardDeckView = {
    color: string
}

export type FlashcardDeck<s> = {
    name: string,
    slug: string,
    decktype: string,
    resources: string[],
    view: FlashcardDeckView,
    state: s
}

export type FlashcardGenRegistry = {
    decks: IDictionary<FlashcardDeck<any>>,
    generators: IDictionary<FlashcardGenerator<any, any>>,
    resources: IDictionary<() => Promise<any>>
}

// Utilities

export function fconst<a, b>(y: b): (x: a) => b {
    return (_) => y;
}

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

export function ensureKeys<a>(keys: string[], defaultVal: a, d: IDictionary<a>): IDictionary<a> {
    for (var i in keys) {
        var k = keys[i];
        if (!(k in d)) d[k] = defaultVal;
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

// https://stackoverflow.com/questions/3665115/how-to-create-a-file-in-memory-for-user-to-download-but-not-through-server
function downloadText(filename: string, text: string) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

// Logic

export function uniformRandomFGen(cards: [string, string][]): 
    FlashcardGenerator<number, [string, string][]> {
    var gen = {
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
        updater: (correct: boolean, answer: string, card: Flashcard<number>, st: [string, string][]) => st,
        history: [],
        editor: (ls: [string, string][]) => multipleEditors(ls, ["", ""], doubleTextFieldEditor)
    }
    return gen;
}

export function evilFGen(cards: [string, string, string[]][], alpha: number): 
    FlashcardGenerator<number, [[string, string, string[]][], IDictionary<number>]> {
    return {
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
        updater: function(correct, answer, card, st) {
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

export function boolEditor(label: string, val: boolean): FlashcardGenEditor<boolean> {
    var checkbox = document.createElement("input");
    var editor: FlashcardGenEditor<boolean> = {
        element: null!,
        menuToState: () => (<HTMLInputElement>checkbox).checked
    };
    (<HTMLInputElement>checkbox).type = "checkbox";
    (<HTMLInputElement>checkbox).checked = val;
    var guid = guidGenerator();
    checkbox.id = guid;
    var elementLabel = document.createElement("label");
    elementLabel.htmlFor = guid;
    elementLabel.textContent = label;
    var boxWithLabel = document.createElement("div");
    boxWithLabel.appendChild(checkbox);
    boxWithLabel.appendChild(elementLabel);
    editor.element = boxWithLabel;
    return editor;
}

export function floatEditor(label: string, val: number, min: number, max: number): 
    FlashcardGenEditor<number> {
    var slider = document.createElement("input");
    slider.type = "range";
    slider.min = min.toString();
    slider.max = max.toString();
    slider.step = ((max-min)/100.0).toString();
    slider.value = val.toString();
    slider.style.display = "inline-block";
    slider.style.verticalAlign = "middle";
    var guid = guidGenerator();
    slider.id = guid;
    var sliderLabel = document.createElement("label");
    sliderLabel.textContent = label;
    sliderLabel.htmlFor = guid;
    sliderLabel.style.verticalAlign = "middle";
    var guid = guidGenerator();
    var contDiv = document.createElement("div");
    [slider, sliderLabel].map((el) => contDiv.appendChild(el));
    return {
        element: contDiv,
        menuToState: () => parseFloat(slider.value)
    }
}

export function scrollNumberEditor(label: string, val: number, min: number, max: number, step: number):
    FlashcardGenEditor<number> {
    var scroller = document.createElement("input");
    scroller.type = "number";
    scroller.max = max.toString();
    scroller.min = min.toString();
    scroller.value = val.toString();
    scroller.step = step.toString();
    var scrollerLabel = document.createElement("a");
    scrollerLabel.textContent = label;
    var scrollerCont = document.createElement("div");
    scrollerCont.appendChild(scrollerLabel);
    scrollerCont.appendChild(scroller);
    scrollerCont.style.display = "block";
    return {
        element: scrollerCont,
        menuToState: () => parseFloat(scroller.value)
    }
}

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

export function tableEditor<a>(
    st: a[][],
    rownames: string[],
    colnames: string[],
    gen: (x: a) => FlashcardGenEditor<a>):
    FlashcardGenEditor<a[][]> {
    var rows = st.length;
    var cols = st[0].length;
    var tbl = document.createElement("table");
    var eds: FlashcardGenEditor<a>[][] = [];
    for (var i = 0; i < rows+1; i++) {
        var tblrow = document.createElement("tr");
        for (var j = 0; j < cols+1; j++) {
            var tblcell = document.createElement("td");
            if (i === 0 && j !== 0) {
                tblcell.textContent = colnames[j-1];
            } else if (i !== 0 && j === 0) {
                tblcell.textContent = rownames[i-1];
            } else if (i !== 0 && j !== 0) {
                var ed = gen(st[i-1][j-1]);
                tblcell.appendChild(ed.element)
                eds[eds.length-1].push(ed);
            }
            tblrow.appendChild(tblcell);
        }
        if (i < rows) {
            eds.push([]);
        }
        tbl.appendChild(tblrow);
    }
    return {
        element: tbl,
        menuToState: () => eds.map((r) => r.map((ed) => ed.menuToState()))
    }
}

export function makeTranslationEditor(ls: [string, string][], validator: (s: string) => boolean):
    FlashcardGenEditor<[string, string][]> {
    return multipleEditors(
        ls,
        ["", ""],
        (item) => combineEditors(
            item,
            (s: string) => singleTextFieldEditor(s),
            (s: string) => validatedTextFieldEditor(s, validator),
        ),
        true,
        (s, cd) => cd[0].includes(s) || cd[1].includes(s)
    )
}

export function fixedNumEditors<a, b>(ls: a[], ed: (st: a) => FlashcardGenEditor<b>):
    FlashcardGenEditor<b[]> {
    var children: FlashcardGenEditor<b>[] = [];
    var editor: FlashcardGenEditor<b[]> = {
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

export function multipleEditors<a>(
    ls: a[], 
    empty: a, 
    ed: (st: a) => FlashcardGenEditor<a>,
    includeSearch: boolean = false,
    searchFxn: (s: string, st: a) => boolean = (s: string, x: a) => true): 
    FlashcardGenEditor<a[]> {
    var children: FlashcardGenEditor<a>[] = [];
    var editor: FlashcardGenEditor<a[]> = {
        element: document.createElement("div"),
        menuToState: () => arrayReindex(children.map((c) => c.menuToState()))
    }
    
    var addBtn = document.createElement("button");
    addBtn.classList.add("add-new-field-button");
    addBtn.textContent = "Add another";
    var statePartDivs: HTMLElement[] = [];
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
            delete statePartDivs[ind];
            editor.element.removeChild(statePartDiv);
        }
        statePartDiv.appendChild(delBtn);
        editor.element.appendChild(statePartDiv);
        statePartDivs.push(statePartDiv);
    }
    addBtn.onclick = (e) => { statePartEditorFactory(empty); };
    editor.element.appendChild(addBtn);

    if (includeSearch) {
        var searchBar = document.createElement("input");
        searchBar.placeholder = "Search...";
        searchBar.oninput = (e) => {
            for (var i in children) {
                var ed = children[i];
                if (searchFxn(searchBar.value, ed.menuToState())) {
                    statePartDivs[i].style.display = "block";
                } else {
                    statePartDivs[i].style.display = "none";
                }
            }        
        }
        editor.element.appendChild(searchBar);
    }

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
    if (card.info !== null) {
        var cardInfo = document.createElement("span");
        cardInfo.classList.add("flashcard-info");
        cardInfo.textContent = card.info!;
        cardDiv.appendChild(cardInfo);
    }
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

function clearCardDiv() {
    var cardDiv = document.getElementsByClassName("flashcard")[0];
    cardDiv?.remove();
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

function generateDeckNameEditor(deck: FlashcardDeck<any>): FlashcardGenEditor<FlashcardDeck<any>> {
    var nicknameEditor = singleTextFieldEditor(deck.name);
    var colorEditor = singleTextFieldEditor(deck.view.color); 
    var closeBtn = document.createElement("button");
    closeBtn.textContent = "Save";
    var contDiv = document.createElement("div");
    [nicknameEditor.element, colorEditor.element, closeBtn].map((el) => contDiv.appendChild(el));
    contDiv.onclick = (e) => {
        e.cancelBubble = true;
        if (e.stopPropagation) e.stopPropagation();
    };
    var ed = {
        element: contDiv,
        menuToState: () => {
            deck.name = nicknameEditor.menuToState();
            deck.view.color = colorEditor.menuToState();
            contDiv.remove();
            return deck;
        }
    }
    return ed;
}

function generateDecklistMenu(
    decklist: IDictionary<FlashcardDeck<any>>,
    onfinish: (st: IDictionary<FlashcardDeck<any>>) => void) {

    var decklistEditor = <HTMLElement>document.getElementById("flashcard-decklist-editor");
    decklistEditor.innerHTML = "";
    var decklistOverlay = <HTMLElement>document.getElementById("flashcard-decklist-overlay");
   
    Object.keys(decklist).sort(); 
    for (var k in decklist) {
        var deckDiv = document.createElement("div");
        var slug = decklist[k].slug;
        deckDiv.textContent = decklist[k].name;
        deckDiv.classList.add("deck-editor-entry");
        if (decklist[k].view !== undefined) {
            deckDiv.style.backgroundColor = decklist[k].view!.color;
        }
        deckDiv.onclick = ((s) => (e) => {
            decklistOverlay.style.display = "none";
            onfinish(decklist);
            runFlashcardController(s);
        })(slug);
        var deckEditBtn = document.createElement("button");
//        deckEditBtn.textContent = "Rename";
        deckEditBtn.innerHTML = "<img src='/edit.png'/>";
        deckEditBtn.classList.add("deck-editor-button");
        deckEditBtn.onclick = ((dk, deckDiv) => (e) => {
            var ed = generateDeckNameEditor(dk);
            var closeBtn = ed.element.getElementsByTagName("button")[0];
            closeBtn.onclick = (e) => {
                var newDeck = ed.menuToState();
                decklist[dk.slug] = newDeck;
                generateDecklistMenu(decklist, onfinish);
            };
            deckDiv.replaceChildren(ed.element);
            e.cancelBubble = true;
            if (e.stopPropagation) e.stopPropagation();
        })(decklist[k], deckDiv);
        var deckDeleteBtn = document.createElement("button");
        deckDeleteBtn.classList.add("deck-editor-button");
//        deckDeleteBtn.textContent = "Delete";
        deckDeleteBtn.innerHTML = "<img src='/trash.png'/>";
        deckDeleteBtn.onclick = ((dk) => (e) => {
            var confirmation = confirm(`Are you sure you want to delete "${dk.name}"?`);
            if (confirmation) {
                delete decklist[dk.slug];
            }
            e.cancelBubble = true;
            if (e.stopPropagation) e.stopPropagation();
            generateDecklistMenu(decklist, onfinish);
        })(decklist[k]);
        var deckCloneBtn = document.createElement("button");
        deckCloneBtn.classList.add("deck-editor-button");
//        deckCloneBtn.textContent = "Clone";
        deckCloneBtn.innerHTML = "<img src='/copy.png'/>";
        deckCloneBtn.onclick = ((dk) => (e) => {
            var guid = guidGenerator();
            var deckClone = <FlashcardDeck<any>>JSON.parse(JSON.stringify(dk));
            deckClone.slug = guid;
            decklist[guid] = deckClone;
            e.cancelBubble = true;
            if (e.stopPropagation) e.stopPropagation();
            generateDecklistMenu(decklist, onfinish);
        })(decklist[k])
        deckDiv.appendChild(deckEditBtn);
        deckDiv.appendChild(deckDeleteBtn);
        deckDiv.appendChild(deckCloneBtn);
        decklistEditor.appendChild(deckDiv);
    }
}

// Saving and loading decks

export function loadRegistryFromLocal() {
    var registryStr = localStorage.getItem("decks");
    if (!registryStr) {
        var starterRegistry = {
            decks: defaultDecks,
            generators: providedGenerators,
            resources: indexedResources
        }
        return starterRegistry;
    }
    var registry = JSON.parse(registryStr);
    return {
        decks: <IDictionary<FlashcardDeck<any>>>registry,
        generators: providedGenerators,
        resources: indexedResources
    };
}

export function saveDeckToLocal(
    reg: FlashcardGenRegistry,
    deck: FlashcardDeck<any>,
    gen: FlashcardGenerator<any, any>) {
    reg.decks[deck.slug].state = gen.state;
    var registryStr = JSON.stringify(reg.decks);
    localStorage.setItem("decks", registryStr);
}

export async function loadDeckGenFromRegistry(reg: FlashcardGenRegistry, slug: string) {
    var deck: FlashcardDeck<any> | undefined = reg.decks[slug];
    if (deck === undefined) {
        return null;
    }
    var gen: FlashcardGenerator<any, any> | undefined = reg.generators[deck.decktype];
    if (deck === undefined) {
        return null;
    }
    gen.state = deck.state;
    await Promise.all(deck.resources.map((rname) => reg.resources[rname]()));
    return gen;
}

// export function runFlashcardController<a, s>(fgen: FlashcardGenerator<a, s>) {
export async function runFlashcardController(slug: string) {
    var reg: FlashcardGenRegistry | null = loadRegistryFromLocal();
    if (reg === null) {
        console.log("Could not load flashcard registry.");
        return;
    }
    var fgenMaybe: FlashcardGenerator<any, any> | null = await loadDeckGenFromRegistry(reg, slug);
    if (fgenMaybe === null) {
        console.log("Could not load flashcard deck.");
        return;
    }
    var fgen: FlashcardGenerator<any, any> = fgenMaybe!;

    var isCorrect = false;
    var guessBox = <HTMLInputElement>document.getElementById("flashcard-answer-input");
    var guessController = function(card: Flashcard<any>) {
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
            saveDeckToLocal(reg!, reg!.decks[slug], fgen);
            flashcardLoop();
        }
    }
    var decklistBtn = <HTMLElement>document.getElementById("deck-list-button");
    decklistBtn.onclick = (e) => {
        clearCardDiv();
        var decklistOverlay = <HTMLElement>document.getElementById("flashcard-decklist-overlay");
        generateDecklistMenu(reg!.decks, (ds) => {
            localStorage.setItem("decks", JSON.stringify(ds));
        });
        decklistOverlay.style.display = "block";
    }
    var exportBtn = <HTMLElement>document.getElementById("export-deck-button");
    exportBtn.onclick = (e) => {
        downloadText(`${slug}.txt`, JSON.stringify(reg!.decks[slug]));
    }
    var importBtn = <HTMLElement>document.getElementById("import-deck-button");
    var fileUploadInput = <HTMLElement>document.getElementById("deck-upload-file");
    importBtn.onclick = (e) => {
        fileUploadInput.click();
        fileUploadInput.onchange = (e) => {
            var files = (<HTMLInputElement>fileUploadInput).files;
            if (files === null)
                return;
            var file = files[0];
            if (file === null)
                return;
            var reader = new FileReader();
            reader.onload = (e) => {
                fgen.state = JSON.parse(<string>e.target!.result).state;
                saveDeckToLocal(reg!, reg!.decks[slug], fgen);
            };
            reader.readAsText(file, "UTF-8");
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
            if (e.key == "Enter") {     // Check answer correctness
                if (guessController(card)) {
                    var finalAnswer = guessBox.value;
                    guessBox.value = "";
                    slideCardOutOfDiv(card.uuid);
                    setTimeout(() => flashcardLoop(), 1000);
                    if (!addedToHistory) {
                        fgen.history.push([card, firstCorrect]);
                        fgen.state = fgen.updater(firstCorrect, finalAnswer, card, fgen.state);
                        addedToHistory = true;
                        updateProgressBar(fgen);
                        saveDeckToLocal(reg!, reg!.decks[slug], fgen);
                    }
                } else {
                    guessBox.oninput = (e) => { guessBox.value = guessBox.value.slice(-1); guessBox.oninput = () => {}; }
                    firstCorrect = false;
                }
            } else if (e.key == "ArrowUp") { // Card correct override
                slideCardOutOfDiv(card.uuid);
                setTimeout(() => flashcardLoop(), 1000);
                fgen.history.push([card, true]);
                fgen.state = fgen.updater(true, "", card, fgen.state);
                updateProgressBar(fgen);
                saveDeckToLocal(reg!, reg!.decks[slug], fgen);
                guessBox.value = "";
            }
        }
    }
    flashcardLoop(); 
}

// Demos

export var defaultDeckView: FlashcardDeckView = {
    color: "#eeeeff"
};

export var defaultDecks: IDictionary<FlashcardDeck<any>> = {};
export var providedGenerators: IDictionary<FlashcardGenerator<any, any>> = {};
export var indexedResources: IDictionary<() => Promise<any>> = {};
