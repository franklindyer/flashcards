"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KVFlashcardGen = void 0;
const flashcard_generator_1 = require("./flashcard-generator");
const flashcard_deck_1 = require("./flashcard-deck");
const flashcard_template_1 = require("./flashcard-template");
const editor_1 = require("./editor");
class KVFlashcardGen extends flashcard_generator_1.FlashcardGen {
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
    generateCard(data) {
        return (0, flashcard_template_1.renderCard)("basic-template", data);
    }
    correctEffect(_, __, ___, resolve) { resolve(); }
    ;
    repairDeckState(st) { return st; }
}
exports.KVFlashcardGen = KVFlashcardGen;
function makeKVEditor(state) {
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
var kvDefaultState = {
    deck: [
        ["cat", "gato"],
        ["dog", "perro"],
        ["{r0:the dog,the cat} runs", "{r0:el perro,el gato} corre"],
        ["{r0:I want,you want,he wants} {r1:to eat,to drink}", "{r0:quiero,quieres,quiere} {r1:comer,beber}"]
    ],
    history: []
};
(0, flashcard_deck_1.registerDeckType)(new KVFlashcardGen(), makeKVEditor, "key-value-quizzer", "Simple key-value quizzer", kvDefaultState);
