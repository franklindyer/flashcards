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
    maxnum: number,
    scoreHist: number[]
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
            geomParam: 0.99,
            alpha: 0.95,
            maxnum: maxnum,
            scoreHist: []
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
            st.scoreHist.push(Math.floor(-1/Math.log(st.geomParam)));
            return st;
        },
        history: [],
        editor: (st: GeometricProgressState): FlashcardGenEditor<GeometricProgressState> => {
            var contDiv = document.createElement("div");
            var score = Math.floor(-1/Math.log(st.geomParam));
            contDiv.innerHTML = `<a>Current score: ${score}</a>`;
            var alphaEditor = floatEditor("Tuning parameter", Math.pow(st.alpha, 10), 0, 1);
            contDiv.appendChild(alphaEditor.element);
            
            var nearbyWordsHdr = document.createElement("h3");
            nearbyWordsHdr.textContent = "Words that are near your score level";
            var wordsMin = Math.max(0, score-5);
            var wordsMax = Math.min(st.maxnum, score+5);
            var nearbyWords = [...Array(wordsMax-wordsMin).keys()].map((x) => getter(x+wordsMin));
            contDiv.appendChild(nearbyWordsHdr);
            for (var i in nearbyWords) {
                var wd = nearbyWords[i];
                var ind = wordsMin + parseInt(i);
                var wdDiv = document.createElement("div");
                wdDiv.classList.add("upcoming-word-preview-box");
                wdDiv.textContent = `${ind}) ${wd[1]}`;
                contDiv.appendChild(wdDiv);
            }

            return {
                element: contDiv,
                menuToState: () => { return {
                    geomParam: st.geomParam,
                    alpha: Math.pow(alphaEditor.menuToState(), 0.1),
                    maxnum: st.maxnum,
                    scoreHist: st.scoreHist
                }}
            }
        }
    };
}
