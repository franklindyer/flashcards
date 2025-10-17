"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gDeckDefaultRegistry = exports.gDeckRegistry = exports.gDeckTypeRegistry = void 0;
exports.setDeck = setDeck;
exports.saveDeck = saveDeck;
exports.loadAllDecks = loadAllDecks;
exports.eraseDeck = eraseDeck;
exports.runDeck = runDeck;
exports.setLastDeck = setLastDeck;
exports.getStartingDeck = getStartingDeck;
exports.registerDeckType = registerDeckType;
const utils_1 = require("utils/utils");
const fs_1 = require("./fs");
exports.gDeckTypeRegistry = {};
exports.gDeckRegistry = {};
exports.gDeckDefaultRegistry = {};
function setDeck(deckSlug, deckString, callback) {
    var deck = JSON.parse(deckString);
    exports.gDeckRegistry[deckSlug] = deck;
    saveDeck(deckSlug, callback);
}
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
function eraseDeck(deckSlug) {
    delete exports.gDeckRegistry[deckSlug];
    (0, fs_1.deleteDeck)(deckSlug);
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
        window.onbeforeunload = function () {
            return "Are you sure you want to leave before saving your deck?";
        };
        doneBtn.onclick = () => {
            window.onbeforeunload = () => { };
            editorOverlay.style.display = "none";
            deck.state = editor.menuToState();
            exports.gDeckRegistry[deckSlug].state = deck.state;
            saveDeck(deckSlug, () => { });
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
                var importedDeck = JSON.parse(e.target.result);
                importedDeck.slug = deckSlug;
                setDeck(importedDeck);
            };
            reader.readAsText(file, "UTF-8");
        };
    };
    exportBtn.onclick = (e) => {
        (0, utils_1.downloadText)(deckSlug, JSON.stringify(exports.gDeckRegistry[deckSlug]));
    };
}
function runDeck(deckSlug) {
    setLastDeck(deckSlug);
    document.getElementById("flashcard-container").innerHTML = "";
    var decktype = exports.gDeckTypeRegistry[exports.gDeckRegistry[deckSlug].type];
    exports.gDeckRegistry[deckSlug].state = decktype.gen.repairDeckState(exports.gDeckRegistry[deckSlug].state);
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
    decktype.gen.runLoop(getState, setState, () => saveDeck(deckSlug, () => { }));
}
function setLastDeck(deckSlug) {
    localStorage.setItem("last-deck-slug", deckSlug);
}
function getStartingDeck(defaultSlug) {
    var lastDeckSlug = localStorage.getItem("last-deck-slug");
    if ((lastDeckSlug == undefined) || !(lastDeckSlug in exports.gDeckRegistry)) {
        return defaultSlug;
    }
    return lastDeckSlug;
}
/* Register a new type of deck */
function registerDeckType(gen, defaultSlug, defaultName, defaultState, colorCode = "#ffffee") {
    exports.gDeckTypeRegistry[gen.getGenName()] = {
        slug: gen.getGenName(),
        gen: gen,
        editor: gen.makeEditor
    };
    exports.gDeckDefaultRegistry[gen.getGenName()] = {
        name: defaultName,
        slug: defaultSlug,
        type: gen.getGenName(),
        state: defaultState,
        view: {
            color: colorCode
        }
    };
}
