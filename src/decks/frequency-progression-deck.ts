import {
    Flashcard
} from "core/flashcard"
import {
    FlashcardResult
} from "core/flashcard-generator"
import {
    FlashcardSyncGen
} from "core/flashcard-sync-generator"
import {
    renderCard
} from "core/flashcard-template"
import {
    renderString
} from "nunjucks"
import {
    njFreqProgCard
} from "utils/nj-templates"
import {
    MenuComponent
} from "menus/menus"
import {
    trivialPromise
} from "utils/utils"
import {
    RUSSIAN_FREQLIST
} from "utils/sample-russian-freqlist"
import {
    registerDeckType
} from "core/flashcard-deck"

// Argument must be between -1/e and 0
function lambertW1(y: number): number {
    var tol = 0.0001;
    var f = (x: number) => Math.log(y/x);
    var x = Math.log(-y);
    while (Math.abs(x - f(x)) > tol) {
        x = f(x);
    }
    return x;
}

function findNaturalMaxUnimodal(f: (n: number) => number): number {
    var lower_bound = 0;
    var upper_bound = 0;
    while (f(upper_bound) < f(upper_bound+1)) {
        upper_bound = 2*upper_bound+1;
    }
    while((upper_bound-lower_bound) > 1) {
        var probe = Math.floor((upper_bound+lower_bound)/2);
        if (f(probe) < f(probe+1)) {
            lower_bound = probe+1;
        } else {
            upper_bound = probe;
        }
    }
    return lower_bound;
}

function zipfLogLikelihood(knownWords: number[], unknownWords: number[], N: number, alpha: number) {
    return (khat: number) => {
        var cumLL: number = 0;
        for (var i in knownWords) {
            var n = knownWords[i];
            cumLL = cumLL + Math.log(1 - (1 - alpha*(Math.log(n+1)-Math.log(n))/Math.log(N))^khat);
        }
        for (var i in unknownWords) {
            var n = unknownWords[i];
            cumLL = cumLL + khat*Math.log(1 - alpha*(Math.log(n+1)-Math.log(n))/Math.log(N));
        }
        return cumLL;
    }
}

function expectedWordsSeen(N: number, K: number, alpha: number) {
    var cumsum = 0;
    var n = 1;
    while(n <= N) {
        var d = 1-Math.pow((1-alpha*(Math.log(n+1)-Math.log(n))/Math.log(N+1)), K);
        cumsum += d; 
        n++;
    }
    return Math.floor(cumsum);
}

type FreqProgCard = {
    prompt: string,
    answer: string,
    extraInfo: string
}

// Type of data needed to describe the state of the entire deck
type FreqProgState = {
    cardList: FreqProgCard[],
    recentCorrect: number[],
    recentIncorrect: number[],
    memory: number,
    alpha: number,
    score: number,
    cardTemplate: string
};

// The state of the deck when the user is using it for the first time
export const defaultFreqProgState = {
    cardList: RUSSIAN_FREQLIST.split("\n").map((ln) => {
        var r = ln.split("\t");
        return {
            prompt: r[1],
            answer: r[0],
            extraInfo: r[2]
        }
    }),
    recentCorrect: [],
    recentIncorrect: [],
    memory: 50,
    alpha: 0.1,
    score: 2,
    cardTemplate: njFreqProgCard
};

console.log(defaultFreqProgState);

export class FreqProgGen
    extends FlashcardSyncGen<FreqProgState, number> {

    getGenName(): string {
        return "frequency-progression-generator";
    }

    repairDeckState(st: any): any {
        return st;
    }

    correctEffect(st: FreqProgState, j: number, attempt: string, resolve: () => void): void {
        resolve();
    }

    reportableData(st: FreqProgState, j: number, res: FlashcardResult): any {
        return {};
    }

    getNextCard(st: FreqProgState): number {
        var u = Math.random();
        var p = 1 - 2/(st.score + 2);
        var logp = Math.log(p);
        var geom: number = 0;
        var genGeom = true;
        while (genGeom) {
            var logpq = logp/(1-p);
            var geom = (lambertW1((1-u) * logpq * Math.exp(logpq))-logpq)/logp;
            console.log(geom);
            var geom = Math.floor(geom);
            genGeom = geom >= st.cardList.length;
        }
        console.log(geom);
        return geom;
    }

    updateState(st: FreqProgState, j: number, res: FlashcardResult): FreqProgState {
        if (res === FlashcardResult.Correct) {
            st.recentCorrect.unshift(j);
            st.recentCorrect = [...new Set(st.recentCorrect)].slice(0, st.memory); 
        } else if (res === FlashcardResult.Incorrect) {
            st.recentIncorrect.unshift(j);
            st.recentIncorrect = [...new Set(st.recentIncorrect)].slice(0, st.memory); 
        } else {
            return st;
        }

        if (st.recentCorrect.length == 0) {
            st.score = 2;
        } else if (st.recentIncorrect.length == 0) {
            st.score = 2*Math.max(...st.recentCorrect) + 1;
        } else {
            var llFxn = zipfLogLikelihood(st.recentCorrect, st.recentIncorrect, st.cardList.length, st.alpha);
            var mle = findNaturalMaxUnimodal(llFxn);
            st.score = expectedWordsSeen(st.cardList.length, mle, st.alpha); 
            console.log(`MLE: ${mle}`);
            console.log(`score: ${st.score}`);
        }

        st.score = Math.min(st.score, st.cardList.length-1);
        return st;
    }

    generateCard(st: FreqProgState, j: number) {
        console.log(st);
        console.log(j);
        console.log(st.cardList[j]);
        var htmlString = renderString(st.cardTemplate, { 
            card: st.cardList[j],
            rank: j, 
            fontSize: 50/(10.0*Math.log(10+st.cardList[j].prompt.length))
        });
        var el = <HTMLElement>(new DOMParser().parseFromString(htmlString, "text/html").body.firstChild);
        console.log(el);
        return new Flashcard(el, st.cardList[j].answer);
    }

    checkAnswer(answer: string, st: FreqProgState, j: number) {
        return answer == st.cardList[j].answer; 
    }

    makeEditor(st: FreqProgState): MenuComponent<FreqProgState> {
        var contDiv = document.createElement("div");
        st.recentIncorrect.sort(function(a,b) { return a > b ? 1 : -1; });
        console.log(st.recentIncorrect);
        var menuTpl: string = `
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
        var menuHTML = renderString(menuTpl, { st: st });
        contDiv.innerHTML = menuHTML;
        var menu = <MenuComponent<FreqProgState>><any>contDiv.children[0];
        menu.setState(st);
        return menu;
    }

}

registerDeckType(
    new FreqProgGen(),
    "frequency-progression-generator",
    "Frequency progression quizzer",
    defaultFreqProgState,
    "#ccffcc"
);
