var flashcards;
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

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
exports.singleTextFieldEditor = singleTextFieldEditor;
exports.validatedTextFieldEditor = validatedTextFieldEditor;
exports.doubleTextFieldEditor = doubleTextFieldEditor;
exports.combineEditors = combineEditors;
exports.makeTranslationEditor = makeTranslationEditor;
exports.multipleEditors = multipleEditors;
const utils_1 = __webpack_require__(185);
/* Some useful state editors */
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
    return multipleEditors(ls, ["", ""], (item) => combineEditors(item, (s) => singleTextFieldEditor(s), (s) => validatedTextFieldEditor(s, validator)), true, (s, cd) => cd[0].includes(s) || cd[1].includes(s));
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
exports.loadAllDecks = loadAllDecks;
exports.runDeck = runDeck;
exports.registerDeckType = registerDeckType;
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
function menuSetup(decktype, deck) {
    var editBtn = document.getElementById("deck-edit-button");
    editBtn.onclick = () => {
        var editorOverlay = document.getElementById("flashcard-deck-editor-overlay");
        var editorCont = document.getElementById("flashcard-deck-editor");
        var editor = decktype.editor(deck.state);
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
function runWithGenerator(decktype, deck) {
    document.getElementById("flashcard-container").innerHTML = "";
    menuSetup(decktype, deck);
    decktype.gen.state = deck.state;
    decktype.gen.runLoop();
}
function runDeck(deckSlug) {
    var deck = exports.gDeckRegistry[deckSlug];
    var deckTypeSlug = deck.type;
    var deckType = exports.gDeckTypeRegistry[deckTypeSlug];
    runWithGenerator(deckType, deck);
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
exports.FlashcardGen = void 0;
class FlashcardGen {
    // Type S is the state type for this flashcard deck
    // Type D is the type of the data involved in the single card
    getGenName() {
        throw new Error("getGenName not implemented!");
    }
    state;
    template;
    runOnce(callback) {
        var cardData = this.getNextCard(this.state);
        var card = this.template.generateCard(cardData);
        var inputBox = document.getElementById("answer-input");
        var inputCallback = (attempt) => {
            var correct = card.check(attempt);
            this.state = this.updateState(this.state, cardData, correct);
            if (correct) {
                card.slideOut(callback);
                inputBox.value = "";
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
        };
        card.slideIn();
    }
    runLoop() {
        var looper = () => {
            this.runOnce(looper);
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
    constructor(el, check) {
        this.el = el;
        this.check = check;
    }
    slideIn() {
        var flCont = document.getElementById("flashcard-container");
        this.el.classList.add("flashcard");
        this.el.classList.add("flashcard-slide-in");
        this.el.onanimationend = () => { this.el.classList.remove("flashcard-slide-in"); };
        flCont.appendChild(this.el);
    }
    slideOut(callback) {
        this.el.classList.add("flashcard-slide-out");
        this.el.onanimationend = () => {
            this.el.classList.remove("flashcard-slide-out");
            this.el.remove();
            callback();
        };
    }
    markWrong() {
        this.el.classList.add("flashcard-incorrect");
        this.el.onanimationend = () => { this.el.classList.remove("flashcard-incorrect"); };
    }
}
exports.Flashcard = Flashcard;
function basicFlashcard(prompt, answer) {
    var el = document.createElement("p");
    el.textContent = prompt;
    const flashcard = new Flashcard(el, (attempt) => answer == attempt);
    return flashcard;
}
var fl = basicFlashcard("1+2", "3");
// setTimeout(() => fl.slideIn(), 2000);
// setTimeout(() => fl.markWrong(), 4000);
// setTimeout(() => fl.slideOut(), 6000);


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
// generateDecklistMenu(gDeckRegistry, (_) => {});
(0, decklist_1.setupDecklistMenu)();
(0, flashcard_deck_1.loadAllDecks)().then((_) => (0, flashcard_deck_1.runDeck)("key-value-quizzer"));


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
        state.history.push([cardData[0], correct]);
        return state;
    }
}
class KVBasicTemplate extends flashcard_template_1.FlashcardTemplate {
    generateCard(data) {
        var a = document.createElement("a");
        a.textContent = data[0];
        var fl = new flashcard_1.Flashcard(a, (answer) => data[1] == answer);
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
const KV_DECK_SLUG = (0, flashcard_deck_1.registerDeckType)(new KVFlashcardGen(), new KVBasicTemplate(), makeKVEditor, "key-value-quizzer", "Simple key-value quizzer", kvDefaultState);


/***/ }),

/***/ 185:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.guidGenerator = guidGenerator;
exports.arrayReindex = arrayReindex;
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