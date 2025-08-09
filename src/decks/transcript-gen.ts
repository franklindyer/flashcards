import {
    IDictionary,
    guidGenerator
} from "utils/utils"
import {
    Flashcard
} from "core/flashcard"
import {
    FlashcardResult,
    FlashcardGen
} from "core/flashcard-generator"
import {
    FlashcardSyncGen
} from "core/flashcard-sync-generator"
import {
    gDeckTypeRegistry,
    gDeckRegistry,
    registerDeckType
} from "core/flashcard-deck"
import {
    renderCard
} from "core/flashcard-template"
import {
    TranscriptCardData
} from "utils/transcript-template"
import {
    SpeechSettings,
    defaultSpeechSettings,
    speechSettingsEditor
} from "utils/speech"
import {
    StateEditor,
    makeTranslationEditor,
    multipleEditors,
    singleTextFieldEditor,
    fileUploadEditor
} from "core/editor"

type TranscriptDeckSettings = {
    speechSettings: SpeechSettings
};

type TranscriptDeckState = {
    deck: string[],
    settings: TranscriptDeckSettings
};

class TranscriptFlashcardGen extends FlashcardSyncGen<TranscriptDeckState, TranscriptCardData> {
    getGenName() { return "transcript-generator"; }

    getNextCard(state: TranscriptDeckState): TranscriptCardData {
        var dat = state.deck[Math.floor(Math.random() * Object.keys(state.deck).length)];
        return {
            text: dat,
            speechSettings: state.settings.speechSettings
        };
    }

    updateState(state: TranscriptDeckState, cardData: TranscriptCardData, correct: FlashcardResult): TranscriptDeckState {
        return state;
    }
    
    checkAnswer(ans: string, st: TranscriptDeckState, data: TranscriptCardData) {
        return (ans == data.text);
    }

    generateCard(st: TranscriptDeckState, data: TranscriptCardData): Flashcard {
        return renderCard("transcript-template", data);
    }

    correctEffect(_: TranscriptDeckState, __: TranscriptCardData, ___: string, resolve: () => void) { resolve() };
    repairDeckState(st: any) { return st; } 
}

function makeTranscriptEditor(state: TranscriptDeckState): StateEditor<TranscriptDeckState> {
    var speechEd = speechSettingsEditor(state.settings.speechSettings);
    speechEd.element.classList.add("deck-menu-submenu");

    var fileEd = fileUploadEditor("Upload a list of phrases", (s: string) => {});
    fileEd.element.classList.add("deck-menu-submenu");   
 
    var container = document.createElement("div");
    container.appendChild(speechEd.element);
    container.appendChild(fileEd.element);

    return {
        element: container,
        menuToState: () => {
            var fileInput = fileEd.menuToState();
            return {
                deck: fileInput.length == 0 ? state.deck : fileInput.split('\n').map((x: string) => x.trim()),
                settings: {
                    speechSettings: speechEd.menuToState()
                }
            };
        }
    }
}

var transcriptionDefaultState: TranscriptDeckState = {
    deck: [
        "Hello, how are you?",
        "My name is Bob.",
        "What strange weather we're having.",
        "I'm 50 years old."
    ],
    settings: {
        speechSettings: defaultSpeechSettings()
    }
};

registerDeckType(
    new TranscriptFlashcardGen(),
    makeTranscriptEditor,
    "transcription-quizzer",
    "Transcription quizzer",
    transcriptionDefaultState
);
