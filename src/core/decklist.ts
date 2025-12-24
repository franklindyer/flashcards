import {
    IDictionary,
    guidGenerator
} from "utils/utils"
import {
    renderString
} from "nunjucks"
import {
    FlashcardDeck,
    runDeck,
    gDeckTypeRegistry,
    gDeckRegistry,
    gDeckDefaultRegistry,
    saveDeck,
    setDeck,
    eraseDeck
} from "core/flashcard-deck"
import {
    singleTextFieldEditor,
    StateEditor,
    boolEditor
} from "core/editor"
import {
    MenuComponent
} from "menus/menus"
import {
    promptForSyncCreds,
    syncUploadDeck,
    syncDownloadDeck,
    validateSyncCreds
} from "./synchronization"

function generateDeckNameEditor(deck: FlashcardDeck<any>): StateEditor<FlashcardDeck<any>> {
    var nicknameEditor = singleTextFieldEditor(deck.name);
    var colorEditor = singleTextFieldEditor(deck.view.color); 
    var closeBtn = document.createElement("button");
    closeBtn.textContent = "Save";
    var doSyncEditor = boolEditor("Sync deck with server?", deck.doSync);
    var deckIdA= document.createElement("A");
    deckIdA.textContent = `Internal deck ID: ${deck.slug}`
    var contDiv = document.createElement("div");
    [
        nicknameEditor.element, 
        colorEditor.element,
        doSyncEditor.element,
        deckIdA,
        closeBtn
    ].map((el) => contDiv.appendChild(el));
    contDiv.onclick = (e) => {
        e.cancelBubble = true;
        if (e.stopPropagation) e.stopPropagation();
    };
    var ed = {
        element: contDiv,
        menuToState: () => {
            deck.name = nicknameEditor.menuToState();
            deck.view.color = colorEditor.menuToState();
            deck.doSync = doSyncEditor.menuToState();
            contDiv.remove();
            return deck;
        }
    }
    return ed;
}

