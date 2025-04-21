"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlashcardGen = void 0;
class FlashcardGen {
    // Type S is the state type for this flashcard deck
    // Type D is the type of the data involved in the single card
    getGenName() {
        throw new Error("getGenName not implemented!");
    }
    state;
    template;
    runOnce(callback) {
        var cardData = this.getNextCard(this.state);
        var card = this.template.generateCard(cardData);
        var inputBox = document.getElementById("answer-input");
        var inputCallback = (attempt) => {
            var correct = card.check(attempt);
            if (correct) {
                card.slideOut(callback);
                inputBox.value = "";
                this.state = this.updateState(this.state, cardData, card.correctFirst);
            }
            else {
                card.markWrong();
                inputBox.oninput = (e) => {
                    inputBox.value = e.data;
                    inputBox.oninput = (e) => { };
                };
            }
        };
        inputBox.onkeydown = (e) => {
            if (e.key == "Enter") {
                inputCallback(inputBox.value);
            }
        };
        card.slideIn();
    }
    runLoop(callback) {
        var looper = () => {
            this.runOnce(() => {
                callback();
                looper();
            });
        };
        looper();
    }
}
exports.FlashcardGen = FlashcardGen;
