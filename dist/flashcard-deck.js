"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runDeck = exports.gDeckRegistry = exports.gDeckTypeRegistry = void 0;
exports.gDeckTypeRegistry = {};
exports.gDeckRegistry = {};
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
