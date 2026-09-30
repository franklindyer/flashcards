"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FreqProgGen = exports.defaultFreqProgState = void 0;
const flashcard_1 = require("core/flashcard");
const flashcard_generator_1 = require("core/flashcard-generator");
const flashcard_sync_generator_1 = require("core/flashcard-sync-generator");
const nunjucks_1 = require("nunjucks");
const nj_templates_1 = require("utils/nj-templates");
const sample_russian_freqlist_1 = require("utils/sample-russian-freqlist");
const flashcard_deck_1 = require("core/flashcard-deck");
// Argument must be between -1/e and 0
function lambertW1(y) {
    var tol = 0.0001;
    var f = (x) => Math.log(y / x);
    var x = Math.log(-y);
    while (Math.abs(x - f(x)) > tol) {
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
// The state of the deck when the user is using it for the first time
exports.defaultFreqProgState = {
    cardList: sample_russian_freqlist_1.RUSSIAN_FREQLIST.split("\n").map((ln) => {
        var r = ln.split("\t");
        return {
            prompt: r[1],
            answer: r[0],
            extraInfo: r[2]
        };
    }),
    recentCorrect: [],
    recentIncorrect: [],
    memory: 50,
    alpha: 0.1,
    score: 2,
    cardTemplate: nj_templates_1.njFreqProgCard
};
console.log(exports.defaultFreqProgState);
class FreqProgGen extends flashcard_sync_generator_1.FlashcardSyncGen {
    getGenName() {
        return "frequency-progression-generator";
    }
    repairDeckState(st) {
        return st;
    }
    correctEffect(st, j, attempt, resolve) {
        resolve();
    }
    reportableData(st, j, attempt, res) {
        return {};
    }
    getNextCard(st) {
        var u = Math.random();
        var p = 1 - 2 / (st.score + 2);
        var logp = Math.log(p);
        var geom = 0;
        var genGeom = true;
        while (genGeom) {
            var logpq = logp / (1 - p);
            var geom = (lambertW1((1 - u) * logpq * Math.exp(logpq)) - logpq) / logp;
            console.log(geom);
            var geom = Math.floor(geom);
            genGeom = geom >= st.cardList.length;
        }
        console.log(geom);
        return geom;
    }
    updateState(st, j, res) {
        if (res === flashcard_generator_1.FlashcardResult.Correct) {
            st.recentCorrect.unshift(j);
            st.recentCorrect = [...new Set(st.recentCorrect)].slice(0, st.memory);
        }
        else if (res === flashcard_generator_1.FlashcardResult.Incorrect) {
            st.recentIncorrect.unshift(j);
            st.recentIncorrect = [...new Set(st.recentIncorrect)].slice(0, st.memory);
        }
        else {
            return st;
        }
        if (st.recentCorrect.length == 0) {
            st.score = 2;
        }
        else if (st.recentIncorrect.length == 0) {
            st.score = 2 * Math.max(...st.recentCorrect) + 1;
        }
        else {
            var llFxn = zipfLogLikelihood(st.recentCorrect, st.recentIncorrect, st.cardList.length, st.alpha);
            var mle = findNaturalMaxUnimodal(llFxn);
            st.score = expectedWordsSeen(st.cardList.length, mle, st.alpha);
            console.log(`MLE: ${mle}`);
            console.log(`score: ${st.score}`);
        }
        st.score = Math.min(st.score, st.cardList.length - 1);
        return st;
    }
    generateCard(st, j) {
        console.log(st);
        console.log(j);
        console.log(st.cardList[j]);
        var htmlString = (0, nunjucks_1.renderString)(st.cardTemplate, {
            card: st.cardList[j],
            rank: j,
            fontSize: 50 / (10.0 * Math.log(10 + st.cardList[j].prompt.length))
        });
        var el = (new DOMParser().parseFromString(htmlString, "text/html").body.firstChild);
        console.log(el);
        return new flashcard_1.Flashcard(el, st.cardList[j].answer);
    }
    checkAnswer(answer, st, j) {
        return answer == st.cardList[j].answer;
    }
    makeEditor(st) {
        var contDiv = document.createElement("div");
        st.recentIncorrect.sort(function (a, b) { return a > b ? 1 : -1; });
        console.log(st.recentIncorrect);
        var menuTpl = `
            <div is="menu-group">
                <button is="menu-file-upload" name="cardListString">Upload frequency list</button>
                <div is="menu-textfield" name="cardTemplate"></div>
                <div class="menu-freq-prog-incorrect-list">
                <h3>Recently incorrect cards</h3>
                    {% for j in st.recentIncorrect %}
                        <div>
                            <span class="menu-freq-prog-incorrect-rank">[{{ j }}]</span> 
                            {{ st.cardList[j].answer }} ← {{ st.cardList[j].prompt }}
                        </div>
                    {% endfor %}
                </div>
            </div>
        `;
        var menuHTML = (0, nunjucks_1.renderString)(menuTpl, { st: st });
        contDiv.innerHTML = menuHTML;
        var menu = contDiv.children[0];
        menu.setState(st);
        return menu;
    }
}
exports.FreqProgGen = FreqProgGen;
(0, flashcard_deck_1.registerDeckType)(new FreqProgGen(), "frequency-progression-generator", "Frequency progression quizzer", exports.defaultFreqProgState, "#ccffcc");
