"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const flashcard_generator_1 = require("./flashcard-generator");
const flashcard_deck_1 = require("./flashcard-deck");
const flashcard_template_1 = require("./flashcard-template");
const speech_1 = require("./speech");
const editor_1 = require("./editor");
class TranscriptFlashcardGen extends flashcard_generator_1.FlashcardGen {
    getGenName() { return "transcript-generator"; }
    getNextCard(state) {
        var dat = state.deck[Math.floor(Math.random() * Object.keys(state.deck).length)];
        return {
            text: dat,
            speechSettings: state.settings.speechSettings
        };
    }
    updateState(state, cardData, correct) {
        return state;
    }
    generateCard(data) {
        return (0, flashcard_template_1.renderCard)("transcript-template", data);
    }
    correctEffect(_, __, resolve) { resolve(); }
    ;
}
function makeTranscriptEditor(state) {
    var entriesEd = (0, editor_1.multipleEditors)(state.deck, () => "", editor_1.singleTextFieldEditor);
    entriesEd.element.classList.add("deck-menu-submenu");
    var speechEd = (0, speech_1.speechSettingsEditor)(state.settings.speechSettings);
    speechEd.element.classList.add("deck-menu-submenu");
    var container = document.createElement("div");
    container.appendChild(speechEd.element);
    container.appendChild(entriesEd.element);
    return {
        element: container,
        menuToState: () => {
            return {
                deck: entriesEd.menuToState(),
                settings: {
                    speechSettings: speechEd.menuToState()
                }
            };
        }
    };
}
var transcriptionDefaultState = {
    deck: [
        "Hello, how are you?",
        "My name is Bob.",
        "What strange weather we're having.",
        "I'm 50 years old."
    ],
    settings: {
        speechSettings: (0, speech_1.defaultSpeechSettings)()
    }
};
(0, flashcard_deck_1.registerDeckType)(new TranscriptFlashcardGen(), makeTranscriptEditor, "transcription-quizzer", "Transcription quizzer", transcriptionDefaultState);
