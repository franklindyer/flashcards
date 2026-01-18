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
    registerDeckType
} from "core/flashcard-deck"

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
    cardList: [],
    recentCorrect: [],
    recentIncorrect: [],
    memory: 50,
    alpha: 0.1,
    score: 2,
    cardTemplate: njFreqProgCard
};

export class FreqProgGen
    extends FlashcardSyncGen<FreqProgState, FreqProgCard> {

    getGenName(): string {
        return "frequency-progression-generator";
    }

    repairDeckState(st: any): any {
        return st;
    }

    correctEffect(st: FreqProgState, c: FreqProgCard, attempt: string, resolve: () => void): void {
        resolve();
    }

    getNextCard(st: FreqProgState): FreqProgCard {
        return null!;
    }

    updateState(st: FreqProgState, c: FreqProgCard, res: FlashcardResult): FreqProgState {
        return null!;
    }

    generateCard(st: FreqProgState, c: FreqProgCard) {
        return null!;
    }

    checkAnswer(answer: string, st: FreqProgState, c: FreqProgCard) {
        return null!; 
    }

    makeEditor(st: FreqProgState): MenuComponent<FreqProgState> {
        var contDiv = document.createElement("div");
        var menuTpl: string = `
            <div is="menu-group">
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
    "frequency-progression-quizzer",
    "Frequency progression quizzer",
    defaultFreqProgState,
    "#ccffcc"
);
