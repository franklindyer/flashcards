import {
    Flashcard
} from "./flashcard"
import {
    FlashcardTemplate
} from "./flashcard-template"

export abstract class FlashcardGen<S, D> {
    // Type S is the state type for this flashcard deck
    // Type D is the type of the data involved in the single card
    getGenName(): string {  
        throw new Error("getGenName not implemented!");
    }
    
    template?: FlashcardTemplate<D>;

    abstract getNextCard(state: S): D;
    abstract updateState(state: S, cardData: D, correct: boolean): S;

    runOnce(s: S, setState: (s: S) => void, callback: () => void) {
        var cardData: D = this.getNextCard(s);
        var card = this.template!.generateCard(cardData);

        var inputBox = <HTMLInputElement>document.getElementById("answer-input");
        var inputCallback = (attempt: string) => {
            var correct: boolean = card.check(attempt);
            if (correct) {
                inputBox.value = "";
                setState(this.updateState(s, cardData, card.correctFirst));
                card.slideOut(callback);
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
                inputBox.value = "";
                setState(this.updateState(s, cardData, true)); 
                card.slideOut(callback);
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
