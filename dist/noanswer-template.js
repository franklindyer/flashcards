"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const flashcard_1 = require("./flashcard");
const flashcard_template_1 = require("./flashcard-template");
class NoAnswerFlashcardTemplate extends flashcard_template_1.FlashcardTemplate {
    getName() { return "noanswer-template"; }
    render(data) {
        var a = document.createElement("div");
        a.textContent = data;
        var fontSize = 100.0 / (10.0 * Math.log(10 + data[0].length));
        var fl = new flashcard_1.Flashcard(a, "", (_) => (0, utils_1.trivialPromise)(false));
        fl.el.style.fontSize = `${fontSize}vw`;
        return fl;
    }
}
(0, flashcard_template_1.registerTemplate)(new NoAnswerFlashcardTemplate());
