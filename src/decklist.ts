import {
    IDictionary,
    guidGenerator
} from "./utils"
import {
    FlashcardDeck,
    runDeck,
    gDeckRegistry,
    saveDeck
} from "./flashcard-deck"
import {
    FlashcardGen
} from "./flashcard-generator"
import {
    singleTextFieldEditor,
    StateEditor
} from "./editor"
import {
    deleteDeck
} from "./fs"

function generateDeckNameEditor(deck: FlashcardDeck<any>): StateEditor<FlashcardDeck<any>> {
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

export function generateDecklistMenu(
    decklist: IDictionary<FlashcardDeck<any>>,
    onfinish: (st: IDictionary<FlashcardDeck<any>>) => void) {

    var decklistEditor = <HTMLElement>document.getElementById("flashcard-decklist-editor");
    decklistEditor.innerHTML = "";
    var decklistOverlay = <HTMLElement>document.getElementById("flashcard-decklist-overlay");
   
    Object.keys(decklist).sort(); 
    for (var k in decklist) {
        var deckDiv = document.createElement("div");
        var slug = decklist[k].slug;
        var deckLabel = document.createElement("a");
        deckLabel.textContent = decklist[k].name;
        deckDiv.appendChild(deckLabel);
        deckDiv.classList.add("deck-editor-entry");
        if (decklist[k].view !== undefined) {
            deckDiv.style.backgroundColor = decklist[k].view!.color;
        }
        deckDiv.onclick = ((s) => (e) => {
            decklistOverlay.style.display = "none";
            onfinish(decklist);
            saveDeck(s, () => runDeck(s));
        })(slug);
        var deckEditBtn = document.createElement("button");
        deckEditBtn.innerHTML = "<img src='/edit.png'/>";
        deckEditBtn.classList.add("deck-editor-button");
        deckEditBtn.onclick = ((dk, deckDiv) => (e) => {
            var ed = generateDeckNameEditor(dk);
            var closeBtn = ed.element.getElementsByTagName("button")[0];
            closeBtn.onclick = (e: Event) => {
                var newDeck = ed.menuToState();
                decklist[dk.slug] = newDeck;
                saveDeck(dk.slug, () => {});
                generateDecklistMenu(decklist, onfinish);
            };
            deckDiv.replaceChildren(ed.element);
            e.cancelBubble = true;
            if (e.stopPropagation) e.stopPropagation();
        })(decklist[k], deckDiv);
        var deckDeleteBtn = document.createElement("button");
        deckDeleteBtn.classList.add("deck-editor-button");
        deckDeleteBtn.innerHTML = "<img src='/trash.png'/>";
        deckDeleteBtn.onclick = ((dk) => (e) => {
            var confirmation = confirm(`Are you sure you want to delete "${dk.name}"?`);
            if (confirmation) {
                delete decklist[dk.slug];
                deleteDeck(dk.slug);
            }
            e.cancelBubble = true;
            if (e.stopPropagation) e.stopPropagation();
            generateDecklistMenu(decklist, onfinish);
        })(decklist[k]);
        var deckCloneBtn = document.createElement("button");
        deckCloneBtn.classList.add("deck-editor-button");
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

export function setupDecklistMenu() {
    var decksBtn = <HTMLElement>document.getElementById("deck-list-button");
    decksBtn.onclick = (e: Event) => {
        var decklistOverlay = <HTMLElement>document.getElementById("flashcard-decklist-overlay");
        generateDecklistMenu(gDeckRegistry, (_) => {});
        decklistOverlay.style.display = "block";
        
    };
}
