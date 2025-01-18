"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeEvilQuizzer = void 0;
const lib_1 = require("./lib");
const weighted_rand_1 = require("./weighted-rand");
function makeEvilCard(prompt, answer) {
    return {
        correct: 0,
        incorrect: 0,
        prompt: prompt,
        answers: [answer],
        tags: ["any"]
    };
}
function evilWeightFunction(c, st) {
    var k = st.initWeight;
    var p = st.punishParam;
    return (Math.pow(c.incorrect, p) + k) / (c.correct + k);
}
function makeEvilQuizzer(st) {
    var gen = {
        ftemp: {
            generator: function (seed, st) {
                return {
                    params: seed,
                    prompt: st.cards[seed].prompt,
                    answers: st.cards[seed].answers,
                    hint: st.cards[seed].answers[0],
                    uuid: (0, lib_1.guidGenerator)()
                };
            }
        },
        state: st,
        seeder: (st) => {
            var inds = [...Array(st.cards.length).keys()];
            var weights = inds.map((i) => evilWeightFunction(st.cards[i], st));
            return (0, weighted_rand_1.weightedRandom)(inds, (i) => weights[i], Math.random());
        },
        updater: (correct, answer, card, st) => {
            if (correct) {
                st.cards[card.params].correct += 1;
            }
            else {
                st.cards[card.params].incorrect += 1;
            }
            return st;
        },
        history: [],
        editor: (st) => {
            var contDiv = document.createElement("div");
            var initWeightEditor = (0, lib_1.scrollNumberEditor)("New card weight: ", st.initWeight, 1, 100, 1);
            var punishEditor = (0, lib_1.floatEditor)("'Punishment' exponent", st.punishParam, 1, 2);
            var maxWeight = Math.max.apply(null, st.cards.map((c) => evilWeightFunction(c, st)));
            function makeCardEditor(c) {
                var ed = (0, lib_1.fixedNumEditors)([c.prompt, c.answers.join('|')], lib_1.singleTextFieldEditor);
                var badness = Math.floor(255 * (1 - evilWeightFunction(c, st) / maxWeight));
                ed.element.style.backgroundColor = `rgb(255, ${badness}, ${badness})`;
                return {
                    element: ed.element,
                    menuToState: () => {
                        var newSt = ed.menuToState();
                        return {
                            correct: c.correct,
                            incorrect: c.incorrect,
                            prompt: newSt[0],
                            answers: newSt[1].split('|'),
                            tags: c.tags
                        };
                    }
                };
            }
            var cardsEditor = (0, lib_1.multipleEditors)(st.cards, makeEvilCard("", ""), makeCardEditor, true, (s, cd) => cd.prompt.includes(s) || cd.answers.some((a) => a.includes(s)));
            [initWeightEditor.element,
                punishEditor.element,
                cardsEditor.element].map((x) => contDiv.appendChild(x));
            return {
                element: contDiv,
                menuToState: () => {
                    return {
                        cards: cardsEditor.menuToState(),
                        initWeight: initWeightEditor.menuToState(),
                        punishParam: punishEditor.menuToState()
                    };
                }
            };
        }
    };
    return gen;
}
exports.makeEvilQuizzer = makeEvilQuizzer;
const sampleEvilQuizState = {
    cards: [
        makeEvilCard("bat", "morcego"),
        makeEvilCard("horse", "cavalo"),
        makeEvilCard("hen", "galinha"),
        makeEvilCard("goat", "cabra"),
        makeEvilCard("cow", "vaca"),
        makeEvilCard("sheep", "ovelha"),
        makeEvilCard("pig", "porco"),
        makeEvilCard("seagull", "gaivota"),
        makeEvilCard("fish", "peixe"),
        makeEvilCard("rabbit", "coelho")
    ],
    initWeight: 5,
    punishParam: 1.5
};
lib_1.defaultDecks["evil-quiz-deck"] = {
    name: "Evil flashcard quizzer",
    slug: "evil-quiz-deck",
    decktype: "evil-driller",
    resources: [],
    view: lib_1.defaultDeckView,
    state: sampleEvilQuizState
};
lib_1.providedGenerators["evil-driller"] = makeEvilQuizzer(sampleEvilQuizState);
