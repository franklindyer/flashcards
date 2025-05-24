"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const flashcard_generator_1 = require("./flashcard-generator");
const flashcard_template_1 = require("./flashcard-template");
const editor_1 = require("./editor");
const flashcard_deck_1 = require("./flashcard-deck");
class ClozeFlashcardGen extends flashcard_generator_1.FlashcardGen {
    getGenName() { return "cloze-puzzles"; }
    getNextCard(state) {
        var cardIsOk = (c) => !(state.settings.blacklist.includes(c.guid));
        var validKeys = Object.keys(state.cards).filter((k) => state.cards[k].cards.some(cardIsOk));
        var key = validKeys[Math.floor(Math.random() * validKeys.length)];
        var group = state.cards[key].cards.filter(cardIsOk);
        return group[Math.floor(Math.random() * group.length)];
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
            if (state.settings.blacklistSkipped) {
                state.settings.blacklist.push(cardData.guid);
            }
        }
        return state;
    }
    checkAnswer(ans, st, cardData) {
        var targetWords = [];
        cardData.upper.replaceAll(/\{\{([^\{\}]+)\}\}/g, (match, p1) => {
            targetWords.push(p1);
            return match;
        });
        var correctAns = targetWords.join(", ");
        return (ans == correctAns);
    }
    generateCard(data) {
        return (0, flashcard_template_1.renderCard)("cloze-template", data);
    }
    correctEffect(_, __, ___, resolve) { resolve(); }
    repairDeckState(st) { return st; }
}
function makeClozeCard(group, top, bottom) {
    return {
        group: group,
        guid: (0, utils_1.getUuid)(`${top} | ${bottom}`, 5),
        upper: top,
        lower: bottom
    };
}
function makeClozeEditor(state) {
    var container = document.createElement("div");
    var blacklistEditor = (0, editor_1.boolEditor)("Permanently remove skipped cards?", state.settings.blacklistSkipped);
    blacklistEditor.element.classList.add("deck-menu-submenu");
    var summaryContainer = document.createElement("div");
    summaryContainer.classList.add("deck-menu-submenu");
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
    summaryContainer.appendChild(fileEd.element);
    summaryContainer.appendChild(deckSummary);
    container.appendChild(blacklistEditor.element);
    container.appendChild(summaryContainer);
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
                        cards: infoList[k].map((c) => makeClozeCard(k, c["prompt"], c["translation"])),
                        correct: Object.keys(state.cards).includes(k) ? state.cards[k].correct : 0,
                        incorrect: Object.keys(state.cards).includes(k) ? state.cards[k].incorrect : 0,
                        skipped: Object.keys(state.cards).includes(k) ? state.cards[k].skipped : 0
                    };
                }
                state.cards = newCardDict;
            }
            state.settings.blacklistSkipped = blacklistEditor.menuToState();
            return state;
        }
    };
}
var clozeDefaultState = {
    cards: {
        "gehen": {
            key: "gehen",
            cards: [
                makeClozeCard("gehen", "Ich {{gehe}} ins Kino.", "I go to the movies."),
                makeClozeCard("gehen", "Wohin {{gehst}} du?", "Where are you going?")
            ],
            correct: 0,
            incorrect: 0,
            skipped: 0
        },
        "haben": {
            key: "haben",
            cards: [
                makeClozeCard("haben", "Ich {{habe}} einen Hund.", "I have a dog."),
                makeClozeCard("haben", "{{Hast}} du einen Hund?", "Do you have a dog?")
            ],
            correct: 0,
            incorrect: 0,
            skipped: 0
        }
    },
    settings: {
        blacklist: [],
        blacklistSkipped: true
    }
};
(0, flashcard_deck_1.registerDeckType)(new ClozeFlashcardGen(), makeClozeEditor, "cloze-quizzer", "Simple German cloze quizzer", clozeDefaultState, "#ffddbb");
