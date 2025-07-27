"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimesTableGen = exports.defaultTimesTableState = void 0;
const flashcard_generator_1 = require("./flashcard-generator");
const flashcard_sync_generator_1 = require("./flashcard-sync-generator");
const flashcard_template_1 = require("./flashcard-template");
const editor_1 = require("./editor");
const flashcard_deck_1 = require("./flashcard-deck");
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
}
exports.TimesTableGen = TimesTableGen;
function makeTimesTableEditor(st) {
    var minEd = (0, editor_1.scrollNumberEditor)("Minimum factor:", st.minNum, 0, 100, 1);
    var maxEd = (0, editor_1.scrollNumberEditor)("Maximum factor:", st.maxNum, 0, 100, 1);
    var wrongDiv = document.createElement("div");
    wrongDiv.style.backgroundColor = "#ffdddd";
    wrongDiv.classList.add("deck-menu-submenu");
    var wrongList = document.createElement("ul");
    var wrongHdr = document.createElement("b");
    wrongHdr.textContent = "You have not gotten any cards wrong yet.";
    for (var i in Object.keys(st.recentlyIncorrect)) {
        var fct = st.recentlyIncorrect[i];
        var li = document.createElement("li");
        li.textContent = `${fct[0]} × ${fct[1]} = ${fct[0] * fct[1]}`;
        wrongList.appendChild(li);
        wrongHdr.textContent = "You have gotten the following cards wrong:";
    }
    wrongDiv.appendChild(wrongHdr);
    wrongDiv.appendChild(wrongList);
    var edDiv = document.createElement("div");
    edDiv.appendChild(minEd.element);
    edDiv.appendChild(maxEd.element);
    edDiv.appendChild(wrongDiv);
    return {
        element: edDiv,
        menuToState: () => {
            return {
                minNum: minEd.menuToState(),
                maxNum: maxEd.menuToState(),
                recentlyIncorrect: st.recentlyIncorrect
            };
        }
    };
}
(0, flashcard_deck_1.registerDeckType)(new TimesTableGen(), makeTimesTableEditor, "times-table-quizzer", "Times table quizzer", exports.defaultTimesTableState, "#ffcccc");
