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
    async runOnce(s, setState, callback) {
        var cardData = await this.getNextCardAsync(s);
        var card = await this.generateCardAsync(cardData);
        card.check = async (ans) => this.checkAnswerAsync(ans, s, cardData);
        var inputBox = document.getElementById("answer-input");
        var correctCallback = (newState) => () => {
            inputBox.value = "";
            setState(newState);
            card.slideOut(callback, true);
        };
        var inputCallback = async (attempt) => {
            var correct = await card.check(attempt);
            if (correct) {
                inputBox.onkeydown = (e) => { }; // To prevent multiple submissions by accident
                var result = card.correctFirst ? FlashcardResult.Correct : FlashcardResult.Incorrect;
                var newState = await this.updateStateAsync(s, cardData, result);
                await this.correctEffect(newState, cardData, attempt, correctCallback(newState));
            }
            else {
                card.markWrong();
                inputBox.oninput = (e) => {
                    inputBox.value = e.data;
                    inputBox.oninput = (e) => { };
                };
            }
        };
        inputBox.onkeydown = async (e) => {
            if (e.key == "Enter") {
                inputCallback(inputBox.value);
            }
            else if (e.key == "ArrowUp") {
                // console.log("UP");
                var newState = await this.updateStateAsync(s, cardData, FlashcardResult.Correct);
                // correctCallback(newState)();
                this.correctEffect(newState, cardData, "", correctCallback(newState));
                // inputBox.value = "";
                // setState(this.updateState(s, cardData, FlashcardResult.Correct)); 
                // card.slideOut(callback, true);
            }
            else if (e.key == "ArrowDown") {
                inputBox.value = "";
                this.updateStateAsync(s, cardData, FlashcardResult.Unanswered).then(setState);
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
