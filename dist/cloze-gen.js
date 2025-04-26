"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const flashcard_1 = require("./flashcard");
const flashcard_generator_1 = require("./flashcard-generator");
const flashcard_template_1 = require("./flashcard-template");
const flashcard_deck_1 = require("./flashcard-deck");
class ClozeFlashcardGen extends flashcard_generator_1.FlashcardGen {
    getGenName() { return "cloze-puzzles"; }
    getNextCard(state) {
        var key = Object.keys(state.cards)[Math.floor(Math.random() * Object.keys(state.cards).length)];
        var group = state.cards[key];
        return group.cards[Math.floor(Math.random() * Object.keys(group.cards).length)];
    }
    updateState(state, cardData, correct) {
        if (correct) {
            state.cards[cardData.group].correct += 1;
        }
        else {
            state.cards[cardData.group].incorrect += 1;
        }
        return state;
    }
}
class ClozeBasicTemplate extends flashcard_template_1.FlashcardTemplate {
    generateCard(data) {
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
        aUpper.textContent = data.upper.replace(/(\{\{[^\{\}]+\}\})/, (match, p1) => {
            targetWords.push(p1);
            return "___";
        });
        var answer = targetWords.join(", ");
        aLower.textContent = data.lower;
        var fontSize = 100.0 / (10.0 * Math.log(10 + aUpper.textContent.length));
        aUpper.style.fontSize = `${fontSize}vw`;
        aLower.style.fontSize = `${0.7 * fontSize}vw`;
        var fl = new flashcard_1.Flashcard(el, (attempt) => answer == attempt, answer);
        return fl;
    }
}
var clozeDefaultState = {
    cards: {
        "gehen": {
            key: "gehen",
            cards: [
                {
                    group: "gehen",
                    guid: (0, utils_1.guidGenerator)(),
                    upper: "Ich {{gehe}} ins Kino.",
                    lower: "I go to the movies."
                },
                {
                    group: "gehen",
                    guid: (0, utils_1.guidGenerator)(),
                    upper: "Wohin {{gehst}} du?",
                    lower: "Where are you going?"
                }
            ],
            correct: 0,
            incorrect: 0
        },
        "haben": {
            key: "haben",
            cards: [
                {
                    group: "haben",
                    guid: (0, utils_1.guidGenerator)(),
                    upper: "Ich {{habe}} einen Hund.",
                    lower: "I have a dog."
                },
                {
                    group: "haben",
                    guid: (0, utils_1.guidGenerator)(),
                    upper: "{{Hast}} du einen Hund?",
                    lower: "Do you have a dog?"
                }
            ],
            correct: 0,
            incorrect: 0
        }
    }
};
(0, flashcard_deck_1.registerDeckType)(new ClozeFlashcardGen(), new ClozeBasicTemplate(), () => null, "cloze-quizzer", "Simple German cloze quizzer", clozeDefaultState);
