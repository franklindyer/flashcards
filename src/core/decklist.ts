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
import {
    promptForLogCreds,
    validateLogCreds
} from "./logging"

export function generateDecklistMenu(
        decklist: IDictionary<FlashcardDeck<any>>,
        onfinish: (st: IDictionary<FlashcardDeck<any>>) => void) {
    var contDiv = document.createElement("div");
    console.log(gDeckTypeRegistry);
    var menuTpl = `
        <menu-list class="decklist-menu">
            <div class="decklist-menu-header">
                <div class="decklist-menu-primary-actions">
                    <h2 class="decklist-menu-title">Decks</h2>
                </div>
                <div class="decklist-menu-secondary-actions">
                    <label class="decklist-label" for="deck-type-select">Deck type</label>
                    <select id="deck-type-select" class="menu-options-decktype decklist-select">
                        {% for dt in decktypes %}
                        <option value="{{ dt }}">{{ deckDefaultRegistry[dt].name }}</option>
                        {% endfor %}
                    </select>
                    <button class="menu-add-another-button decklist-primary-button">Create new deck</button>
                    <button class="menu-import-file-button decklist-secondary-button">Import from file</button>
                </div>
                <div class="decklist-menu-meta-actions">
                    <div class="decklist-menu-sync-section">
                        <span class="decklist-section-label">Sync</span>
                        <button class="menu-setup-sync-server decklist-link-button">Setup sync server</button>
                        <button class="menu-import-remote-button decklist-link-button">Import from server</button>
                        <div class="menu-sync-server-info-div decklist-meta-text"></div>
                    </div>
                    <div class="decklist-menu-log-section">
                        <span class="decklist-section-label">Logging</span>
                        <button class="menu-setup-log-server decklist-link-button">Setup logging server</button>
                        <div class="menu-log-server-info-div decklist-meta-text"></div>
                    </div>
                </div>
            </div>
            <div class="decklist-menu-list">
                <div class="list-entry-container"></div>
                <menu-group class="list-default-entry deck-editor-entry">
                    <div class="decklist-edit-div">
                        <div class="decklist-edit-row">
                            <label class="decklist-label" for="deck-name">Name</label>
                            <menu-textbox id="deck-name" name="name"></menu-textbox>
                        </div>
                        <div class="decklist-edit-row">
                            <label class="decklist-label" for="deck-color">Accent color</label>
                            <menu-textbox id="deck-color" name="view.color"></menu-textbox>
                        </div>
                        <div class="decklist-edit-row decklist-edit-row-inline">
                            <menu-checkbox name="doSync"></menu-checkbox>
                            <label for="doSync">Sync deck with server</label>
                        </div>
                        <div class="decklist-edit-row decklist-edit-row-inline">
                            <menu-checkbox name="doLog"></menu-checkbox>
                            <label for="doLog">Log answers to server</label>
                        </div>
                        <div class="decklist-edit-row">
                            <label class="decklist-label" for="deck-slug">Deck ID</label>
                            <menu-textbox id="deck-slug" name="slug" disabled="true"></menu-textbox>
                        </div>
                        <div class="decklist-edit-actions">
                            <button class="decklist-save-button decklist-primary-button">Save deck</button>
                        </div>
                    </div>
                    <div class="decklist-view-div">
                        <div class="decklist-view-main">
                            <b class="decklist-view-title"></b>
                        </div>
                        <div class="decklist-view-actions">
                            <button class="decklist-study-button deck-editor-button decklist-primary-button">Study</button>
                            <button class="decklist-edit-button deck-editor-button">Edit</button>
                            <button class="list-entry-remove-button menu-list-remove-button deck-editor-button">Delete</button>
                            <button class="list-entry-restore-button deck-editor-button">Restore</button>
                        </div>
                    </div>
                </menu-group>
            </div>
        </menu-list>       
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
    var logSetupButton = <any>menu.querySelector(".menu-setup-log-server");
    var logInfoDiv = <any>menu.querySelector(".menu-log-server-info-div");

    newDeckButton.onclick = (e: any) => {
        var st = menu.getState();
        var decktype = deckTypeSelect.value;
        var newDeck = <any>JSON.parse(JSON.stringify(gDeckDefaultRegistry[decktype]));
        newDeck.slug = guidGenerator();
        st.push(newDeck);
        menu.setState(st);
        saveDeck(st.slug, () => {});
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
                saveDeck(st.slug, () => {});
            };
            reader.readAsText(file, "UTF-8");
        };
        fileUploadInput.click();
    };

    // SYNC SERVER
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
            saveDeck(deckslug, () => {});
        });
    };

    // LOGGING SERVER
    logInfoDiv.style.display = "none";
    var updateLogServerDiv = (r: string, s: string) => {
        logInfoDiv.style.display = "block";
        logInfoDiv.innerHTML = `
            <a>Log server URL: <code>${r}</code></a> <br />
            <a>Log server user key: <code>${s.slice(0, 8)}...</code></a>
        `;
    };

    logSetupButton.onclick = (e: any) => {
        promptForLogCreds(updateLogServerDiv);
    };
    
    validateLogCreds(
        updateLogServerDiv,
        () => {}
    );    

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
            nameView.textContent = nameInput.getState();
            el.style.backgroundColor = colorInput.getState();
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
