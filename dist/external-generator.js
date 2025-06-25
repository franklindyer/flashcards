"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExternalFlashcardGen = void 0;
const flashcard_generator_1 = require("./flashcard-generator");
class ExternalFlashcardGen extends flashcard_generator_1.FlashcardGen {
    getGenName() { return "external-flashcard-gen"; }
    repairDeckState(st) { return st; }
    correctEffect(_, __, ___, resolve) { resolve(); }
    ;
    getNextCardAsync(state) {
        var url = state.url + "/getNextCard";
        var postBody = {
            state: state
        };
        return fetch(url, {
            method: "POST",
            body: JSON.stringify(postBody)
        }).then((r) => r.json())
            .then((r) => r);
    }
    updateStateAsync(state, cardData, correct) {
        return null;
    }
    checkAnswerAsync(ans, state, cardData) {
        return null;
    }
    generateCardAsync(data) {
        return null;
    }
}
exports.ExternalFlashcardGen = ExternalFlashcardGen;
