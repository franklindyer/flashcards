import {
    IDictionary,
    guidGenerator,
    makeDict
} from "utils/utils"
import {
    Flashcard
} from "core/flashcard"
import {
    FlashcardGen,
    FlashcardResult
} from "core/flashcard-generator"
import {
    AbstractSpacedRepGen,
    AbstractAsyncSpacedRepGen,
    SpacedRepState,
    SpacedRepCard,
    SpacedRepCardPhysical,
    SpacedRepStudying,
    makeSpacedRepCardDict
} from "decks/spaced-repetition-general"
import {
    utter,
    speechSettingsEditor,
    defaultSpeechSettings,
    SpeechSettings
} from "utils/speech"
import {
    TextFilterSettings,
    applyTextFilter,
    textFilterSelectionMenu,
    defaultTextFilterSettings
} from "utils/text-filters"
import {
    StateEditor,
    boolEditor,
    scrollNumberEditor,
    singleTextFieldEditor,
    radioEditor,
    combineEditors,
    swappingTextEditor,
    multipleEditors
} from "core/editor"
import {
    registerDeckType
} from "core/flashcard-deck"

export function infoWidgetSR<content, auxdata, settings>(
    fgen: AbstractAsyncSpacedRepGen<content, auxdata, settings>,
    st: SpacedRepState<content, auxdata, settings>
): HTMLElement {
    var contDiv = document.createElement("div");
    contDiv.classList.add("deck-menu-submenu");
    var totP = document.createElement("p"); 
    totP.textContent = `Total cards: ${Object.keys(st.cards).length}`;
    totP.style.color = "#666666";
    totP.style.fontWeight = "bold";
    var newP = document.createElement("p");
    console.log(fgen);
    newP.textContent = `New cards: ${Object.keys(st.cards).filter((i) => fgen.cardIsNew(st.cards[i]) && fgen.cardIsEnabled(st.cards[i], st)).length}`;
    newP.style.color = "#9999ee";
    newP.style.fontWeight = "bold";
    var dueP = document.createElement("p");
    dueP.textContent = `Due cards: ${Object.keys(st.cards).filter((i) => fgen.cardIsDue(st.cards[i]) && fgen.cardIsEnabled(st.cards[i], st)).length}`;
    dueP.style.color = "#ee9999";
    dueP.style.fontWeight = "bold";
    [totP, newP, dueP].map((el) => contDiv.appendChild(el));
    return contDiv;
}

export function studyingEditorSR<content, auxdata, settings>(
    st: SpacedRepState<content, auxdata, settings> 
): StateEditor<SpacedRepStudying> {
    var studyingEditor = radioEditor(
        st.studying,
        [SpacedRepStudying.NewCards, SpacedRepStudying.DueCards, SpacedRepStudying.RandomCards],
        ["Study new cards", "Study due cards", "Practice random cards"]
    );
    return studyingEditor;
}

