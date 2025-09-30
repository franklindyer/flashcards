"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const flashcard_1 = require("core/flashcard");
const flashcard_template_1 = require("core/flashcard-template");
class ClozeFlashcardTemplate extends flashcard_template_1.FlashcardTemplate {
    getName() { return "cloze-template"; }
    render(data) {
        var el = document.createElement("div");
        el.style.display = "block";
        el.style.textAlign = "center";
        var aUpper = document.createElement("p");
        var aLower = document.createElement("p");
        aUpper.style.display = "block";
        aLower.style.display = "block";
        el.appendChild(aUpper);
        el.appendChild(document.createElement("hr"));
        el.appendChild(aLower);
        var targetWords = [];
        aUpper.textContent = data.upper.replaceAll(/\{\{([^\{\}]+)\}\}/g, (match, p1) => {
            targetWords.push(p1);
            return "___";
        });
        var answer = targetWords.join(", ");
        aLower.textContent = data.lower;
        var fontSize = 900.0 / (10.0 * Math.log(10 + aUpper.textContent.length));
        aUpper.style.fontSize = `${fontSize}px`;
        aLower.style.fontSize = `${0.7 * fontSize}px`;
        var puzzleSourceSpan = document.createElement("span");
        puzzleSourceSpan.textContent = data.group;
        puzzleSourceSpan.classList.add("cloze-puzzle-attribution");
        el.appendChild(puzzleSourceSpan);
        var fl = new flashcard_1.Flashcard(el, answer);
        return fl;
    }
}
(0, flashcard_template_1.registerTemplate)(new ClozeFlashcardTemplate());
