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
    StateEditor,
    scrollNumberEditor
} from "core/editor"
import {
    gDeckRegistry,
    gDeckTypeRegistry,
    registerDeckType
} from "core/flashcard-deck"


// Type of data needed to describe the state of the entire deck
type TimesTableState = {
    minNum: number,
    maxNum: number,
    recentlyIncorrect: [number, number][]
};

// The state of the deck when the user is using it for the first time
export const defaultTimesTableState = {
    minNum: 1,
    maxNum: 12,
    recentlyIncorrect: []
};

// Type of data needed to describe a single flashcard
type TimesTableFact = {
    factor1: number,
    factor2: number
};

export class TimesTableGen
    extends FlashcardSyncGen<TimesTableState, TimesTableFact> {

    getGenName(): string {
        return "times-table-generator";
    }

    repairDeckState(st: any): any {
        return st;
    }

    correctEffect(st: TimesTableState, c: TimesTableFact, attempt: string, resolve: () => void): void {
        resolve();
    }

    getNextCard(st: TimesTableState): TimesTableFact {
        var factor1 = Math.floor(Math.random() * (st.maxNum-st.minNum+1)) + st.minNum;
        var factor2 = Math.floor(Math.random() * (st.maxNum-st.minNum+1)) + st.minNum;
        return { factor1: factor1, factor2: factor2 };
    }

    updateState(st: TimesTableState, c: TimesTableFact, res: FlashcardResult): TimesTableState {
        // Keep track of the last 10 multiplication facts to be incorrectly answered
        if (res === FlashcardResult.Incorrect) {
            st.recentlyIncorrect.unshift([c.factor1, c.factor2]);
            st.recentlyIncorrect = st.recentlyIncorrect.slice(0, 10);
        }
        return st;
    }

    generateCard(st: TimesTableState, c: TimesTableFact) {
        var cardData = [`${c.factor1} × ${c.factor2}`, (c.factor1*c.factor2).toString()]
        return renderCard("basic-template", cardData);
    }

    checkAnswer(answer: string, st: TimesTableState, c: TimesTableFact) {
        return (answer === (c.factor1 * c.factor2).toString());
    }

}

function makeTimesTableEditor(st: TimesTableState): StateEditor<TimesTableState> {
    var minEd = scrollNumberEditor("Minimum factor:", st.minNum, 0, 100, 1);
    var maxEd = scrollNumberEditor("Maximum factor:", st.maxNum, 0, 100, 1);
   
    var wrongDiv = document.createElement("div");
    wrongDiv.style.backgroundColor = "#ffdddd";
    wrongDiv.classList.add("deck-menu-submenu");
    var wrongList = document.createElement("ul");
    var wrongHdr = document.createElement("b");
    wrongHdr.textContent = "You have not gotten any cards wrong yet.";
    for (var i in Object.keys(st.recentlyIncorrect)) {
        var fct = st.recentlyIncorrect[i];
        var li = document.createElement("li");
        li.textContent = `${fct[0]} × ${fct[1]} = ${fct[0] * fct[1]}`;
        wrongList.appendChild(li);
        wrongHdr.textContent = "You have gotten the following cards wrong:"
    }
    wrongDiv.appendChild(wrongHdr);
    wrongDiv.appendChild(wrongList);
    
    var edDiv = document.createElement("div");
    edDiv.appendChild(minEd.element);
    edDiv.appendChild(maxEd.element);
    edDiv.appendChild(wrongDiv);
    
    return {
        element: edDiv,
        menuToState: () => {
            return {
                minNum: minEd.menuToState(),
                maxNum: maxEd.menuToState(),
                recentlyIncorrect: st.recentlyIncorrect
            };
        }
    };
}

registerDeckType(
    new TimesTableGen(),
    makeTimesTableEditor,
    "times-table-quizzer",
    "Times table quizzer",
    defaultTimesTableState,
    "#ffcccc"
);
