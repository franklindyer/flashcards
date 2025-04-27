var flashcards;
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 994:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const utils_1 = __webpack_require__(185);
const flashcard_1 = __webpack_require__(88);
const flashcard_generator_1 = __webpack_require__(808);
const flashcard_template_1 = __webpack_require__(791);
const editor_1 = __webpack_require__(43);
const flashcard_deck_1 = __webpack_require__(836);
class ClozeFlashcardGen extends flashcard_generator_1.FlashcardGen {
    getGenName() { return "cloze-puzzles"; }
    getNextCard(state) {
        var key = Object.keys(state.cards)[Math.floor(Math.random() * Object.keys(state.cards).length)];
        var group = state.cards[key];
        return group.cards[Math.floor(Math.random() * Object.keys(group.cards).length)];
    }
    updateState(state, cardData, result) {
        if (result == flashcard_generator_1.FlashcardResult.Unanswered)
            return state;
        var correct = (result == flashcard_generator_1.FlashcardResult.Correct);
        if (correct) {
            state.cards[cardData.group].correct += 1;
        }
        else {
            state.cards[cardData.group].incorrect += 1;
        }
        return state;
    }
}
class ClozeBasicTemplate extends flashcard_template_1.FlashcardTemplate {
    generateCard(data) {
        var el = document.createElement("div");
        el.style.display = "block";
        el.style.textAlign = "center";
        var aUpper = document.createElement("p");
        var aLower = document.createElement("p");
        aUpper.style.display = "block";
        aLower.style.display = "block";
        el.appendChild(aUpper);
        el.appendChild(document.createElement("hr"));
        el.appendChild(aLower);
        var targetWords = [];
        aUpper.textContent = data.upper.replace(/\{\{([^\{\}]+)\}\}/, (match, p1) => {
            targetWords.push(p1);
            return "___";
        });
        var answer = targetWords.join(", ");
        aLower.textContent = data.lower;
        var fontSize = 100.0 / (10.0 * Math.log(10 + aUpper.textContent.length));
        aUpper.style.fontSize = `${fontSize}vw`;
        aLower.style.fontSize = `${0.7 * fontSize}vw`;
        var fl = new flashcard_1.Flashcard(el, (attempt) => answer == attempt, answer);
        return fl;
    }
}
function makeClozeEditor(state) {
    var container = document.createElement("div");
    var loadCards = (s) => {
        if (s.length > 0) {
            var newCardDict = {};
            var infoList = JSON.parse(s);
            console.log(infoList);
            for (var i in Object.keys(infoList)) {
                var k = Object.keys(infoList)[i];
                newCardDict[k] = {
                    key: k,
                    cards: infoList[k].map((c) => {
                        return {
                            upper: c["prompt"],
                            lower: c["translation"],
                            guid: (0, utils_1.guidGenerator)(),
                            group: k
                        };
                    }),
                    correct: Object.keys(state.cards).includes(k) ? state.cards[k].correct : 0,
                    incorrect: Object.keys(state.cards).includes(k) ? state.cards[k].incorrect : 0
                };
            }
            state.cards = newCardDict;
        }
    };
    var deckSummary = document.createElement("div");
    var makeDeckSummary = () => {
        deckSummary.innerHTML = "";
        var keys = Object.keys(state.cards).sort();
        for (var i in keys) {
            var k = keys[i];
            var entryDiv = document.createElement("div");
            entryDiv.classList.add("deck-editor-info-entry");
            var entryKey = document.createElement("span");
            entryKey.textContent = k;
            var entryInfo = document.createElement("span");
            entryInfo.textContent = `${state.cards[k].cards.length} puzzles`;
            entryInfo.style.float = "right";
            entryDiv.appendChild(entryKey);
            entryDiv.appendChild(entryInfo);
            deckSummary.appendChild(entryDiv);
        }
    };
    makeDeckSummary();
    var fileEd = (0, editor_1.fileUploadEditor)("Upload cloze puzzles", (s) => {
        loadCards(s);
        makeDeckSummary();
    });
    container.appendChild(fileEd.element);
    container.appendChild(deckSummary);
    return {
        element: container,
        menuToState: () => {
            var deckStr = fileEd.menuToState();
            if (deckStr.length > 0) {
                var newCardDict = {};
                var infoList = JSON.parse(deckStr);
                console.log(infoList);
                for (var i in Object.keys(infoList)) {
                    var k = Object.keys(infoList)[i];
                    newCardDict[k] = {
                        key: k,
                        cards: infoList[k].map((c) => {
                            return {
                                upper: c["prompt"],
                                lower: c["translation"],
                                guid: (0, utils_1.guidGenerator)(),
                                group: k
                            };
                        }),
                        correct: Object.keys(state.cards).includes(k) ? state.cards[k].correct : 0,
                        incorrect: Object.keys(state.cards).includes(k) ? state.cards[k].incorrect : 0
                    };
                }
                state.cards = newCardDict;
            }
            return state;
        }
    };
}
var clozeDefaultState = {
    cards: {
        "gehen": {
            key: "gehen",
            cards: [
                {
                    group: "gehen",
                    guid: (0, utils_1.guidGenerator)(),
                    upper: "Ich {{gehe}} ins Kino.",
                    lower: "I go to the movies."
                },
                {
                    group: "gehen",
                    guid: (0, utils_1.guidGenerator)(),
                    upper: "Wohin {{gehst}} du?",
                    lower: "Where are you going?"
                }
            ],
            correct: 0,
            incorrect: 0
        },
        "haben": {
            key: "haben",
            cards: [
                {
                    group: "haben",
                    guid: (0, utils_1.guidGenerator)(),
                    upper: "Ich {{habe}} einen Hund.",
                    lower: "I have a dog."
                },
                {
                    group: "haben",
                    guid: (0, utils_1.guidGenerator)(),
                    upper: "{{Hast}} du einen Hund?",
                    lower: "Do you have a dog?"
                }
            ],
            correct: 0,
            incorrect: 0
        }
    }
};
(0, flashcard_deck_1.registerDeckType)(new ClozeFlashcardGen(), new ClozeBasicTemplate(), makeClozeEditor, "cloze-quizzer", "Simple German cloze quizzer", clozeDefaultState);


