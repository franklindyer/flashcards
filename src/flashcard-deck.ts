import {
    IDictionary,
    guidGenerator,
    downloadText
} from "./utils"
import {
    FlashcardGen
} from "./flashcard-generator"
import {
    FlashcardTemplate
} from "./flashcard-template"
import {
    StateEditor
} from "./editor"
import {
    getDeckSlugs,
    getDeckJSON,
    setDeckJSON,
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

/* Setup general-purpose menus */

function menuSetup<S, D>(decktype: FlashcardDeckType<S, D>, deck: FlashcardDeck<S>) {
    var editBtn = document.getElementById("deck-edit-button")!;
    editBtn.onclick = () => {
        var editorOverlay = document.getElementById("flashcard-deck-editor-overlay")!;
        var editorCont = document.getElementById("flashcard-deck-editor")!;
        var editor =  decktype.editor(deck.state);
        editorOverlay.style.display = "inline-block";
        editorCont.replaceChildren(editor.element);
        var doneBtn = document.getElementById("flashcard-deck-editor-close")!;
        doneBtn.onclick = () => {
            editorOverlay.style.display = "none";
            deck.state = editor.menuToState();
            gDeckRegistry[deck.slug].state = deck.state;
            saveDeck(deck.slug, () => {});
            runDeck(deck.slug);
        };
    };
}

function importExportSetup<S>(deckSlug: string, setState: (s: S) => void) {
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
                setState(JSON.parse(<string>e.target!.result).state);
            };
            reader.readAsText(file, "UTF-8");
        };
    }

    exportBtn.onclick = (e) => {
        downloadText(deckSlug, JSON.stringify(gDeckRegistry[deckSlug]));    
    } 
}

function runWithGenerator<S, D>(decktype: FlashcardDeckType<S, D>, deck: FlashcardDeck<S>, callback: () => void) {
    document.getElementById("flashcard-container")!.innerHTML = "";
    menuSetup(decktype, deck);
    importExportSetup(deck.slug, (s: any) => {
        decktype.gen.state = s;
        saveDeck(deck.slug, () => {});
        runWithGenerator(decktype, deck, callback);
    }); 
    decktype.gen.state = deck.state;
    decktype.gen.runLoop(callback);
}

export function runDeck(deckSlug: string) {
    var deck = gDeckRegistry[deckSlug];
    var deckTypeSlug = deck.type;
    var deckType = gDeckTypeRegistry[deckTypeSlug];
    var saver = () => {
        saveDeck(deckSlug, () => {});
    };
    runWithGenerator(deckType, deck, saver);
}

/* Register a new type of deck */

export function registerDeckType<S, D>(
    gen: FlashcardGen<S, D>,
    tpl: FlashcardTemplate<D>,
    mkEd: (s: S) => StateEditor<S>,
    defaultSlug: string,
    defaultName: string,
    defaultState: S,
    ) {
    gen.template = tpl;
    gDeckTypeRegistry[gen.getGenName()] = {
        slug: gen.getGenName(),
        gen: gen,
        editor: mkEd
    };
    gDeckRegistry[defaultSlug] = {
        name: defaultName,
        slug: defaultSlug,
        type: gen.getGenName(),
        state: defaultState,
        view: {
            color: "#ffffee"
        }
    }
}
