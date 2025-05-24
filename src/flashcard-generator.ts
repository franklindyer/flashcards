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

    // Repair the raw JSON associated with the deck, mainly used for update compatibility
    abstract repairDeckState(state: any): any;
    
    abstract getNextCard(state: S): D;
    abstract updateState(state: S, cardData: D, correct: FlashcardResult): S;
    abstract generateCard(data: D): Flashcard;
    abstract checkAnswer(answer: string, state: S, data: D): boolean;

    // Should not attempt to change the deck's state
    abstract correctEffect(state: S, cardData: D, attempt: string, resolve: () => void): void;   

    runOnce(s: S, setState: (s: S) => void, callback: () => void) {
        var cardData: D = this.getNextCard(s);
        var card = this.generateCard(cardData);
        card.check = (ans: string) => this.checkAnswer(ans, s, cardData);

        var inputBox = <HTMLInputElement>document.getElementById("answer-input");
        var correctCallback = (newState: S) => () => {
            inputBox.value = "";
            setState(newState);
            card.slideOut(callback, true);
        };
        var inputCallback = (attempt: string) => {
            var correct: boolean = card.check(attempt);
            if (correct) {
                inputBox.onkeydown = (e) => {}; // To prevent multiple submissions by accident
                var result = card.correctFirst ? FlashcardResult.Correct : FlashcardResult.Incorrect;
                var newState = this.updateState(s, cardData, result);
                this.correctEffect(newState, cardData, attempt, correctCallback(newState));
            } else {
                card.markWrong();
                inputBox.oninput = (e) => {
                    inputBox.value = (<InputEvent>e).data!;
                    inputBox.oninput = (e) => {};
                }
            }
        };
        inputBox.onkeydown = (e) => {
            if (e.key == "Enter") {
                inputCallback(inputBox.value);
            } else if (e.key == "ArrowUp") {
                // console.log("UP");
                var newState = this.updateState(s, cardData, FlashcardResult.Correct);
                // correctCallback(newState)();
                this.correctEffect(newState, cardData, "", correctCallback(newState));
                // inputBox.value = "";
                // setState(this.updateState(s, cardData, FlashcardResult.Correct)); 
                // card.slideOut(callback, true);
            } else if (e.key == "ArrowDown") {
                inputBox.value = "";
                setState(this.updateState(s, cardData, FlashcardResult.Unanswered)); 
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