/***/ }),

/***/ 79:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.generateDecklistMenu = generateDecklistMenu;
exports.setupDecklistMenu = setupDecklistMenu;
const utils_1 = __webpack_require__(185);
const flashcard_deck_1 = __webpack_require__(836);
const editor_1 = __webpack_require__(43);
const fs_1 = __webpack_require__(633);
function generateDeckNameEditor(deck) {
    var nicknameEditor = (0, editor_1.singleTextFieldEditor)(deck.name);
    var colorEditor = (0, editor_1.singleTextFieldEditor)(deck.view.color);
    var closeBtn = document.createElement("button");
    closeBtn.textContent = "Save";
    var contDiv = document.createElement("div");
    [nicknameEditor.element, colorEditor.element, closeBtn].map((el) => contDiv.appendChild(el));
    contDiv.onclick = (e) => {
        e.cancelBubble = true;
        if (e.stopPropagation)
            e.stopPropagation();
    };
    var ed = {
        element: contDiv,
        menuToState: () => {
            deck.name = nicknameEditor.menuToState();
            deck.view.color = colorEditor.menuToState();
            contDiv.remove();
            return deck;
        }
    };
    return ed;
}
function generateDecklistMenu(decklist, onfinish) {
    var decklistEditor = document.getElementById("flashcard-decklist-editor");
    decklistEditor.innerHTML = "";
    var decklistOverlay = document.getElementById("flashcard-decklist-overlay");
    Object.keys(decklist).sort();
    for (var k in decklist) {
        var deckDiv = document.createElement("div");
        var slug = decklist[k].slug;
        var deckLabel = document.createElement("a");
        deckLabel.textContent = decklist[k].name;
        deckDiv.appendChild(deckLabel);
        deckDiv.classList.add("deck-editor-entry");
        if (decklist[k].view !== undefined) {
            deckDiv.style.backgroundColor = decklist[k].view.color;
        }
        deckDiv.onclick = ((s) => (e) => {
            decklistOverlay.style.display = "none";
            onfinish(decklist);
            (0, flashcard_deck_1.runDeck)(s);
        })(slug);
        var deckEditBtn = document.createElement("button");
        deckEditBtn.innerHTML = "<img src='/edit.png'/>";
        deckEditBtn.classList.add("deck-editor-button");
        deckEditBtn.onclick = ((dk, deckDiv) => (e) => {
            var ed = generateDeckNameEditor(dk);
            var closeBtn = ed.element.getElementsByTagName("button")[0];
            closeBtn.onclick = (e) => {
                var newDeck = ed.menuToState();
                decklist[dk.slug] = newDeck;
                (0, flashcard_deck_1.saveDeck)(dk.slug, () => { });
                generateDecklistMenu(decklist, onfinish);
            };
            deckDiv.replaceChildren(ed.element);
            e.cancelBubble = true;
            if (e.stopPropagation)
                e.stopPropagation();
        })(decklist[k], deckDiv);
        var deckDeleteBtn = document.createElement("button");
        deckDeleteBtn.classList.add("deck-editor-button");
        deckDeleteBtn.innerHTML = "<img src='/trash.png'/>";
        deckDeleteBtn.onclick = ((dk) => (e) => {
            var confirmation = confirm(`Are you sure you want to delete "${dk.name}"?`);
            if (confirmation) {
                delete decklist[dk.slug];
                (0, fs_1.deleteDeck)(dk.slug);
            }
            e.cancelBubble = true;
            if (e.stopPropagation)
                e.stopPropagation();
            generateDecklistMenu(decklist, onfinish);
        })(decklist[k]);
        var deckCloneBtn = document.createElement("button");
        deckCloneBtn.classList.add("deck-editor-button");
        deckCloneBtn.innerHTML = "<img src='/copy.png'/>";
        deckCloneBtn.onclick = ((dk) => (e) => {
            var guid = (0, utils_1.guidGenerator)();
            var deckClone = JSON.parse(JSON.stringify(dk));
            deckClone.slug = guid;
            decklist[guid] = deckClone;
            e.cancelBubble = true;
            if (e.stopPropagation)
                e.stopPropagation();
            generateDecklistMenu(decklist, onfinish);
        })(decklist[k]);
        deckDiv.appendChild(deckEditBtn);
        deckDiv.appendChild(deckDeleteBtn);
        deckDiv.appendChild(deckCloneBtn);
        decklistEditor.appendChild(deckDiv);
    }
}
function setupDecklistMenu() {
    var decksBtn = document.getElementById("deck-list-button");
    decksBtn.onclick = (e) => {
        var decklistOverlay = document.getElementById("flashcard-decklist-overlay");
        generateDecklistMenu(flashcard_deck_1.gDeckRegistry, (_) => { });
        decklistOverlay.style.display = "block";
    };
}


