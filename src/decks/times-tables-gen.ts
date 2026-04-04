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
    MenuComponent
} from "menus/menus"
import {
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

    reportableData(st: TimesTableState, c: TimesTableFact, res: FlashcardResult) {
        return {};
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

    makeEditor(st: TimesTableState): MenuComponent<TimesTableState> {
        var contDiv = document.createElement("div");
        var menuTpl: string = `
            <menu-group>
                <div>
                    <menu-number id="min-num-input" name="minNum" step=1></menu-number>
                    <label for="min-num-input">Minimum factor value</label>
                </div>
                <div>
                    <menu-number id="max-num-input" name="maxNum" step=1></menu-number>
                    <label for="max-num-input">Maximum factor value</label>
                </div>
                <h3>Questions recently answered incorrectly:</h3>
                <ul>
                    {% for r in st.recentlyIncorrect %}
                    <ul>{{ r[0] }} × {{ r[1] }} = {{ r[0]*r[1] }}</ul>
                    {% endfor %}
                </ul>            
            </menu-group>
        `;
        var menuHTML = renderString(menuTpl, { st: st });
        contDiv.innerHTML = menuHTML;
        var menu = <MenuComponent<TimesTableState>><any>contDiv.children[0];
        menu.setState(st);
        return menu;
    }

}

registerDeckType(
    new TimesTableGen(),
    "times-table-quizzer",
    "Times table quizzer",
    defaultTimesTableState,
    "#ffcccc"
);
