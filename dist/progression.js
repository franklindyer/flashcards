"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.geometricProgressFGen = void 0;
const lib_1 = require("./lib");
const lambert_w_function_1 = require("lambert-w-function");
function geometricProgressFGen(getter, maxnum) {
    return {
        ftemp: {
            generator: function (seed, st) {
                let record = getter(seed);
                return {
                    params: seed,
                    prompt: record[0],
                    answers: [record[1]],
                    hint: record[1],
                    info: record[2],
                    uuid: (0, lib_1.guidGenerator)()
                };
            }
        },
        state: {
            geomParam: 0.95,
            alpha: 0.95,
            maxnum: maxnum
        },
        seeder: function (st) {
            var u = Math.random();
            // var geom = Math.floor(Math.log(u)/Math.log(st.geomParam));
            var p = st.geomParam;
            var logp = Math.log(p);
            var geom = Math.floor((logp / (1 - p) + (0, lambert_w_function_1.lambertW0)(u * (1 - 1 / p) * Math.exp(logp / (1 - p)) / logp)) / logp);
            if (geom > maxnum) {
                geom = Math.floor(Math.random() * maxnum);
            }
            return geom;
        },
        updater: (correct, answer, card, st) => {
            if (correct) {
                st.geomParam = (1 - st.alpha) + st.alpha * st.geomParam;
            }
            else {
                st.geomParam = (st.geomParam - (1 - st.alpha)) / st.alpha;
                if (st.geomParam < 0)
                    st.geomParam = 0.5;
            }
            return st;
        },
        history: [],
        editor: (st) => {
            var contDiv = document.createElement("div");
            var score = Math.floor(-1 / Math.log(st.geomParam));
            contDiv.innerHTML = `<a>Current score: ${score}</a>`;
            var alphaEditor = (0, lib_1.floatEditor)("Tuning parameter", Math.pow(st.alpha, 10), 0, 1);
            contDiv.appendChild(alphaEditor.element);
            var nearbyWordsHdr = document.createElement("h3");
            nearbyWordsHdr.textContent = "Words that are near your score level";
            var wordsMin = Math.max(0, score - 5);
            var wordsMax = Math.min(st.maxnum, score + 5);
            var nearbyWords = [...Array(wordsMax - wordsMin).keys()].map((x) => getter(x + wordsMin));
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
                menuToState: () => {
                    return {
                        geomParam: st.geomParam,
                        alpha: Math.pow(alphaEditor.menuToState(), 0.1),
                        maxnum: st.maxnum
                    };
                }
            };
        }
    };
}
exports.geometricProgressFGen = geometricProgressFGen;
