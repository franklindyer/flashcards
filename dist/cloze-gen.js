"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const flashcard_1 = require("./flashcard");
const flashcard_generator_1 = require("./flashcard-generator");
const editor_1 = require("./editor");
const flashcard_deck_1 = require("./flashcard-deck");
class ClozeFlashcardGen extends flashcard_generator_1.FlashcardGen {
    getGenName() { return "cloze-puzzles"; }
    getNextCard(state) {
        var key = Object.keys(state.cards)[Math.floor(Math.random() * Object.keys(state.cards).length)];
        var group = state.cards[key];
        return group.cards[Math.floor(Math.random() * Object.keys(group.cards).length)];
    }
    updateState(state, cardData, result) {
        if (result == flashcard_generator_1.FlashcardResult.Correct) {
            state.cards[cardData.group].correct += 1;
        }
        else if (result == flashcard_generator_1.FlashcardResult.Incorrect) {
            state.cards[cardData.group].incorrect += 1;
        }
        else {
            state.cards[cardData.group].skipped += 1;
        }
        return state;
    }
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
        aUpper.textContent = data.upper.replace(/\{\{([^\{\}]+)\}\}/, (match, p1) => {
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
function makeClozeEditor(state) {
    var container = document.createElement("div");
    var loadCards = (s) => {
        if (s.length > 0) {
            var newCardDict = {};
            var infoList = JSON.parse(s);
            console.log(infoList);
            for (var i in Object.keys(infoList)) {
                var k = Object.keys(infoList)[i];
                newCardDict[k] = {
                    key: k,
                    cards: infoList[k].map((c) => {
                        return {
                            upper: c["prompt"],
                            lower: c["translation"],
                            guid: (0, utils_1.guidGenerator)(),
                            group: k
                        };
                    }),
                    correct: Object.keys(state.cards).includes(k) ? state.cards[k].correct : 0,
                    incorrect: Object.keys(state.cards).includes(k) ? state.cards[k].incorrect : 0,
                    skipped: Object.keys(state.cards).includes(k) ? state.cards[k].skipped : 0
                };
            }
            state.cards = newCardDict;
        }
    };
    var deckSummary = document.createElement("div");
    var makeDeckSummary = () => {
        deckSummary.innerHTML = "";
        var keys = Object.keys(state.cards).sort();
        for (var i in keys) {
            var k = keys[i];
            var entryDiv = document.createElement("div");
            entryDiv.classList.add("deck-editor-info-entry");
            var entryKey = document.createElement("span");
            entryKey.textContent = k;
            var entryInfo = document.createElement("span");
            entryInfo.textContent = `${state.cards[k].cards.length} puzzles`;
            entryInfo.style.float = "right";
            entryDiv.appendChild(entryKey);
            entryDiv.appendChild(entryInfo);
            deckSummary.appendChild(entryDiv);
        }
    };
    makeDeckSummary();
    var fileEd = (0, editor_1.fileUploadEditor)("Upload cloze puzzles", (s) => {
        loadCards(s);
        makeDeckSummary();
    });
    container.appendChild(fileEd.element);
    container.appendChild(deckSummary);
    return {
        element: container,
        menuToState: () => {
            var deckStr = fileEd.menuToState();
            if (deckStr.length > 0) {
                var newCardDict = {};
                var infoList = JSON.parse(deckStr);
                console.log(infoList);
                for (var i in Object.keys(infoList)) {
                    var k = Object.keys(infoList)[i];
                    newCardDict[k] = {
                        key: k,
                        cards: infoList[k].map((c) => {
                            return {
                                upper: c["prompt"],
                                lower: c["translation"],
                                guid: (0, utils_1.guidGenerator)(),
                                group: k
                            };
                        }),
                        correct: Object.keys(state.cards).includes(k) ? state.cards[k].correct : 0,
                        incorrect: Object.keys(state.cards).includes(k) ? state.cards[k].incorrect : 0,
                        skipped: Object.keys(state.cards).includes(k) ? state.cards[k].skipped : 0
                    };
                }
                state.cards = newCardDict;
            }
            return state;
        }
    };
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
            incorrect: 0,
            skipped: 0
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
            incorrect: 0,
            skipped: 0
        }
    }
};
(0, flashcard_deck_1.registerDeckType)(new ClozeFlashcardGen(), makeClozeEditor, "cloze-quizzer", "Simple German cloze quizzer", clozeDefaultState);
