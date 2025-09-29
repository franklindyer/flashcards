"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const flashcard_sync_generator_1 = require("core/flashcard-sync-generator");
const flashcard_deck_1 = require("core/flashcard-deck");
const flashcard_template_1 = require("core/flashcard-template");
const speech_1 = require("utils/speech");
const editor_1 = require("core/editor");
class TranscriptFlashcardGen extends flashcard_sync_generator_1.FlashcardSyncGen {
    getGenName() { return "transcript-generator"; }
    getNextCard(state) {
        var dat = state.deck[Math.floor(Math.random() * Object.keys(state.deck).length)];
        return {
            spokenText: dat,
            hintText: dat,
            speechSettings: state.settings.speechSettings
        };
    }
    updateState(state, cardData, correct) {
        return state;
    }
    checkAnswer(ans, st, data) {
        return (ans == data.hintText);
    }
    generateCard(st, data) {
        return (0, flashcard_template_1.renderCard)("transcript-template", data);
    }
    makeEditor(state) {
        var speechEd = (0, speech_1.speechSettingsEditor)(state.settings.speechSettings);
        speechEd.element.classList.add("deck-menu-submenu");
        var fileEd = (0, editor_1.fileUploadEditor)("Upload a list of phrases", (s) => { });
        fileEd.element.classList.add("deck-menu-submenu");
        var container = document.createElement("div");
        container.appendChild(speechEd.element);
        container.appendChild(fileEd.element);
        return {
            element: container,
            menuToState: () => {
                var fileInput = fileEd.menuToState();
                return {
                    deck: fileInput.length == 0 ? state.deck : fileInput.split('\n').map((x) => x.trim()),
                    settings: {
                        speechSettings: speechEd.menuToState()
                    }
                };
            }
        };
    }
    correctEffect(_, __, ___, resolve) { resolve(); }
    ;
    repairDeckState(st) { return st; }
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
(0, flashcard_deck_1.registerDeckType)(new TranscriptFlashcardGen(), "transcription-quizzer", "Transcription quizzer", transcriptionDefaultState);
