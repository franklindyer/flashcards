"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExampleSpacedRepGen = void 0;
const spaced_repetition_general_1 = require("./spaced-repetition-general");
class ExampleSpacedRepGen extends spaced_repetition_general_1.AbstractSpacedRepGen {
    getGenName() { return "simple-spaced-repetition"; }
    makeEmptyCard() { return null; }
    cardHint(card) { return null; }
    cardIsDue(card) { return null; }
    cardIsNew(card) { return null; }
    updateCard(settings, cardData, correct) {
        return null;
    }
    repairDeckState(st) { return null; }
    generateCard(data) {
        return null;
    }
    checkAnswer(answer, st, data) {
        return null;
    }
    correctEffect(st, data, attempt, resolve) {
        return null;
    }
}
exports.ExampleSpacedRepGen = ExampleSpacedRepGen;