/***/ }),

/***/ 43:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.boolEditor = boolEditor;
exports.scrollNumberEditor = scrollNumberEditor;
exports.singleTextFieldEditor = singleTextFieldEditor;
exports.validatedTextFieldEditor = validatedTextFieldEditor;
exports.doubleTextFieldEditor = doubleTextFieldEditor;
exports.fileUploadEditor = fileUploadEditor;
exports.combineEditors = combineEditors;
exports.makeTranslationEditor = makeTranslationEditor;
exports.fixedNumEditors = fixedNumEditors;
exports.multipleEditors = multipleEditors;
const utils_1 = __webpack_require__(185);
/* Some useful state editors */
function boolEditor(label, val) {
    var checkbox = document.createElement("input");
    var editor = {
        element: null,
        menuToState: () => checkbox.checked
    };
    checkbox.type = "checkbox";
    checkbox.checked = val;
    var guid = (0, utils_1.guidGenerator)();
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
function scrollNumberEditor(label, val, min, max, step) {
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
    };
}
function singleTextFieldEditor(txt) {
    var editor = {
        element: document.createElement("input"),
        menuToState: () => editor.element.value
    };
    editor.element.value = txt;
    return editor;
}
function validatedTextFieldEditor(txt, pred = () => true) {
    var editor = singleTextFieldEditor(txt);
    editor.element.oninput = (e) => {
        if (!pred(editor.element.value)) {
            editor.element.style.backgroundColor = "#ffeeee";
        }
        else {
            editor.element.style.backgroundColor = "white";
        }
    };
    return editor;
}
function doubleTextFieldEditor(txts) {
    var children = [singleTextFieldEditor(txts[0]), singleTextFieldEditor(txts[1])];
    var editor = {
        element: document.createElement("div"),
        menuToState: () => children.map((c) => c.menuToState())
    };
    editor.element.appendChild(children[0].element);
    editor.element.appendChild(children[1].element);
    return editor;
}
function fileUploadEditor(label, callback) {
    var content = "";
    var container = document.createElement("div");
    var importBtn = document.createElement("button");
    importBtn.textContent = label;
    var fileUploadInput = document.createElement("input");
    fileUploadInput.type = "file";
    fileUploadInput.style.display = "none";
    container.appendChild(importBtn);
    container.appendChild(fileUploadInput);
    importBtn.onclick = (e) => {
        fileUploadInput.click();
        fileUploadInput.onchange = (e) => {
            var files = fileUploadInput.files;
            if (files == null)
                return;
            var file = files[0];
            if (file == null)
                return;
            var reader = new FileReader();
            reader.onload = (e) => {
                content = e.target.result;
                callback(content);
            };
            reader.readAsText(file, "UTF-8");
        };
    };
    return {
        element: container,
        menuToState: () => content
    };
}
function combineEditors(st, gen1, gen2) {
    var children = [gen1(st[0]), gen2(st[1])];
    var editor = {
        element: document.createElement("div"),
        menuToState: () => [children[0].menuToState(), children[1].menuToState()]
    };
    editor.element.appendChild(children[0].element);
    editor.element.appendChild(children[1].element);
    return editor;
}
function makeTranslationEditor(ls, validator) {
    return multipleEditors(ls, () => ["", ""], (item) => combineEditors(item, (s) => singleTextFieldEditor(s), (s) => validatedTextFieldEditor(s, validator)), true, (s, cd) => cd[0].includes(s) || cd[1].includes(s));
}
function fixedNumEditors(ls, ed) {
    var children = [];
    var editor = {
        element: document.createElement("div"),
        menuToState: () => (0, utils_1.arrayReindex)(children.map((c) => c.menuToState()))
    };
    var statePartEditorFactory = (statePart) => {
        var newEditor = ed(statePart);
        children.push(newEditor);
        editor.element.appendChild(newEditor.element);
    };
    for (var i in ls) {
        statePartEditorFactory(ls[i]);
    }
    return editor;
}
function multipleEditors(ls, empty, ed, includeSearch = false, searchFxn = (s, x) => true) {
    var children = [];
    var editor = {
        element: document.createElement("div"),
        menuToState: () => (0, utils_1.arrayReindex)(children.map((c) => c.menuToState()))
    };
    var addBtn = document.createElement("button");
    addBtn.classList.add("add-new-field-button");
    addBtn.textContent = "Add another";
    var listDiv = document.createElement("div");
    var statePartDivs = [];
    var statePartEditorFactory = (statePart) => {
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
            listDiv.removeChild(statePartDiv);
        };
        statePartDiv.appendChild(delBtn);
        listDiv.prepend(statePartDiv);
        statePartDivs.push(statePartDiv);
    };
    addBtn.onclick = (e) => { statePartEditorFactory(empty()); };
    editor.element.appendChild(addBtn);
    if (includeSearch) {
        var searchBar = document.createElement("input");
        searchBar.placeholder = "Search...";
        searchBar.oninput = (e) => {
            for (var i in children) {
                var ed = children[i];
                if (searchFxn(searchBar.value, ed.menuToState())) {
                    statePartDivs[i].style.display = "block";
                }
                else {
                    statePartDivs[i].style.display = "none";
                }
            }
        };
        editor.element.appendChild(searchBar);
    }
    editor.element.appendChild(listDiv);
    for (var i in ls) {
        statePartEditorFactory(ls[i]);
    }
    return editor;
}


