"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlashcardSyncGen = void 0;
const flashcard_generator_1 = require("core/flashcard-generator");
class FlashcardSyncGen extends flashcard_generator_1.FlashcardGen {
    // Type S is the state type for this flashcard deck
    // Type D is the type of the data involved in the single card
    getGenName() {
        throw new Error("getGenName not implemented!");
    }
    getNextCardAsync(state) {
        return new Promise((resolve, _) => { resolve(this.getNextCard(state)); });
    }
    updateStateAsync(state, cardData, correct) {
        return new Promise((resolve, _) => { resolve(this.updateState(state, cardData, correct)); });
    }
    generateCardAsync(state, data) {
        return new Promise((resolve, _) => { resolve(this.generateCard(state, data)); });
    }
    checkAnswerAsync(answer, state, data) {
        return new Promise((resolve, _) => { resolve(this.checkAnswer(answer, state, data)); });
    }
}
exports.FlashcardSyncGen = FlashcardSyncGen;
