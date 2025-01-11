import {
    guidGenerator,
    Flashcard,
    FlashcardGenerator,
    FlashcardGenEditor,
    floatEditor,
    defaultDecks,
    providedGenerators,
    indexedResources
} from "./lib";
import { lambertW0 } from "lambert-w-function";

// Update function is p <- alpha * p when incorrect, p <- (1-alpha) + alpha * p
export type GeometricProgressState = {
    geomParam: number,
    alpha: number,
    maxnum: number
}

export function geometricProgressFGen(getter: (n: number) => [string, string, string], maxnum: number):
    FlashcardGenerator<number, GeometricProgressState> {
    return {
        ftemp: {
            generator: function(seed: number, st: GeometricProgressState) {
                let record = getter(seed);
                return {
                    params: seed,
                    prompt: record[0],
                    answers: [record[1]],
                    hint: record[1],
                    info: record[2],
                    uuid: guidGenerator()
                }
            }
        },
        state: {
            geomParam: 0.95,
            alpha: 0.95,
            maxnum: maxnum
        },
        seeder: function(st: GeometricProgressState) {
            var u = Math.random();
            // var geom = Math.floor(Math.log(u)/Math.log(st.geomParam));
            var p = st.geomParam;
            var logp = Math.log(p);
            var geom = Math.floor((logp/(1-p) + lambertW0(u * (1-1/p) * Math.exp(logp/(1-p)) / logp))/logp);
            if (geom > maxnum) {
                geom = Math.floor(Math.random() * maxnum);
            }
            return geom;
        },
        updater: (correct: boolean, answer: string, card: Flashcard<number>, st: GeometricProgressState): GeometricProgressState => {
            if (correct) {
                st.geomParam = (1-st.alpha) + st.alpha*st.geomParam;
            } else {
                st.geomParam = (st.geomParam - (1-st.alpha))/st.alpha;
                if (st.geomParam < 0)
                    st.geomParam = 0.5;
            }
            return st;
        },
        history: [],
        editor: (st: GeometricProgressState): FlashcardGenEditor<GeometricProgressState> => {
            var contDiv = document.createElement("div");
            var score = Math.floor(-1/Math.log(st.geomParam));
            contDiv.innerHTML = `<a>Current score: ${score}</a>`;
            var alphaEditor = floatEditor("Tuning parameter: ", Math.pow(st.alpha, 10), 0, 1);
            contDiv.appendChild(alphaEditor.element);
            return {
                element: contDiv,
                menuToState: () => { return {
                    geomParam: st.geomParam,
                    alpha: Math.pow(alphaEditor.menuToState(), 0.1),
                    maxnum: st.maxnum
                }}
            }
        }
    };
}
