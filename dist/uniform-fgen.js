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
        state.history.push([cardData[0], correct]);
        return state;
    }
}
class KVBasicTemplate extends flashcard_template_1.FlashcardTemplate {
    generateCard(data) {
        var a = document.createElement("a");
        a.textContent = data[0];
        var fl = new flashcard_1.Flashcard(a, (answer) => data[1] == answer);
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
var kvState = {
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
var gen = new KVFlashcardGen();
gen.template = new KVBasicTemplate();
flashcard_deck_1.gDeckTypeRegistry[gen.getGenName()] = {
    slug: gen.getGenName(),
    gen: gen,
    editor: makeKVEditor
};
flashcard_deck_1.gDeckRegistry["simple-key-value-deck"] = {
    name: "Simple key-value deck",
    slug: "simple-key-value-deck",
    type: gen.getGenName(),
    state: kvState
};
