import {
    Flashcard,
    FlashcardGenerator,
    FlashcardGenEditor,
    guidGenerator,
    singleTextFieldEditor,
    scrollNumberEditor,
    floatEditor,
    fixedNumEditors,
    multipleEditors,
    defaultDecks,
    defaultDeckView,
    providedGenerators
} from './lib';
import { weightedRandom, weightedRandomEdge } from './weighted-rand';

export type EvilFlashcard = {
    correct: number,
    incorrect: number,
    prompt: string,
    answers: string[],
    tags: string[]
}

export type EvilQuizzerState = {
    cards: EvilFlashcard[],
    initWeight: number,
    punishParam: number
}

function makeEvilCard(prompt: string, answer: string): EvilFlashcard {
    return {
        correct: 0,
        incorrect: 0,
        prompt: prompt,
        answers: [answer],
        tags: ["any"]
    };
}

function evilWeightFunction(c: EvilFlashcard, st: EvilQuizzerState): number {
    var k = st.initWeight;
    var p = st.punishParam;
    return (Math.pow(c.incorrect,p)+k)/(c.correct+k);
}

export function makeEvilQuizzer(st: EvilQuizzerState):
    FlashcardGenerator<number, EvilQuizzerState> {
    var gen = {
        ftemp: {
            generator: function(seed: number, st: EvilQuizzerState) {
                return {
                    params: seed,
                    prompt: st.cards[seed].prompt,
                    answers: st.cards[seed].answers,
                    hint: st.cards[seed].answers[0],
                    uuid: guidGenerator()
                }
            }
        },
        state: st, 
        seeder: (st: EvilQuizzerState) => {
            var inds = [...Array(st.cards.length).keys()];
            var weights = inds.map((i) => evilWeightFunction(st.cards[i], st)); 
            return weightedRandom(inds, (i) => weights[i], Math.random());
        },
        updater: (correct: boolean, answer: string, card: Flashcard<number>, st: EvilQuizzerState) => {
            if (correct) {
                st.cards[card.params].correct += 1;
            } else {
                st.cards[card.params].incorrect += 1;
            }
            return st;
        },
        history: [],
        editor: (st: EvilQuizzerState): FlashcardGenEditor<EvilQuizzerState> => {
            var contDiv = document.createElement("div");
            var initWeightEditor = scrollNumberEditor("New card weight: ", st.initWeight, 1, 100, 1);
            var punishEditor = floatEditor("'Punishment' exponent", st.punishParam, 1, 2);
            var maxWeight = Math.max.apply(null, st.cards.map((c) => evilWeightFunction(c, st)));
            function makeCardEditor(c: EvilFlashcard): FlashcardGenEditor<EvilFlashcard> {
                var ed = fixedNumEditors([c.prompt, c.answers.join('|')], singleTextFieldEditor);
                var badness = Math.floor(255*(1-evilWeightFunction(c, st)/maxWeight));
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
                        }
                    }
                };
            }
            var cardsEditor = multipleEditors(
                st.cards,
                makeEvilCard("", ""),
                makeCardEditor,
                true,
                (s, cd) => cd.prompt.includes(s) || cd.answers.some((a: string) => a.includes(s))
            );
            [initWeightEditor.element,
                punishEditor.element,
                cardsEditor.element].map((x) => contDiv.appendChild(x));
            return {
                element: contDiv,
                menuToState: () => { return {
                    cards: cardsEditor.menuToState(),
                    initWeight: initWeightEditor.menuToState(),
                    punishParam: punishEditor.menuToState()
                }}
            }
        }
    }
    return gen;
}

const sampleEvilQuizState: EvilQuizzerState = {
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
}

defaultDecks["evil-quiz-deck"] = {
    name: "Evil flashcard quizzer",
    slug: "evil-quiz-deck",
    decktype: "evil-driller",
    resources: [],
    view: defaultDeckView,
    state: sampleEvilQuizState
}
providedGenerators["evil-driller"] = makeEvilQuizzer(sampleEvilQuizState);