export function generateDecklistMenu(
        decklist: IDictionary<FlashcardDeck<any>>,
        onfinish: (st: IDictionary<FlashcardDeck<any>>) => void) {
    var contDiv = document.createElement("div");
    console.log(gDeckTypeRegistry);
    var menuTpl = `
        <div is="menu-list">
            <button class="menu-add-another-button">Create new deck</button>
            <select class="menu-options-decktype">
                {% for dt in decktypes %}
                <option value="{{ dt }}">{{ deckDefaultRegistry[dt].name }}</option>
                {% endfor %}
            </select> <br />
            <button class="menu-import-file-button">Import deck from file</button> <br />
            <button class="menu-setup-sync-server">Setup sync server</button>
            <button class="menu-import-remote-button">Import deck from server</button> <br />
            <div class="menu-list-entries"></div>
            <div class="menu-list-default-entry deck-editor-entry" is="menu-deep-json">
                <div class="decklist-edit-div">
                    <input is="menu-textbox" name="name" />
                    <input is="menu-textbox" name="view.color" />
                    <input is="menu-checkbox" name="doSync" />
                    <label for="doSync">Sync deck with server?</label> <br />
                    <input is="menu-textbox" name="slug" disabled/>
                    <button class="decklist-save-button">Save</button>
                </div>
                <div class="decklist-view-div">
                    <b class="decklist-view-title"></b>
                    <button class="decklist-study-button deck-editor-button">study</button>
                    <button class="decklist-edit-button deck-editor-button">edit</button>
                    <button class="decklist-delete-button menu-list-remove-button deck-editor-button">delete</button>
                </div>
            </div>
        </div>       
    `;
    var menuHTML = renderString(menuTpl, {
        decktypes: Object.keys(gDeckTypeRegistry),
        deckDefaultRegistry: gDeckDefaultRegistry
    });
    contDiv.innerHTML = menuHTML;
    var menu = <any>contDiv.children[0];

    var newDeckButton = <any>menu.querySelector(".menu-add-another-button");
    var deckTypeSelect = <any>menu.querySelector(".menu-options-decktype");
    var importDeckButton = <any>menu.querySelector(".menu-import-file-button");
    var syncSetupButton = <any>menu.querySelector(".menu-setup-sync-server");
    var syncDeckButton = <any>menu.querySelector(".menu-import-remote-button");

    newDeckButton.onclick = (e: any) => {
        var st = menu.getState();
        var decktype = deckTypeSelect.value;
        var newDeck = <any>JSON.parse(JSON.stringify(gDeckDefaultRegistry[decktype]));
        newDeck.slug = guidGenerator();
        st.push(newDeck);
        menu.setState(st);
    };

    importDeckButton.onclick = (e: any) => {
        var fileUploadInput = document.createElement("input");
        fileUploadInput.type = "file";
        fileUploadInput.onchange = (e: any) => {
            var files = (<HTMLInputElement>fileUploadInput).files;
            if (files == null) return;
            var file = files[0];
            if (file == null) return;
            var reader = new FileReader();
            reader.onload = (e: any) => {
                var importedDeck = JSON.parse(<string>e.target!.result);
                importedDeck.slug = guidGenerator();
                setDeck(importedDeck.slug, JSON.stringify(importedDeck), () => {
                    saveDeck(importedDeck.slug, () => {
                        generateDecklistMenu(decklist, onfinish);
                    })
                });
            };
            reader.readAsText(file, "UTF-8");
        };
        fileUploadInput.click();
    };

    menu.entryCallback = (el: HTMLElement) => {
        var deckView = <any>el.querySelector(".decklist-view-div")!;
        var deckEditor = <any>el.querySelector(".decklist-edit-div")!;
        var nameInput = <any>el.querySelector("[name='name']")!;
        var nameView = <any>el.querySelector(".decklist-view-title")!;
        var colorInput = <any>el.querySelector("[name='view.color']")!;
        var studyButton = <any>el.querySelector(".decklist-study-button")!;
        var saveButton = <any>el.querySelector(".decklist-save-button")!;
        var editButton = <any>el.querySelector(".decklist-edit-button")!;
        var updateDeckView = () => {
            nameView.textContent = nameInput.value;
            el.style.backgroundColor = colorInput.value;
            deckEditor.style.display = "none";
            deckView.style.display = "block"; 
        };
        var editDeck = () => {
            deckEditor.style.display = "block";
            deckView.style.display = "none"; 
        };
        saveButton.onclick = updateDeckView;
        editButton.onclick = editDeck;
        studyButton.onclick = () => {
            var id = (<any>el).getState().slug;
            var newDecklist = menu.getState();
            var newDeckdict = Object.fromEntries(newDecklist.map((x: any) => [x.slug, x]));
            decklistOverlay.style.display = "none";
            onfinish(newDeckdict);
            saveDeck(id, () => runDeck(id));
        };
        updateDeckView();
    };

    menu.setState([...Object.values(gDeckRegistry)]);    

    var decklistEditor = <HTMLElement>document.getElementById("flashcard-decklist-editor");
    decklistEditor.innerHTML = "";
    var decklistOverlay = <HTMLElement>document.getElementById("flashcard-decklist-overlay");
    decklistEditor.appendChild(menu);
}

