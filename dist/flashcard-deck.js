"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDeckType = exports.runDeck = exports.loadAllDecks = exports.gDeckRegistry = exports.gDeckTypeRegistry = void 0;
const fs_1 = require("./fs");
exports.gDeckTypeRegistry = {};
exports.gDeckRegistry = {};
function saveDeck(deckSlug, callback) {
    (0, fs_1.setDeckJSON)(deckSlug, JSON.stringify(exports.gDeckRegistry[deckSlug])).then((_) => callback());
}
function loadDeckIfExists(deckSlug) {
    return (0, fs_1.getDeckJSON)(deckSlug).then((j) => {
        console.log("GETTING DECK JSON!");
        console.log(j);
        if (j.length > 0) {
            var d = JSON.parse(j);
            exports.gDeckRegistry[d.slug] = d;
        }
    });
}
function loadAllDecks() {
    var deckSlugs = Object.keys(exports.gDeckRegistry);
    return Promise.all(deckSlugs.map((slug) => loadDeckIfExists(slug)));
}
exports.loadAllDecks = loadAllDecks;
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
exports.runDeck = runDeck;
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
exports.registerDeckType = registerDeckType;
