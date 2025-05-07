import {
    IDictionary,
    guidGenerator
} from "./utils"
import {
    Flashcard
} from "./flashcard"
import {
    FlashcardResult,
    FlashcardGen
} from "./flashcard-generator"
import {
    gDeckTypeRegistry,
    gDeckRegistry,
    registerDeckType
} from "./flashcard-deck"
import {
    renderCard
} from "./flashcard-template"
import {
    TranscriptCardData
} from "./transcript-template"
import {
    SpeechSettings,
    defaultSpeechSettings,
    speechSettingsEditor
} from "./speech"
import {
    StateEditor,
    makeTranslationEditor,
    multipleEditors,
    singleTextFieldEditor,
    fileUploadEditor
} from "./editor"

type TranscriptDeckSettings = {
    speechSettings: SpeechSettings
};

type TranscriptDeckState = {
    deck: string[],
    settings: TranscriptDeckSettings
};

class TranscriptFlashcardGen extends FlashcardGen<TranscriptDeckState, TranscriptCardData> {
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
    
    generateCard(st: TranscriptDeckState, data: TranscriptCardData): Flashcard {
        return renderCard("transcript-template", data);
    }

    correctEffect(_: TranscriptDeckState, __: string, resolve: () => void) { resolve() };
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