/***/ }),

/***/ 836:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.gDeckRegistry = exports.gDeckTypeRegistry = void 0;
exports.saveDeck = saveDeck;
exports.loadAllDecks = loadAllDecks;
exports.runDeck = runDeck;
exports.registerDeckType = registerDeckType;
const utils_1 = __webpack_require__(185);
const fs_1 = __webpack_require__(633);
exports.gDeckTypeRegistry = {};
exports.gDeckRegistry = {};
function saveDeck(deckSlug, callback) {
    (0, fs_1.setDeckJSON)(deckSlug, JSON.stringify(exports.gDeckRegistry[deckSlug])).then((_) => callback());
}
function loadDeckIfExists(deckSlug) {
    return (0, fs_1.getDeckJSON)(deckSlug).then((j) => {
        if (j.length > 0) {
            var d = JSON.parse(j);
            exports.gDeckRegistry[d.slug] = d;
        }
    });
}
function loadAllDecks() {
    var deckSlugsP = (0, fs_1.getDeckSlugs)();
    var deckSlugs = Object.keys(exports.gDeckRegistry);
    return deckSlugsP.then((slugs) => Promise.all(slugs.map(loadDeckIfExists)));
}
/* Setup general-purpose menus */
function menuSetup(deckSlug) {
    var deck = exports.gDeckRegistry[deckSlug];
    var decktypeSlug = deck.type;
    var decktype = exports.gDeckTypeRegistry[decktypeSlug];
    var getState = () => exports.gDeckRegistry[deckSlug].state;
    var editBtn = document.getElementById("deck-edit-button");
    editBtn.onclick = () => {
        var editorOverlay = document.getElementById("flashcard-deck-editor-overlay");
        var editorCont = document.getElementById("flashcard-deck-editor");
        var editor = decktype.editor(getState());
        editorOverlay.style.display = "inline-block";
        editorCont.replaceChildren(editor.element);
        var doneBtn = document.getElementById("flashcard-deck-editor-close");
        doneBtn.onclick = () => {
            editorOverlay.style.display = "none";
            deck.state = editor.menuToState();
            exports.gDeckRegistry[deck.slug].state = deck.state;
            saveDeck(deck.slug, () => { });
            runDeck(deck.slug);
        };
    };
}
function importExportSetup(deckSlug, setDeck) {
    var importBtn = document.getElementById("import-deck-button");
    var fileUploadInput = document.getElementById("deck-upload-file");
    var exportBtn = document.getElementById("export-deck-button");
    importBtn.onclick = (e) => {
        fileUploadInput.click();
        fileUploadInput.onchange = (e) => {
            var files = fileUploadInput.files;
            if (files == null)
                return;
            var file = files[0];
            if (file == null)
                return;
            var reader = new FileReader();
            reader.onload = (e) => {
                setDeck(JSON.parse(e.target.result));
            };
            reader.readAsText(file, "UTF-8");
        };
    };
    exportBtn.onclick = (e) => {
        (0, utils_1.downloadText)(deckSlug, JSON.stringify(exports.gDeckRegistry[deckSlug]));
    };
}
function runDeck(deckSlug) {
    document.getElementById("flashcard-container").innerHTML = "";
    var getState = () => exports.gDeckRegistry[deckSlug].state;
    var setState = (state) => {
        exports.gDeckRegistry[deckSlug].state = state;
    };
    menuSetup(deckSlug);
    importExportSetup(deckSlug, (s) => {
        exports.gDeckRegistry[deckSlug] = s;
        saveDeck(deckSlug, () => {
            runDeck(deckSlug);
        });
    });
    var decktype = exports.gDeckTypeRegistry[exports.gDeckRegistry[deckSlug].type];
    decktype.gen.runLoop(getState, setState, () => saveDeck(deckSlug, () => { }));
}
/* Register a new type of deck */
function registerDeckType(gen, tpl, mkEd, defaultSlug, defaultName, defaultState) {
    gen.template = tpl;
    exports.gDeckTypeRegistry[gen.getGenName()] = {
        slug: gen.getGenName(),
        gen: gen,
        editor: mkEd
    };
    exports.gDeckRegistry[defaultSlug] = {
        name: defaultName,
        slug: defaultSlug,
        type: gen.getGenName(),
        state: defaultState,
        view: {
            color: "#ffffee"
        }
    };
}


