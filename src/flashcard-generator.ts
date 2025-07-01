import {
    guidGenerator,
    showLoadingIcon,
    hideLoadingIcon
} from "./utils"
import {
    Flashcard
} from "./flashcard"

export enum FlashcardResult {
    Correct,
    Incorrect,
    Unanswered
}

export abstract class FlashcardGen<S, D> {
    // Type S is the state type for this flashcard deck
    // Type D is the type of the data involved in the single card
    getGenName(): string {  
        throw new Error("getGenName not implemented!");
    }

    soonestRun: Date = new Date();
    showLoading: boolean = false;

    // Repair the raw JSON associated with the deck, mainly used for update compatibility
    abstract repairDeckState(state: any): any;
    
    abstract getNextCardAsync(state: S): Promise<D>;
    abstract updateStateAsync(state: S, cardData: D, correct: FlashcardResult): Promise<S>;
    abstract generateCardAsync(data: D): Promise<Flashcard>;
    abstract checkAnswerAsync(answer: string, state: S, data: D): Promise<boolean>;

    // Should not attempt to change the deck's state
    abstract correctEffect(state: S, cardData: D, attempt: string, resolve: () => void): void;   

    async runOnce(s: S, setState: (s: S) => void, callback: () => void, runTime: Date) {
        this.showLoading = true;
        setTimeout(() => {
            if (this.showLoading) {
                showLoadingIcon();
            } 
        }, 500)

        var cardData: D = await this.getNextCardAsync(s);
        var card = await this.generateCardAsync(cardData);
        
        hideLoadingIcon();
        this.showLoading = false;

        if (runTime.getTime() !== this.soonestRun.getTime()) return;

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
            var soonestRun = new Date();
            this.soonestRun = soonestRun;
            this.runOnce(getState(), setState, () => {
                callback();
                looper();
            }, soonestRun);
        };
        looper();
    }
}
