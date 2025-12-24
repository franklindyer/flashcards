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
    MenuComponent
} from "menus/menus"
import {
    promptForSyncCreds,
    syncUploadDeck,
    syncDownloadDeck,
    validateSyncCreds
} from "./synchronization"

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
            <div class="menu-sync-server-info-div"></div>
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
    var syncInfoDiv = <any>menu.querySelector(".menu-sync-server-info-div");

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
                var st = menu.getState();
                st.push(importedDeck);
                menu.setState(st);
            };
            reader.readAsText(file, "UTF-8");
        };
        fileUploadInput.click();
    };

    syncInfoDiv.style.display = "none";
    var updateSyncServerDiv = (r: string, s: string) => {
        syncInfoDiv.style.display = "block";
        syncInfoDiv.innerHTML = `
            <a>Sync server URL: <code>${r}</code></a> <br />
            <a>Sync server user key: <code>${s.slice(0, 8)}...</code></a>
        `;
    };

    syncSetupButton.onclick = (e: any) => {
        promptForSyncCreds(updateSyncServerDiv);
    };

    validateSyncCreds(
        updateSyncServerDiv,
        () => {}
    );    

    syncDeckButton.onclick = (e: any) => {
        var deckslug = prompt("Enter the ID of the deck you would like to download.") || "";
        var defaultDate = new Date("1970-01-01T00:00:00Z");
        syncDownloadDeck(deckslug, defaultDate, (s: string) => {
            var st = menu.getState();
            st.push(JSON.parse(s));
            menu.setState(st);
        });
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
            runDeck(id);
            // saveDeck(id, () => runDeck(id));
        };
        updateDeckView();
    };

    menu.setState([...Object.values(gDeckRegistry)]);    

    var decklistEditor = <HTMLElement>document.getElementById("flashcard-decklist-editor");
    decklistEditor.innerHTML = "";
    var decklistOverlay = <HTMLElement>document.getElementById("flashcard-decklist-overlay");
    decklistEditor.appendChild(menu);
}

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
