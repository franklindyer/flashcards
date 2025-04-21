"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlashcardGen = void 0;
class FlashcardGen {
    // Type S is the state type for this flashcard deck
    // Type D is the type of the data involved in the single card
    getGenName() {
        throw new Error("getGenName not implemented!");
    }
    template;
    runOnce(s, setState, callback) {
        var cardData = this.getNextCard(s);
        var card = this.template.generateCard(cardData);
        var inputBox = document.getElementById("answer-input");
        var inputCallback = (attempt) => {
            var correct = card.check(attempt);
            if (correct) {
                inputBox.value = "";
                setState(this.updateState(s, cardData, card.correctFirst));
                card.slideOut(callback);
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
            else if (e.key == "ArrowUp") {
                inputBox.value = "";
                setState(this.updateState(s, cardData, true));
                card.slideOut(callback);
            }
        };
        card.slideIn();
    }
    runLoop(getState, setState, callback) {
        var looper = () => {
            this.runOnce(getState(), setState, () => {
                callback();
                looper();
            });
        };
        looper();
    }
}
exports.FlashcardGen = FlashcardGen;