/***/ }),

/***/ 808:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FlashcardGen = exports.FlashcardResult = void 0;
var FlashcardResult;
(function (FlashcardResult) {
    FlashcardResult[FlashcardResult["Correct"] = 0] = "Correct";
    FlashcardResult[FlashcardResult["Incorrect"] = 1] = "Incorrect";
    FlashcardResult[FlashcardResult["Unanswered"] = 2] = "Unanswered";
})(FlashcardResult || (exports.FlashcardResult = FlashcardResult = {}));
class FlashcardGen {
    // Type S is the state type for this flashcard deck
    // Type D is the type of the data involved in the single card
    getGenName() {
        throw new Error("getGenName not implemented!");
    }
    template;
    runOnce(s, setState, callback) {
        var cardData = this.getNextCard(s);
        var card = this.template.generateCard(cardData);
        var inputBox = document.getElementById("answer-input");
        var inputCallback = (attempt) => {
            var correct = card.check(attempt);
            if (correct) {
                inputBox.value = "";
                var result = card.correctFirst ? FlashcardResult.Correct : FlashcardResult.Incorrect;
                var newState = this.updateState(s, cardData, result);
                setState(newState);
                card.slideOut(callback, true);
            }
            else {
                card.markWrong();
                inputBox.oninput = (e) => {
                    inputBox.value = e.data;
                    inputBox.oninput = (e) => { };
                };
            }
        };
        inputBox.onkeydown = (e) => {
            if (e.key == "Enter") {
                inputCallback(inputBox.value);
            }
            else if (e.key == "ArrowUp") {
                inputBox.value = "";
                setState(this.updateState(s, cardData, FlashcardResult.Correct));
                card.slideOut(callback, true);
            }
            else if (e.key == "ArrowDown") {
                inputBox.value = "";
                setState(this.updateState(s, cardData, FlashcardResult.Unanswered));
                card.slideOut(callback, false);
            }
        };
        card.slideIn();
    }
    runLoop(getState, setState, callback) {
        var looper = () => {
            this.runOnce(getState(), setState, () => {
                callback();
                looper();
            });
        };
        looper();
    }
}
exports.FlashcardGen = FlashcardGen;


/***/ }),

/***/ 791:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FlashcardTemplate = void 0;
class FlashcardTemplate {
}
exports.FlashcardTemplate = FlashcardTemplate;


/***/ }),

/***/ 88:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Flashcard = void 0;
class Flashcard {
    el;
    check;
    hint;
    correctFirst;
    constructor(el, check, hint) {
        this.el = el;
        this.check = check;
        this.hint = hint;
        this.correctFirst = true;
    }
    slideIn() {
        var flCont = document.getElementById("flashcard-container");
        this.el.classList.add("flashcard");
        this.el.classList.add("flashcard-slide-in");
        this.el.onanimationend = () => { this.el.classList.remove("flashcard-slide-in"); };
        flCont.appendChild(this.el);
        document.getElementById("answer-hint").value = "";
    }
    slideOut(callback, correct) {
        var outClass = correct ? "flashcard-slide-out" : "flashcard-slide-out-unanswered";
        this.el.classList.add(outClass);
        this.el.onanimationend = () => {
            this.el.classList.remove(outClass);
            this.el.remove();
            callback();
        };
        document.getElementById("answer-hint").value = "";
    }
    markWrong() {
        this.correctFirst = false;
        this.el.classList.add("flashcard-incorrect");
        this.el.onanimationend = () => { this.el.classList.remove("flashcard-incorrect"); };
        document.getElementById("answer-hint").value = this.hint;
    }
}
exports.Flashcard = Flashcard;
function basicFlashcard(prompt, answer) {
    var el = document.createElement("p");
    el.textContent = prompt;
    const flashcard = new Flashcard(el, (attempt) => answer == attempt, answer);
    return flashcard;
}


/***/ }),

/***/ 633:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getDeckJSON = getDeckJSON;
exports.getDeckSlugs = getDeckSlugs;
exports.setDeckJSON = setDeckJSON;
exports.deleteDeck = deleteDeck;
const opfsRootP = navigator.storage.getDirectory();
const deckFolderP = opfsRootP.then((r) => r.getDirectoryHandle("decks", { create: true }));
function getDeckJSON(deckSlug) {
    var deckHandleP = deckFolderP.then((f) => f.getFileHandle(deckSlug));
    return deckHandleP
        .then((h) => h.getFile()).then((f) => f.text())
        .catch((e) => { console.log(e); return ""; });
}
function getDeckSlugs() {
    var entriesP = deckFolderP.then((h) => Array.fromAsync(h.entries()));
    var namesP = entriesP.then((es) => es.map((entry) => entry[0]));
    return namesP;
}
function setDeckJSON(deckSlug, deckBlob) {
    var deckHandleP = deckFolderP.then((f) => f.getFileHandle(deckSlug, { create: true }));
    var deckWriteableP = deckHandleP.then((h) => h.createWritable());
    return deckWriteableP.then((w) => {
        w.write(deckBlob).then(() => w.close());
    }).catch((e) => console.log(`ERROR WRITING DECK: ${e}`));
}
function deleteDeck(deckSlug) {
    deckFolderP.then((h) => h.removeEntry(deckSlug));
}


