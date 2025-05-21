"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlashcardGen = exports.FlashcardResult = void 0;
var FlashcardResult;
(function (FlashcardResult) {
    FlashcardResult[FlashcardResult["Correct"] = 0] = "Correct";
    FlashcardResult[FlashcardResult["Incorrect"] = 1] = "Incorrect";
    FlashcardResult[FlashcardResult["Unanswered"] = 2] = "Unanswered";
})(FlashcardResult || (exports.FlashcardResult = FlashcardResult = {}));
class FlashcardGen {
    // Type S is the state type for this flashcard deck
    // Type D is the type of the data involved in the single card
    getGenName() {
        throw new Error("getGenName not implemented!");
    }
    runOnce(s, setState, callback) {
        var cardData = this.getNextCard(s);
        var card = this.generateCard(cardData);
        card.check = (ans) => this.checkAnswer(ans, s, cardData);
        var inputBox = document.getElementById("answer-input");
        var correctCallback = (newState) => () => {
            inputBox.value = "";
            setState(newState);
            card.slideOut(callback, true);
        };
        var inputCallback = (attempt) => {
            var correct = card.check(attempt);
            if (correct) {
                var result = card.correctFirst ? FlashcardResult.Correct : FlashcardResult.Incorrect;
                var newState = this.updateState(s, cardData, result);
                this.correctEffect(newState, cardData, attempt, correctCallback(newState));
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
                // console.log("UP");
                var newState = this.updateState(s, cardData, FlashcardResult.Correct);
                // correctCallback(newState)();
                this.correctEffect(newState, cardData, "", correctCallback(newState));
                // inputBox.value = "";
                // setState(this.updateState(s, cardData, FlashcardResult.Correct)); 
                // card.slideOut(callback, true);
            }
            else if (e.key == "ArrowDown") {
                inputBox.value = "";
                setState(this.updateState(s, cardData, FlashcardResult.Unanswered));
                card.slideOut(callback, false);
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
