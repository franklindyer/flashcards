"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lib_1 = require("./lib");
// Demo key-value quizzer
var keyValueQuizzer = (0, lib_1.uniformRandomFGen)([
    ["acyclic saturated hydrocarbon", "alkane"],
    ["hydrocarbon with a carbon-carbon double bond", "alkene"],
    ["unsaturated hydrocarbon with a carbon-carbon triple bond", "alkyne"],
    ["organic compound with at least one hydroxyl group", "alcohol"],
    ["organic compound with an oxygen bound to two separate carbons", "ether"],
    ["organic compound with an R-C-OH functional group", "aldehyde"]
]);
// Demo addition arithmetic quizzer
var additionQuizzer = {
    ftemp: {
        generator: function (seed) {
            return {
                params: seed,
                prompt: `${seed[0]} + ${seed[1]}`,
                answers: [`${seed[0] + seed[1]}`],
                hint: `${seed[0] + seed[1]}`,
                uuid: (0, lib_1.guidGenerator)()
            };
        }
    },
    state: 10,
    seeder: function (m) {
        var g = () => Math.floor(Math.random() * m);
        return [g(), g()];
    },
    updater: (correct, answer, card, st) => st,
    history: [],
    editor: (m) => {
        var editor = {
            element: document.createElement("div"),
            menuToState: () => +editor.element.children[0].value
        };
        var inputNum = document.createElement("input");
        editor.element.textContent = "Maximum value: ";
        inputNum.type = "number";
        inputNum.min = "1";
        inputNum.max = "1000";
        inputNum.value = m.toString();
        editor.element.appendChild(inputNum);
        return editor;
    }
};
lib_1.defaultDecks["addition-quiz-deck"] = {
    name: "Addition quizzer",
    slug: "addition-quiz-deck",
    decktype: "addition-quizzer",
    resources: [],
    view: {
        color: "#ffeeee"
    },
    state: 20
};
lib_1.defaultDecks["key-value-quiz-deck"] = {
    name: "Simple key-value quiz deck",
    slug: "key-value-quiz-deck",
    decktype: "key-value-quizzer",
    resources: [],
    view: lib_1.defaultDeckView,
    state: keyValueQuizzer.state
};
lib_1.providedGenerators["addition-quizzer"] = additionQuizzer;
lib_1.providedGenerators["key-value-quizzer"] = keyValueQuizzer;
