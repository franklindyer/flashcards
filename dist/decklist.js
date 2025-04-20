"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDecklistMenu = generateDecklistMenu;
exports.setupDecklistMenu = setupDecklistMenu;
const utils_1 = require("./utils");
const flashcard_deck_1 = require("./flashcard-deck");
const editor_1 = require("./editor");
const fs_1 = require("./fs");
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
