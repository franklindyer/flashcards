import {
    IDictionary,
    downloadText
} from "utils/utils"
import {
    FlashcardGen
} from "core/flashcard-generator"
import {
    StateEditor
} from "core/editor"
import {
    getDeckSlugs,
    getDeckJSON,
    setDeckJSON,
    deleteDeck
} from "./fs"

export type FlashcardDeckType<S, D> = {
    slug: string,
    gen: FlashcardGen<S, D>,
    editor: (s: S) => StateEditor<S> 
}

export type FlashcardDeckView = {
    color: string
}

export type FlashcardDeck<S> = {
    name: string,
    slug: string,
    type: string,
    view: FlashcardDeckView,
    state: S
}

export const gDeckTypeRegistry: IDictionary<FlashcardDeckType<any, any>> = {};
export const gDeckRegistry: IDictionary<FlashcardDeck<any>> = {};
export const gDeckDefaultRegistry: IDictionary<FlashcardDeck<any>> = {};

export function setDeck(deckSlug: string, deckString: string, callback: () => void) {
    var deck = <FlashcardDeck<any>>JSON.parse(deckString);
    gDeckRegistry[deckSlug] = deck;
    saveDeck(deckSlug, callback);
}

export function saveDeck(deckSlug: string, callback: () => void) {
    setDeckJSON(deckSlug, JSON.stringify(gDeckRegistry[deckSlug])).then((_) => callback());
}

function loadDeckIfExists(deckSlug: string) {
    return getDeckJSON(deckSlug).then((j) => {
        if (j.length > 0) {
            var d = <FlashcardDeck<any>>JSON.parse(j);
            gDeckRegistry[d.slug] = d;
        }
    });
}

export function loadAllDecks() {
    var deckSlugsP = getDeckSlugs(); 
    var deckSlugs = Object.keys(gDeckRegistry);
    return deckSlugsP.then((slugs) => Promise.all(slugs.map(loadDeckIfExists)));
}

export function eraseDeck(deckSlug: string) {
    delete gDeckRegistry[deckSlug];
    deleteDeck(deckSlug);
}

/* Setup general-purpose menus */

function menuSetup<S, D>(deckSlug: string) {
    var deck = gDeckRegistry[deckSlug];
    var decktypeSlug = deck.type;
    var decktype = gDeckTypeRegistry[decktypeSlug]

    var getState = () => gDeckRegistry[deckSlug].state;

    var editBtn = document.getElementById("deck-edit-button")!;
    editBtn.onclick = () => {
        var editorOverlay = document.getElementById("flashcard-deck-editor-overlay")!;
        var editorCont = document.getElementById("flashcard-deck-editor")!;
        var editor =  decktype.editor(getState());
        editorOverlay.style.display = "inline-block";
        editorCont.replaceChildren(editor.element);
        var doneBtn = document.getElementById("flashcard-deck-editor-close")!;
        window.onbeforeunload = function() {
            return "Are you sure you want to leave before saving your deck?";
        };
        doneBtn.onclick = () => {
            window.onbeforeunload = () => {};
            editorOverlay.style.display = "none";
            deck.state = editor.menuToState();
            gDeckRegistry[deckSlug].state = deck.state;
            saveDeck(deckSlug, () => {});
            runDeck(deck.slug);
        };
    };
}

function importExportSetup<S>(deckSlug: string, setDeck: (s: S) => void) {
    var importBtn = document.getElementById("import-deck-button")!;
    var fileUploadInput = document.getElementById("deck-upload-file")!;
    var exportBtn = document.getElementById("export-deck-button")!;

    importBtn.onclick = (e) => {
        fileUploadInput.click();
        fileUploadInput.onchange = (e) => {
            var files = (<HTMLInputElement>fileUploadInput).files;
            if (files == null) return;
            var file = files[0];
            if (file == null) return;
            var reader = new FileReader();
            reader.onload = (e) => {
                var importedDeck = JSON.parse(<string>e.target!.result);
                importedDeck.slug = deckSlug;
                setDeck(importedDeck);
            };
            reader.readAsText(file, "UTF-8");
        };
    }

    exportBtn.onclick = (e) => {
        downloadText(deckSlug, JSON.stringify(gDeckRegistry[deckSlug], null, "\t")); 
    } 
}

export function runDeck(deckSlug: string) {
    setLastDeck(deckSlug);
    document.getElementById("flashcard-container")!.innerHTML = "";

    var decktype = gDeckTypeRegistry[gDeckRegistry[deckSlug].type];
    gDeckRegistry[deckSlug].state = decktype.gen.repairDeckState(gDeckRegistry[deckSlug].state)

    var getState = () => gDeckRegistry[deckSlug].state;
    var setState = (state: any) => {
        gDeckRegistry[deckSlug].state = state;
    }
    
    menuSetup(deckSlug);
    importExportSetup(deckSlug, (s: any) => {
        gDeckRegistry[deckSlug] = s;
        saveDeck(deckSlug, () => {
            runDeck(deckSlug); 
        })
    });

    decktype.gen.runLoop(getState, setState, () => saveDeck(deckSlug, () => {}));
}

export function setLastDeck(deckSlug: string) {
    localStorage.setItem("last-deck-slug", deckSlug);
}

export function getStartingDeck(defaultSlug: string): string {
    var lastDeckSlug = localStorage.getItem("last-deck-slug");
    if ((lastDeckSlug == undefined) || !(lastDeckSlug! in gDeckRegistry)) {
        return defaultSlug;
    }
    return lastDeckSlug;
}

/* Register a new type of deck */

export function registerDeckType<S, D>(
    gen: FlashcardGen<S, D>,
    defaultSlug: string,
    defaultName: string,
    defaultState: S,
    colorCode: string = "#ffffee"
    ) {
    gDeckTypeRegistry[gen.getGenName()] = {
        slug: gen.getGenName(),
        gen: gen,
        editor: gen.makeEditor
    };
    gDeckDefaultRegistry[gen.getGenName()] = {
        name: defaultName,
        slug: defaultSlug,
        type: gen.getGenName(),
        state: defaultState,
        view: {
            color: colorCode
        }
    }
}