/***/ }),

/***/ 337:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const flashcard_deck_1 = __webpack_require__(836);
const decklist_1 = __webpack_require__(79);
__webpack_require__(633);
__webpack_require__(365);
__webpack_require__(314);
__webpack_require__(994);
(0, decklist_1.setupDecklistMenu)();
(0, flashcard_deck_1.loadAllDecks)().then((_) => (0, flashcard_deck_1.runDeck)("key-value-quizzer"));


/***/ }),

/***/ 314:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const utils_1 = __webpack_require__(185);
const flashcard_1 = __webpack_require__(88);
const flashcard_template_1 = __webpack_require__(791);
const flashcard_generator_1 = __webpack_require__(808);
const flashcard_deck_1 = __webpack_require__(836);
const editor_1 = __webpack_require__(43);
var SpacedRepCardStatus;
(function (SpacedRepCardStatus) {
    SpacedRepCardStatus[SpacedRepCardStatus["CardNew"] = 1] = "CardNew";
    SpacedRepCardStatus[SpacedRepCardStatus["CardStudying"] = 2] = "CardStudying";
    SpacedRepCardStatus[SpacedRepCardStatus["CardReview"] = 3] = "CardReview";
})(SpacedRepCardStatus || (SpacedRepCardStatus = {}));
var SpacedRepStudying;
(function (SpacedRepStudying) {
    SpacedRepStudying[SpacedRepStudying["NewCards"] = 0] = "NewCards";
    SpacedRepStudying[SpacedRepStudying["DueCards"] = 1] = "DueCards";
})(SpacedRepStudying || (SpacedRepStudying = {}));
var SpacedRepOrder;
(function (SpacedRepOrder) {
    SpacedRepOrder[SpacedRepOrder["RandomOrder"] = 1] = "RandomOrder";
    SpacedRepOrder[SpacedRepOrder["ReviewFirst"] = 2] = "ReviewFirst";
    SpacedRepOrder[SpacedRepOrder["NewFirst"] = 3] = "NewFirst";
})(SpacedRepOrder || (SpacedRepOrder = {}));
const defaultSpacedRepSettings = {
    initialHours: 6,
    correctFactor: 1.6,
    incorrectFactor: 0.5,
    reviewCeilingDays: 365,
    studying: SpacedRepStudying.NewCards,
    probReview: 0.1,
    order: SpacedRepOrder.RandomOrder
};
function defaultCardTiming() {
    return {
        due: null,
        intervalMinutes: 0,
        status: SpacedRepCardStatus.CardNew,
        streak: 0
    };
}
function makeSpacedRepCardDict(cardDat) {
    var cardDict = {};
    for (var i in cardDat) {
        var c = cardDat[i];
        cardDict[c.guid] = { content: c, timing: defaultCardTiming() };
    }
    return cardDict;
}
const defaultSpacedRepState = {
    cards: makeSpacedRepCardDict([
        { guid: (0, utils_1.guidGenerator)(), prompt: "apple", answers: ["manzana"] },
        { guid: (0, utils_1.guidGenerator)(), prompt: "banana", answers: ["plátano"] },
        { guid: (0, utils_1.guidGenerator)(), prompt: "orange", answers: ["naranja"] },
    ]),
    settings: defaultSpacedRepSettings,
    history: []
};
function makeSpacedRepCard(prompt, answers) {
    var guid = (0, utils_1.guidGenerator)();
    return {
        content: {
            guid: guid,
            prompt: prompt,
            answers: answers
        },
        timing: {
            due: null,
            intervalMinutes: 0,
            status: SpacedRepCardStatus.CardNew,
            streak: 0
        }
    };
}
function getNew(st) {
    return Object.keys(st.cards).filter((i) => st.cards[i].timing.due == null);
}
function getDue(st) {
    return Object.keys(st.cards).filter((i) => st.cards[i].timing.due != null
        && (new Date(st.cards[i].timing.due) < new Date())
        && (st.cards[i].timing.intervalMinutes < st.settings.reviewCeilingDays * (24 * 60)));
}
function getReview(st) {
    return Object.keys(st.cards).filter((i) => st.cards[i].timing.intervalMinutes > st.settings.reviewCeilingDays * (24 * 60));
}
function pickSpacedRepCard(st) {
    var inds = Object.keys(st.cards);
    var newInds = getNew(st);
    var dueInds = getDue(st);
    var reviewInds = getReview(st);
    switch (st.settings.studying) {
        case SpacedRepStudying.NewCards:
            if (newInds.length == 0) {
                return { content: undefined, cardsLeft: 0, isReview: false };
            }
            var newInd = newInds[Math.floor(Math.random() * newInds.length)];
            return {
                content: st.cards[newInd].content,
                cardsLeft: newInds.length,
                isReview: false,
            };
        case SpacedRepStudying.DueCards:
            if (dueInds.length == 0) {
                return { content: undefined, cardsLeft: 0, isReview: false };
            }
            else if (reviewInds.length > 0 && Math.random() < st.settings.probReview) {
                var reviewInd = reviewInds[Math.floor(Math.random() * reviewInds.length)];
                return {
                    content: st.cards[reviewInd].content,
                    cardsLeft: dueInds.length,
                    isReview: true
                };
            }
            var dueInd = dueInds[Math.floor(Math.random() * dueInds.length)];
            return {
                content: st.cards[dueInd].content,
                cardsLeft: dueInds.length,
                isReview: false
            };
    }
    return { content: undefined, cardsLeft: 0, isReview: false };
}
class SpacedRepTemplate extends flashcard_template_1.FlashcardTemplate {
    generateCard(data) {
        var a = document.createElement("a");
        var prompt = "No cards left to study.";
        var pred = (_) => false;
        var hint = "You cannot continue studying until more cards become due.";
        if (data.content !== undefined) {
            prompt = data.content.prompt;
            pred = (answer) => data.content.answers.includes(answer);
            hint = data.content.answers[0];
        }
        var fontSize = 100.0 / (10.0 * Math.log(10 + prompt.length));
        a.style.fontSize = `${fontSize}vw`;
        a.textContent = prompt;
        var fl = new flashcard_1.Flashcard(a, pred, hint);
        if (data.isReview) {
            fl.el.style.backgroundColor = "#eeeeff";
        }
        return fl;
    }
}
class SpacedRepGen extends flashcard_generator_1.FlashcardGen {
    getGenName() { return "spaced-repetition-generator"; }
    getNextCard(state) {
        return pickSpacedRepCard(state);
    }
    updateState(state, cardData, result) {
        if (result == flashcard_generator_1.FlashcardResult.Unanswered)
            return state;
        var correct = (result == flashcard_generator_1.FlashcardResult.Correct);
        var cardState = state.cards[cardData.content.guid];
        var dueDate = cardState.timing.due;
        if (correct) {
            cardState.timing.intervalMinutes
                = cardState.timing.intervalMinutes * state.settings.correctFactor;
            cardState.timing.streak += 1;
        }
        else {
            cardState.timing.intervalMinutes
                = cardState.timing.intervalMinutes * state.settings.incorrectFactor;
            cardState.timing.streak = 0;
        }
        if (cardState.timing.due === null) {
            if (cardState.timing.streak >= 3) {
                cardState.timing.intervalMinutes = state.settings.initialHours * 60;
                cardState.timing.due = new Date();
                cardState.timing.due
                    .setHours(cardState.timing.due.getHours() + cardState.timing.intervalMinutes / 60);
            }
        }
        else if (correct) {
            cardState.timing.due = new Date();
            cardState.timing.due
                .setHours(cardState.timing.due.getHours() + cardState.timing.intervalMinutes / 60);
        }
        cardState.timing.due = JSON.parse(JSON.stringify(cardState.timing.due));
        state.cards[cardData.content.guid] = cardState;
        state.history.push({
            guid: cardData.content.guid,
            answered: new Date(),
            timing: state.cards[cardData.content.guid].timing,
            correct: correct,
            answerSeconds: 0
        });
        return state;
    }
}
function spacedRepMenu(st) {
    var contDiv = document.createElement("div");
    var totP = document.createElement("p");
    totP.textContent = `Total cards: ${Object.keys(st.cards).length}`;
    totP.style.color = "#666666";
    totP.style.fontWeight = "bold";
    var newP = document.createElement("p");
    newP.textContent = `New cards: ${getNew(st).length}`;
    newP.style.color = "#9999ee";
    newP.style.fontWeight = "bold";
    var dueP = document.createElement("p");
    dueP.textContent = `Due cards: ${getDue(st).length}`;
    dueP.style.color = "#ee9999";
    dueP.style.fontWeight = "bold";
    var reviewP = document.createElement("p");
    reviewP.textContent = `Review cards: ${getReview(st).length}`;
    reviewP.style.color = "#99cc99";
    reviewP.style.fontWeight = "bold";
    var conf = st.settings;
    var studyingNewEditor = (0, editor_1.boolEditor)("Studying new cards?", st.settings.studying === SpacedRepStudying.NewCards);
    var initHoursEditor = (0, editor_1.scrollNumberEditor)("Initial interval (hours): ", conf.initialHours, 1, 240, 1);
    var reviewsEditor = (0, editor_1.scrollNumberEditor)("Probability of getting review cards: ", conf.probReview, 0, 0.5, 0.01);
    var correctFactor = (0, editor_1.scrollNumberEditor)("Correct factor: ", conf.correctFactor, 1, 10, 0.1);
    var incorrectFactor = (0, editor_1.scrollNumberEditor)("Incorrect factor: ", conf.incorrectFactor, 0, 1, 0.01);
    function makeCardEditor(c) {
        var ed = (0, editor_1.fixedNumEditors)([c.content.prompt, c.content.answers.join('|')], editor_1.singleTextFieldEditor);
        var cardInfo = document.createElement("a");
        cardInfo.style.color = "lightgray";
        cardInfo.style.marginLeft = "10px";
        cardInfo.style.marginRight = "10px";
        cardInfo.style.verticalAlign = "middle";
        if (c.timing.due === null) {
            cardInfo.textContent = "not studied";
        }
        else {
            cardInfo.textContent = `due ${c.timing.due.toLocaleString().split('T')[0]}`;
        }
        ed.element.appendChild(cardInfo);
        return {
            element: ed.element,
            menuToState: () => {
                let tp = ed.menuToState();
                return {
                    content: {
                        guid: c.content.guid,
                        prompt: tp[0],
                        answers: tp[1].split('|')
                    },
                    timing: {
                        due: c.timing.due,
                        intervalMinutes: c.timing.intervalMinutes,
                        streak: c.timing.streak,
                        status: c.timing.status,
                    }
                };
            }
        };
    }
    ;
    var cardsEditor = (0, editor_1.multipleEditors)(Object.values(st.cards), () => makeSpacedRepCard("", []), makeCardEditor, true, (s, cd) => cd.content.prompt.includes(s) || cd.content.answers.some((a) => a.includes(s)));
    var cardsEditorTitle = document.createElement("h3");
    cardsEditorTitle.textContent = "Cards";
    cardsEditor.element.prepend(cardsEditorTitle);
    var components = [
        totP,
        newP,
        dueP,
        reviewP,
        studyingNewEditor.element,
        initHoursEditor.element,
        correctFactor.element,
        incorrectFactor.element,
        reviewsEditor.element,
        cardsEditor.element,
    ];
    components.map((el) => contDiv.appendChild(el));
    return {
        element: contDiv,
        menuToState: () => {
            return {
                settings: {
                    initialHours: initHoursEditor.menuToState(),
                    correctFactor: correctFactor.menuToState(),
                    incorrectFactor: incorrectFactor.menuToState(),
                    studying: studyingNewEditor.menuToState() ? SpacedRepStudying.NewCards : SpacedRepStudying.DueCards,
                    reviewCeilingDays: st.settings.reviewCeilingDays,
                    probReview: reviewsEditor.menuToState(),
                    order: SpacedRepOrder.RandomOrder,
                },
                cards: (0, utils_1.makeDict)(cardsEditor.menuToState(), (c) => c.content.guid),
                history: st.history
            };
        }
    };
}
(0, flashcard_deck_1.registerDeckType)(new SpacedRepGen(), new SpacedRepTemplate(), spacedRepMenu, "spaced-repetition-deck", "Spaced repetition deck", defaultSpacedRepState);


