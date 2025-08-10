"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.infoWidgetSR = infoWidgetSR;
exports.studyingEditorSR = studyingEditorSR;
const spaced_repetition_general_1 = require("decks/spaced-repetition-general");
const editor_1 = require("core/editor");
function infoWidgetSR(st) {
    var contDiv = document.createElement("div");
    contDiv.classList.add("deck-menu-submenu");
    var totP = document.createElement("p");
    totP.textContent = `Total cards: ${Object.keys(st.cards).length}`;
    totP.style.color = "#666666";
    totP.style.fontWeight = "bold";
    var newP = document.createElement("p");
    newP.textContent = `New cards: ${Object.keys(st.cards).filter((i) => st.cards[i].intervalMinutes == 0).length}`;
    newP.style.color = "#9999ee";
    newP.style.fontWeight = "bold";
    var dueP = document.createElement("p");
    dueP.textContent = `Due cards: ${Object.keys(st.cards).filter((i) => st.cards[i].intervalMinutes > 0
        && new Date(st.cards[i].due) < new Date()).length}`;
    dueP.style.color = "#ee9999";
    dueP.style.fontWeight = "bold";
    [totP, newP, dueP].map((el) => contDiv.appendChild(el));
    return contDiv;
}
function studyingEditorSR(st) {
    var studyingEditor = (0, editor_1.radioEditor)(st.studying, [spaced_repetition_general_1.SpacedRepStudying.NewCards, spaced_repetition_general_1.SpacedRepStudying.DueCards, spaced_repetition_general_1.SpacedRepStudying.RandomCards], ["Study new cards", "Study due cards", "Practice random cards"]);
    return studyingEditor;
}
