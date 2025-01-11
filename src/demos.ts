import {
    uniformRandomFGen,
    FlashcardGenerator,
    FlashcardGenEditor,
    defaultDecks,
    providedGenerators,
    defaultDeckView,
    guidGenerator
} from "./lib"

// Demo key-value quizzer
var keyValueQuizzer = uniformRandomFGen([
    ["acyclic saturated hydrocarbon", "alkane"],
    ["hydrocarbon with a carbon-carbon double bond", "alkene"],
    ["unsaturated hydrocarbon with a carbon-carbon triple bond", "alkyne"],
    ["organic compound with at least one hydroxyl group", "alcohol"],
    ["organic compound with an oxygen bound to two separate carbons", "ether"],
    ["organic compound with an R-C-OH functional group", "aldehyde"]
]);

// Demo addition arithmetic quizzer
var additionQuizzer: FlashcardGenerator<[number, number], number> = {
    ftemp: {
        generator: function(seed: [number, number]) {
            return {
                params: seed,
                prompt: `${seed[0]} + ${seed[1]}`,
                answers: [`${seed[0] + seed[1]}`],
                hint: `${seed[0] + seed[1]}`,
                uuid: guidGenerator()
            }
        }
    },
    state: 10,
    seeder: function(m: number) {
        var g = () => Math.floor(Math.random() * m);
        return [g(), g()];
    },
    updater: (correct, answer, card, st) => st,
    history: [],
    editor: (m: number) => {
        var editor = {
            element: document.createElement("div"),
            menuToState: () => +(<HTMLInputElement>editor.element.children[0]).value
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
}

defaultDecks["addition-quiz-deck"] = {
        name: "Addition quizzer",
        slug: "addition-quiz-deck",
        decktype: "addition-quizzer",
        resources: [],
        view: {
            color: "#ffeeee"
        },
        state: 20
};
defaultDecks["key-value-quiz-deck"] = {
        name: "Simple key-value quiz deck",
        slug: "key-value-quiz-deck",
        decktype: "key-value-quizzer",
        resources: [],
        view: defaultDeckView,
        state: keyValueQuizzer.state
};

providedGenerators["addition-quizzer"] = additionQuizzer;
providedGenerators["key-value-quizzer"] = keyValueQuizzer;
