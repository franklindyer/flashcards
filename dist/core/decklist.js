"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDecklistMenu = generateDecklistMenu;
exports.setupDecklistMenu = setupDecklistMenu;
const utils_1 = require("utils/utils");
const flashcard_deck_1 = require("core/flashcard-deck");
const editor_1 = require("core/editor");
const synchronization_1 = require("./synchronization");
function generateDeckNameEditor(deck) {
    var nicknameEditor = (0, editor_1.singleTextFieldEditor)(deck.name);
    var colorEditor = (0, editor_1.singleTextFieldEditor)(deck.view.color);
    var closeBtn = document.createElement("button");
    closeBtn.textContent = "Save";
    var deckIdA = document.createElement("A");
    deckIdA.textContent = `Internal deck ID: ${deck.slug}`;
    var contDiv = document.createElement("div");
    [
        nicknameEditor.element,
        colorEditor.element,
        closeBtn,
        document.createElement("br"),
        deckIdA
    ].map((el) => contDiv.appendChild(el));
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
    var deckTypeList = document.createElement("select");
    deckTypeList.id = "deck-type-dropdown";
    for (var i in Object.keys(flashcard_deck_1.gDeckTypeRegistry)) {
        var deckTypeId = Object.keys(flashcard_deck_1.gDeckTypeRegistry)[i];
        var deckTypeName = flashcard_deck_1.gDeckDefaultRegistry[deckTypeId].name;
        var deckTypeOption = document.createElement("option");
        deckTypeOption.value = deckTypeId;
        deckTypeOption.textContent = deckTypeName;
        deckTypeList.appendChild(deckTypeOption);
    }
    var newDeckBtn = document.createElement("button");
    newDeckBtn.textContent = "Create new deck";
    newDeckBtn.onclick = (e) => {
        deckTypeId = document.getElementById("deck-type-dropdown").value;
        var guid = (0, utils_1.guidGenerator)();
        var deckClone = JSON.parse(JSON.stringify(flashcard_deck_1.gDeckDefaultRegistry[deckTypeId]));
        deckClone.slug = guid;
        decklist[guid] = deckClone;
        generateDecklistMenu(decklist, onfinish);
    };
    decklistEditor.appendChild(newDeckBtn);
    decklistEditor.appendChild(deckTypeList);
    decklistEditor.appendChild(document.createElement("br"));
    var syncServerBtn = document.createElement("button");
    syncServerBtn.textContent = "Setup sync server";
    syncServerBtn.onclick = synchronization_1.promptForSyncCreds;
    decklistEditor.appendChild(syncServerBtn);
    var addRemoteBtn = document.createElement("button");
    addRemoteBtn.textContent = "Add external deck";
    addRemoteBtn.onclick = (e) => {
        var deckslug = prompt("Enter the ID of the deck you would like to download.") || "";
        (0, synchronization_1.syncDownloadDeck)(deckslug, (s) => {
            console.log(s);
            (0, flashcard_deck_1.setDeck)(deckslug, s, () => {
                generateDecklistMenu(decklist, onfinish);
            });
        });
    };
    decklistEditor.appendChild(addRemoteBtn);
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
            (0, flashcard_deck_1.saveDeck)(s, () => (0, flashcard_deck_1.runDeck)(s));
        })(slug);
        var deckEditBtn = document.createElement("button");
        deckEditBtn.title = "Edit deck";
        deckEditBtn.innerHTML = "<img src='edit.png'/>";
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
        deckDeleteBtn.title = "Delete deck";
        deckDeleteBtn.classList.add("deck-editor-button");
        deckDeleteBtn.innerHTML = "<img src='trash.png'/>";
        deckDeleteBtn.onclick = ((dk) => (e) => {
            var confirmation = confirm(`Are you sure you want to delete "${dk.name}"?`);
            if (confirmation) {
                (0, flashcard_deck_1.eraseDeck)(dk.slug);
            }
            e.cancelBubble = true;
            if (e.stopPropagation)
                e.stopPropagation();
            generateDecklistMenu(decklist, onfinish);
        })(decklist[k]);
        var deckUploadBtn = document.createElement("button");
        deckUploadBtn.title = "Upload deck to server";
        deckUploadBtn.classList.add("deck-editor-button");
        deckUploadBtn.innerHTML = "<img src='upcloud.png'/>";
        deckUploadBtn.onclick = ((dk) => (e) => {
            (0, synchronization_1.syncUploadDeck)(dk);
            e.cancelBubble = true;
            if (e.stopPropagation)
                e.stopPropagation();
        })(decklist[k]);
        var deckDownloadBtn = document.createElement("button");
        deckDownloadBtn.title = "Download deck from server";
        deckDownloadBtn.classList.add("deck-editor-button");
        deckDownloadBtn.innerHTML = "<img src='downcloud.png'/>";
        deckDownloadBtn.onclick = ((k) => (e) => {
            (0, synchronization_1.syncDownloadDeck)(k, (s) => { (0, flashcard_deck_1.setDeck)(k, s, () => { }); });
            e.cancelBubble = true;
            if (e.stopPropagation)
                e.stopPropagation();
        })(k);
        deckDiv.appendChild(deckUploadBtn);
        deckDiv.appendChild(deckDownloadBtn);
        deckDiv.appendChild(deckEditBtn);
        deckDiv.appendChild(deckDeleteBtn);
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
