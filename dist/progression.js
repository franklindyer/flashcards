"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.geometricProgressFGen = void 0;
const lib_1 = require("./lib");
// Argument must be between -1/e and 0
function lambertW1(y) {
    var tol = 0.0001;
    var f = (x) => Math.log(y / x);
    var x = Math.log(-y);
    while (Math.abs(x - f(x)) > tol) {
        console.log("ITERATING");
        x = f(x);
    }
    return x;
}
function findNaturalMaxUnimodal(f) {
    var lower_bound = 0;
    var upper_bound = 0;
    while (f(upper_bound) < f(upper_bound + 1)) {
        upper_bound = 2 * upper_bound + 1;
    }
    while ((upper_bound - lower_bound) > 1) {
        var probe = Math.floor((upper_bound + lower_bound) / 2);
        if (f(probe) < f(probe + 1)) {
            lower_bound = probe + 1;
        }
        else {
            upper_bound = probe;
        }
    }
    return lower_bound;
}
function zipfLogLikelihood(knownWords, unknownWords, N, alpha) {
    return (khat) => {
        var cumLL = 0;
        for (var i in knownWords) {
            var n = knownWords[i];
            cumLL = cumLL + Math.log(1 - (1 - alpha * (Math.log(n + 1) - Math.log(n)) / Math.log(N)) ^ khat);
        }
        for (var i in unknownWords) {
            var n = unknownWords[i];
            cumLL = cumLL + khat * Math.log(1 - alpha * (Math.log(n + 1) - Math.log(n)) / Math.log(N));
        }
        return cumLL;
    };
}
function expectedWordsSeen(N, K, alpha) {
    var cumsum = 0;
    var n = 1;
    while (n <= N) {
        var d = 1 - Math.pow((1 - alpha * (Math.log(n + 1) - Math.log(n)) / Math.log(N + 1)), K);
        cumsum += d;
        n++;
    }
    return Math.floor(cumsum);
}
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
            alpha: 0.1,
            maxnum: maxnum,
            score: 2,
            memory: 30,
            recentCorrect: [],
            recentIncorrect: []
        },
        seeder: function (st) {
            var u = Math.random();
            var p = 1 - 2 / (st.score + 1);
            var logp = Math.log(p);
            var geom = 0;
            var genGeom = true;
            while (genGeom) {
                //                var geom = Math.floor((logp/(1-p) + lambertW0(u * (1-1/p) * Math.exp(logp/(1-p)) / logp))/logp);
                var logpq = logp / (1 - p);
                var geom = Math.floor((lambertW1((1 - u) * logpq * Math.exp(logpq)) - logpq) / logp);
                genGeom = false;
                // genGeom = st.recentCorrect.includes(geom) || st.recentIncorrect.includes(geom);
            }
            if (geom > maxnum) {
                geom = Math.floor(Math.random() * maxnum);
            }
            console.log(geom);
            return geom;
        },
        updater: (correct, answer, card, st) => {
            if (correct) {
                st.recentCorrect.unshift(card.params);
                if (st.recentCorrect.length > st.memory)
                    st.recentCorrect = st.recentCorrect.slice(0, st.memory);
                st.recentCorrect = [...new Set(st.recentCorrect)];
                st.recentIncorrect = st.recentIncorrect.filter((i) => i != card.params);
            }
            else {
                st.recentIncorrect.unshift(card.params);
                if (st.recentIncorrect.length > st.memory)
                    st.recentIncorrect = st.recentIncorrect.slice(0, st.memory);
                st.recentIncorrect = [...new Set(st.recentIncorrect)];
                st.recentCorrect = st.recentCorrect.filter((i) => i != card.params);
            }
            if (st.recentCorrect.length == 0)
                st.score = 2;
            else if (st.recentIncorrect.length == 0)
                st.score = 2 * Math.max(...st.recentCorrect) + 1;
            else {
                var llFxn = zipfLogLikelihood(st.recentCorrect, st.recentIncorrect, st.maxnum, st.alpha);
                var mle = findNaturalMaxUnimodal(llFxn);
                st.score = expectedWordsSeen(st.maxnum, mle, st.alpha);
                // st.score = findNaturalMaxUnimodal(llFxn);
                console.log(`MLE: ${mle}`);
                console.log(`score: ${st.score}`);
            }
            st.score = Math.min(st.score, st.maxnum - 1);
            return st;
        },
        history: [],
        editor: (st) => {
            var contDiv = document.createElement("div");
            contDiv.innerHTML = `<a>Current score: ${st.score}</a>`;
            var nearbyWordsHdr = document.createElement("h3");
            nearbyWordsHdr.textContent = "Words that are near your score level";
            var wordsMin = Math.max(5, Math.floor(st.score)) - 5;
            var wordsMax = Math.min(st.maxnum - 1, Math.floor(st.score + 5));
            var nearbyWords = [...Array(wordsMax - wordsMin - 1).keys()].map((x) => getter(x + wordsMin));
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
                        alpha: st.alpha,
                        score: st.score,
                        maxnum: st.maxnum,
                        memory: st.memory,
                        recentCorrect: st.recentCorrect,
                        recentIncorrect: st.recentIncorrect
                    };
                }
            };
        }
    };
}
exports.geometricProgressFGen = geometricProgressFGen;
