"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gDeckRegistry = exports.gDeckTypeRegistry = void 0;
exports.saveDeck = saveDeck;
exports.loadAllDecks = loadAllDecks;
exports.runDeck = runDeck;
exports.registerDeckType = registerDeckType;
const utils_1 = require("./utils");
const fs_1 = require("./fs");
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
