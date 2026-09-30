"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimesTableGen = exports.defaultTimesTableState = void 0;
const flashcard_generator_1 = require("core/flashcard-generator");
const flashcard_sync_generator_1 = require("core/flashcard-sync-generator");
const flashcard_template_1 = require("core/flashcard-template");
const nunjucks_1 = require("nunjucks");
const flashcard_deck_1 = require("core/flashcard-deck");
// The state of the deck when the user is using it for the first time
exports.defaultTimesTableState = {
    minNum: 1,
    maxNum: 12,
    recentlyIncorrect: []
};
class TimesTableGen extends flashcard_sync_generator_1.FlashcardSyncGen {
    getGenName() {
        return "times-table-generator";
    }
    repairDeckState(st) {
        return st;
    }
    correctEffect(st, c, attempt, resolve) {
        resolve();
    }
    reportableData(st, c, attempt, res) {
        return {};
    }
    getNextCard(st) {
        var factor1 = Math.floor(Math.random() * (st.maxNum - st.minNum + 1)) + st.minNum;
        var factor2 = Math.floor(Math.random() * (st.maxNum - st.minNum + 1)) + st.minNum;
        return { factor1: factor1, factor2: factor2 };
    }
    updateState(st, c, res) {
        // Keep track of the last 10 multiplication facts to be incorrectly answered
        if (res === flashcard_generator_1.FlashcardResult.Incorrect) {
            st.recentlyIncorrect.unshift([c.factor1, c.factor2]);
            st.recentlyIncorrect = st.recentlyIncorrect.slice(0, 10);
        }
        return st;
    }
    generateCard(st, c) {
        var cardData = [`${c.factor1} × ${c.factor2}`, (c.factor1 * c.factor2).toString()];
        return (0, flashcard_template_1.renderCard)("basic-template", cardData);
    }
    checkAnswer(answer, st, c) {
        return (answer === (c.factor1 * c.factor2).toString());
    }
    makeEditor(st) {
        var contDiv = document.createElement("div");
        var menuTpl = `
            <menu-group>
                <div>
                    <menu-number id="min-num-input" name="minNum" step=1></menu-number>
                    <label for="min-num-input">Minimum factor value</label>
                </div>
                <div>
                    <menu-number id="max-num-input" name="maxNum" step=1></menu-number>
                    <label for="max-num-input">Maximum factor value</label>
                </div>
                <h3>Questions recently answered incorrectly:</h3>
                <ul>
                    {% for r in st.recentlyIncorrect %}
                    <ul>{{ r[0] }} × {{ r[1] }} = {{ r[0]*r[1] }}</ul>
                    {% endfor %}
                </ul>            
            </menu-group>
        `;
        var menuHTML = (0, nunjucks_1.renderString)(menuTpl, { st: st });
        contDiv.innerHTML = menuHTML;
        var menu = contDiv.children[0];
        menu.setState(st);
        return menu;
    }
}
exports.TimesTableGen = TimesTableGen;
(0, flashcard_deck_1.registerDeckType)(new TimesTableGen(), "times-table-quizzer", "Times table quizzer", exports.defaultTimesTableState, "#ffcccc");
