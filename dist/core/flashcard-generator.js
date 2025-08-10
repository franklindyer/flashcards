"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlashcardGen = exports.FlashcardResult = void 0;
const utils_1 = require("utils/utils");
var FlashcardResult;
(function (FlashcardResult) {
    FlashcardResult[FlashcardResult["Correct"] = 0] = "Correct";
    FlashcardResult[FlashcardResult["Incorrect"] = 1] = "Incorrect";
    FlashcardResult[FlashcardResult["Unanswered"] = 2] = "Unanswered";
})(FlashcardResult || (exports.FlashcardResult = FlashcardResult = {}));
var SOONEST_RUN = null;
class FlashcardGen {
    // Type S is the state type for this flashcard deck
    // Type D is the type of the data involved in the single card
    getGenName() {
        throw new Error("getGenName not implemented!");
    }
    showLoading = false;
    async runOnce(s, setState, callback) {
        this.showLoading = true;
        setTimeout(() => {
            if (this.showLoading) {
                (0, utils_1.showLoadingIcon)();
            }
        }, 500);
        var thisRunTime = new Date();
        console.log(thisRunTime);
        SOONEST_RUN = thisRunTime;
        var cardData = await this.getNextCardAsync(s);
        var card = await this.generateCardAsync(s, cardData);
        card.check = (ans) => this.checkAnswerAsync(ans, s, cardData);
        if (thisRunTime.getTime() !== SOONEST_RUN.getTime()) {
            console.log(`Canceling run for ${thisRunTime} as it is not the most recent`);
            return;
        }
        (0, utils_1.hideLoadingIcon)();
        this.showLoading = false;
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
                var newState = await this.updateStateAsync(s, cardData, FlashcardResult.Correct);
                this.correctEffect(newState, cardData, "", correctCallback(newState));
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