/***/ }),

/***/ 365:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const flashcard_1 = __webpack_require__(88);
const flashcard_generator_1 = __webpack_require__(808);
const flashcard_template_1 = __webpack_require__(791);
const flashcard_deck_1 = __webpack_require__(836);
const editor_1 = __webpack_require__(43);
class KVFlashcardGen extends flashcard_generator_1.FlashcardGen {
    getGenName() { return "uniform-key-value"; }
    getNextCard(state) {
        var dat = state.deck[Math.floor(Math.random() * Object.keys(state.deck).length)];
        return dat;
    }
    updateState(state, cardData, correct) {
        if (correct != flashcard_generator_1.FlashcardResult.Unanswered) {
            state.history.push([cardData[0], correct == flashcard_generator_1.FlashcardResult.Correct]);
        }
        return state;
    }
}
class KVBasicTemplate extends flashcard_template_1.FlashcardTemplate {
    generateCard(data) {
        var a = document.createElement("a");
        a.textContent = data[0];
        var fl = new flashcard_1.Flashcard(a, (answer) => data[1] == answer, data[1]);
        var fontSize = 100.0 / (10.0 * Math.log(10 + data[0].length));
        fl.el.style.fontSize = `${fontSize}vw`;
        return fl;
    }
}
function makeKVEditor(state) {
    var transEd = (0, editor_1.makeTranslationEditor)(state.deck, (x) => true);
    return {
        element: transEd.element,
        menuToState: () => {
            return {
                deck: transEd.menuToState(),
                history: state.history
            };
        }
    };
}
var kvDefaultState = {
    deck: [
        ["cat", "gato"],
        ["dog", "perro"]
    ],
    history: []
};
// var kvGen = new KVFlashcardGen();
// kvGen.state = kvState;
// kvGen.template = new KVBasicTemplate();
// kvGen.runLoop()
(0, flashcard_deck_1.registerDeckType)(new KVFlashcardGen(), new KVBasicTemplate(), makeKVEditor, "key-value-quizzer", "Simple key-value quizzer", kvDefaultState);


/***/ }),

/***/ 185:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.guidGenerator = guidGenerator;
exports.arrayReindex = arrayReindex;
exports.makeDict = makeDict;
exports.downloadText = downloadText;
// https://stackoverflow.com/questions/6860853/generate-random-string-for-div-id
function guidGenerator() {
    var S4 = function () {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };
    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
}
function arrayReindex(ls) {
    return ls.filter((_) => true);
}
function makeDict(items, key) {
    var d = {};
    items.map((x) => { d[key(x)] = x; });
    return d;
}
// https://stackoverflow.com/questions/3665115/how-to-create-a-file-in-memory-for-user-to-download-but-not-through-server
function downloadText(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it uses a non-standard name for the exports (exports).
(() => {
var exports = __webpack_exports__;

Object.defineProperty(exports, "__esModule", ({ value: true }));
__webpack_require__(337);

})();

flashcards = __webpack_exports__;
/******/ })()
;