/* export function generateDecklistMenu(
    decklist: IDictionary<FlashcardDeck<any>>,
    onfinish: (st: IDictionary<FlashcardDeck<any>>) => void) {

    var decklistEditor = <HTMLElement>document.getElementById("flashcard-decklist-editor");
    decklistEditor.innerHTML = "";
    var decklistOverlay = <HTMLElement>document.getElementById("flashcard-decklist-overlay");

    var deckTypeList = document.createElement("select");
    deckTypeList.id = "deck-type-dropdown";
    for (var i in Object.keys(gDeckTypeRegistry)) {
        var deckTypeId = Object.keys(gDeckTypeRegistry)[i];
        var deckTypeName = gDeckDefaultRegistry[deckTypeId].name;
        var deckTypeOption = document.createElement("option");
        deckTypeOption.value = deckTypeId;
        deckTypeOption.textContent = deckTypeName;
        deckTypeList.appendChild(deckTypeOption);
    }
    var newDeckBtn = document.createElement("button");
    newDeckBtn.textContent = "Create new deck";
    newDeckBtn.onclick = (e) => {
        deckTypeId = (<HTMLInputElement>document.getElementById("deck-type-dropdown"))!.value;
        var guid = guidGenerator();
        var deckClone = <FlashcardDeck<any>>JSON.parse(JSON.stringify(gDeckDefaultRegistry[deckTypeId]));
        deckClone.slug = guid;
        decklist[guid] = deckClone;
        generateDecklistMenu(decklist, onfinish);
    };
    decklistEditor.appendChild(newDeckBtn);
    decklistEditor.appendChild(deckTypeList);
    decklistEditor.appendChild(document.createElement("br"));

    var importDeckBtn = document.createElement("button");
    importDeckBtn.textContent = "Import Deck";
    var fileUploadInput = document.createElement("input");
    fileUploadInput.type = "file";
    importDeckBtn.onclick = (e) => {
        fileUploadInput.click();
        fileUploadInput.onchange = (e) => {
            var files = (<HTMLInputElement>fileUploadInput).files;
            if (files == null) return;
            var file = files[0];
            if (file == null) return;
            var reader = new FileReader();
            reader.onload = (e) => {
                var importedDeck = JSON.parse(<string>e.target!.result);
                importedDeck.slug = guidGenerator();
                setDeck(importedDeck.slug, JSON.stringify(importedDeck), () => {
                    saveDeck(importedDeck.slug, () => {
                        generateDecklistMenu(decklist, onfinish);
                    })
                });
            };
            reader.readAsText(file, "UTF-8");
        };
    }
    decklistEditor.appendChild(importDeckBtn);
    decklistEditor.appendChild(document.createElement("br"));

    var syncServerDiv = document.createElement("div")
    syncServerDiv.style.display = "none";
    var updateSyncServerDiv = (r: string, s: string) => {
        syncServerDiv.innerHTML = "";
        syncServerDiv.style.display = "block";
        var remoteP = document.createElement("a");
        var keyP = document.createElement("a");
        remoteP.innerHTML = `Sync server URL: <code>${r}</code>`;
        keyP.innerHTML = `Sync server user key: <code>${k.slice(0, 8)}...</code>`;
        syncServerDiv.appendChild(remoteP);
        syncServerDiv.appendChild(document.createElement("br"));
        syncServerDiv.appendChild(keyP);
    };

    var syncServerBtn = document.createElement("button");
    syncServerBtn.textContent = "Setup sync server";
    syncServerBtn.onclick = (e) => {
        promptForSyncCreds(updateSyncServerDiv);
    };
    decklistEditor.appendChild(syncServerBtn);   

    validateSyncCreds(
        updateSyncServerDiv,
        () => {}
    );    

    var addRemoteBtn = document.createElement("button");
    addRemoteBtn.textContent = "Add external deck";
    addRemoteBtn.onclick = (e) => {
        var deckslug = prompt("Enter the ID of the deck you would like to download.") || "";
        var defaultDate = new Date("1970-01-01T00:00:00Z");
        syncDownloadDeck(deckslug, defaultDate, (s: string) => { setDeck(deckslug, s, () => {
            generateDecklistMenu(decklist, onfinish);
        }); });
    };
    decklistEditor.appendChild(addRemoteBtn);
    decklistEditor.appendChild(syncServerDiv);   

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
        deckEditBtn.title = "Edit deck";
        deckEditBtn.innerHTML = "<img src='edit.png'/>";
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
        deckDeleteBtn.title = "Delete deck";
        deckDeleteBtn.classList.add("deck-editor-button");
        deckDeleteBtn.innerHTML = "<img src='trash.png'/>";
        deckDeleteBtn.onclick = ((dk) => (e) => {
            var confirmation = confirm(`Are you sure you want to delete "${dk.name}"?`);
            if (confirmation) {
                eraseDeck(dk.slug);
            }
            e.cancelBubble = true;
            if (e.stopPropagation) e.stopPropagation();
            generateDecklistMenu(decklist, onfinish);
        })(decklist[k]);
        
        deckDiv.appendChild(deckEditBtn);
        deckDiv.appendChild(deckDeleteBtn);
        decklistEditor.appendChild(deckDiv);

    }
} */

export function setupDecklistMenu() {
    var decksBtn = <HTMLElement>document.getElementById("deck-list-button");
    decksBtn.onclick = (e: Event) => {
        var decklistOverlay = <HTMLElement>document.getElementById("flashcard-decklist-overlay");
        generateDecklistMenu(gDeckRegistry, (newDeckRegistry) => {
            [...Object.values(newDeckRegistry)].forEach((d) => gDeckRegistry[d.slug] = d);
            [...Object.keys(gDeckRegistry)].forEach((k) => {
                if (!(k in newDeckRegistry)) {
                    eraseDeck(k); 
                }
            });
        });
        decklistOverlay.style.display = "block";
        
    };
}
