import {
    showLoadingIcon,
    hideLoadingIcon
} from "utils/utils"
import {
    logPost
} from "./logging"
import {
    MenuComponent    
} from "menus/menus"
import {
    Flashcard
} from "core/flashcard"

export enum FlashcardResult {
    Correct,
    Incorrect,
    Unanswered
}

var SOONEST_RUN: Date = null!;

export abstract class FlashcardGen<S, D> {
    // Type S is the state type for this flashcard deck
    // Type D is the type of the data involved in the single card
    getGenName(): string {  
        throw new Error("getGenName not implemented!");
    }

    showLoading: boolean = false;

    // Repair the raw JSON associated with the deck, mainly used for update compatibility
    abstract repairDeckState(state: any): any;
    
    abstract getNextCardAsync(state: S): Promise<D>;
    abstract updateStateAsync(state: S, cardData: D, correct: FlashcardResult): Promise<S>;
    abstract generateCardAsync(state: S, data: D): Promise<Flashcard>;
    abstract checkAnswerAsync(answer: string, state: S, data: D): Promise<boolean>;

    abstract makeEditor(s: S): MenuComponent<S>;

    // Should not attempt to change the deck's state
    abstract correctEffect(state: S, cardData: D, attempt: string, resolve: () => void): void;   

    // Used for statistics/data reporting
    abstract reportableData(state: S, cardData: D, correct: FlashcardResult): any;

    async runOnce(s: S, setState: (s: S) => void, callback: () => void) {
        this.showLoading = true;
        setTimeout(() => {
            if (this.showLoading) {
                showLoadingIcon();
            } 
        }, 500)

        var thisRunTime = new Date();
        console.log(thisRunTime);
        SOONEST_RUN = thisRunTime;

        var cardData: D = await this.getNextCardAsync(s);
        var card = await this.generateCardAsync(s, cardData);
        card.check = (ans: string) => this.checkAnswerAsync(ans, s, cardData);

        if (thisRunTime.getTime() !== SOONEST_RUN.getTime()) {
            console.log(`Canceling run for ${thisRunTime} as it is not the most recent`);
            return;
        }
        
        hideLoadingIcon();
        this.showLoading = false;

        var thisDeckSlug = localStorage.getItem("last-deck-slug")!;

        var inputBox = <HTMLInputElement>document.getElementById("answer-input");
        var correctCallback = (newState: S) => () => {
            inputBox.value = "";
            setState(newState);
            card.slideOut(callback, true);
        };
        var inputCallback = async (attempt: string) => {
            var correct: boolean = await card.check(attempt);
            if (correct) {
                inputBox.onkeydown = (e) => {}; // To prevent multiple submissions by accident
                var result = card.correctFirst ? FlashcardResult.Correct : FlashcardResult.Incorrect;
                var newState = await this.updateStateAsync(s, cardData, result);
                logPost(thisDeckSlug, this.reportableData(s, cardData, result));
                await this.correctEffect(newState, cardData, attempt, correctCallback(newState));
            } else {
                card.markWrong();
                inputBox.oninput = (e) => {
                    inputBox.value = (<InputEvent>e).data!;
                    inputBox.oninput = (e) => {};
                }
            }
        };
        inputBox.onkeydown = async (e) => {
            if (e.key == "Enter") {
                inputCallback(inputBox.value);
            } else if (e.key == "ArrowUp") {
                var newState = await this.updateStateAsync(s, cardData, FlashcardResult.Correct);
                logPost(thisDeckSlug, this.reportableData(s, cardData, FlashcardResult.Correct));
                this.correctEffect(newState, cardData, "", correctCallback(newState));
            } else if (e.key == "ArrowDown") {
                inputBox.value = "";
                this.updateStateAsync(s, cardData, FlashcardResult.Unanswered).then(setState); 
                card.slideOut(callback, false);
            }
        };

        card.slideIn();
    }

    runLoop(getState: () => S, setState: (s: S) => void, callback: () => void) {
        var looper = () => {
            this.runOnce(getState(), setState, () => {
                callback();
                looper();
            });
        };
        looper();
    }
}
