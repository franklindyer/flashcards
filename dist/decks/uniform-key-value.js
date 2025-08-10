"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KVFlashcardGen = void 0;
const flashcard_generator_1 = require("core/flashcard-generator");
const flashcard_sync_generator_1 = require("core/flashcard-sync-generator");
const flashcard_deck_1 = require("core/flashcard-deck");
const flashcard_template_1 = require("core/flashcard-template");
const editor_1 = require("core/editor");
class KVFlashcardGen extends flashcard_sync_generator_1.FlashcardSyncGen {
    getGenName() { return "uniform-key-value"; }
    getNextCard(state) {
        var dat = state.deck[Math.floor(Math.random() * Object.keys(state.deck).length)];
        return dat;
    }
    updateState(state, cardData, correct) {
        if (correct != flashcard_generator_1.FlashcardResult.Unanswered) {
            state.history.push([cardData[0], correct == flashcard_generator_1.FlashcardResult.Correct]);
        }
        return state;
    }
    checkAnswer(ans, state, cardData) {
        return (ans == cardData[1]);
    }
    generateCard(_, data) {
        return (0, flashcard_template_1.renderCard)("basic-template", data);
    }
    makeEditor(state) {
        var transEd = (0, editor_1.makeTranslationEditor)(state.deck, (x) => true);
        return {
            element: transEd.element,
            menuToState: () => {
                return {
                    deck: transEd.menuToState(),
                    history: state.history
                };
            }
        };
    }
    correctEffect(_, __, ___, resolve) { resolve(); }
    ;
    repairDeckState(st) { return st; }
}
exports.KVFlashcardGen = KVFlashcardGen;
var kvDefaultState = {
    deck: [
        ["cat", "gato"],
        ["dog", "perro"],
        ["el perro runs", "el perro corre"],
    ],
    history: []
};
(0, flashcard_deck_1.registerDeckType)(new KVFlashcardGen(), "key-value-quizzer", "Simple key-value quizzer", kvDefaultState);
