"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const flashcard_1 = require("core/flashcard");
const flashcard_template_1 = require("core/flashcard-template");
class BasicFlashcardTemplate extends flashcard_template_1.FlashcardTemplate {
    getName() { return "basic-template"; }
    render(data) {
        var a = document.createElement("div");
        a.textContent = data[0];
        var fontSize = 100.0 / (10.0 * Math.log(10 + data[0].length));
        var fl = new flashcard_1.Flashcard(a, data[1]);
        fl.el.style.fontSize = `${fontSize}vw`;
        return fl;
    }
}
(0, flashcard_template_1.registerTemplate)(new BasicFlashcardTemplate());
