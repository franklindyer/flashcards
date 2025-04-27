"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const flashcard_1 = require("./flashcard");
const flashcard_generator_1 = require("./flashcard-generator");
const flashcard_template_1 = require("./flashcard-template");
const flashcard_deck_1 = require("./flashcard-deck");
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
}
class KVBasicTemplate extends flashcard_template_1.FlashcardTemplate {
    generateCard(data) {
        var a = document.createElement("a");
        a.textContent = data[0];
        var fl = new flashcard_1.Flashcard(a, (answer) => data[1] == answer, data[1]);
        var fontSize = 100.0 / (10.0 * Math.log(10 + data[0].length));
        fl.el.style.fontSize = `${fontSize}vw`;
        return fl;
    }
}
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
        ["dog", "perro"]
    ],
    history: []
};
// var kvGen = new KVFlashcardGen();
// kvGen.state = kvState;
// kvGen.template = new KVBasicTemplate();
// kvGen.runLoop()
(0, flashcard_deck_1.registerDeckType)(new KVFlashcardGen(), new KVBasicTemplate(), makeKVEditor, "key-value-quizzer", "Simple key-value quizzer", kvDefaultState);
