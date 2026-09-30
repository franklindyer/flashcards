"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KVFlashcardGen = void 0;
const flashcard_generator_1 = require("core/flashcard-generator");
const flashcard_sync_generator_1 = require("core/flashcard-sync-generator");
const flashcard_deck_1 = require("core/flashcard-deck");
const flashcard_template_1 = require("core/flashcard-template");
const nunjucks_1 = require("nunjucks");
class KVFlashcardGen extends flashcard_sync_generator_1.FlashcardSyncGen {
    getGenName() { return "uniform-key-value"; }
    getNextCard(state) {
        var dat = state.deck[Math.floor(Math.random() * Object.keys(state.deck).length)];
        return dat;
    }
    updateState(state, cardData, correct) {
        if (correct != flashcard_generator_1.FlashcardResult.Unanswered) {
            state.history.push([cardData.front, correct == flashcard_generator_1.FlashcardResult.Correct]);
        }
        return state;
    }
    checkAnswer(ans, state, cardData) {
        return (ans == cardData.back);
    }
    generateCard(_, data) {
        return (0, flashcard_template_1.renderCard)("basic-template", [data.front, data.back]);
    }
    makeEditor(st) {
        var contDiv = document.createElement("div");
        var menuTpl = `
            <menu-group>
                <menu-list name="deck">
                    <button class="add-another-button">Add another</button>
                    <input class="search-bar" placeholder="search..."></input>
                    <div class="list-entry-container"></div>
                    <menu-group style="display: block;" class="list-default-entry">
                        <menu-textbox name="front" style="display: inline-block;"></menu-textbox>
                        <menu-textbox name="back" style="display: inline-block;"></menu-textbox>
                        <button class="list-entry-remove-button">remove</button>
                        <button class="list-entry-restore-button">restore</button>
                    </menu-group>
                </menu-list>
            </menu-group>
        `;
        var menuHTML = (0, nunjucks_1.renderString)(menuTpl, { st: st });
        contDiv.innerHTML = menuHTML;
        var menu = contDiv.children[0];
        menu.setState(st);
        return menu;
    }
    correctEffect(_, __, ___, resolve) { resolve(); }
    reportableData(state, cardData, attempt, correct) { return {}; }
    repairDeckState(st) { return st; }
}
exports.KVFlashcardGen = KVFlashcardGen;
var kvDefaultState = {
    deck: [
        { front: "cat", back: "gato" },
        { front: "dog", back: "perro" },
        { front: "the dog runs", back: "el perro corre" }
    ],
    history: []
};
(0, flashcard_deck_1.registerDeckType)(new KVFlashcardGen(), "key-value-quizzer", "Simple key-value quizzer", kvDefaultState);
