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
    
    state?: S;
    template?: FlashcardTemplate<D>;

    abstract getNextCard(state: S): D;
    abstract updateState(state: S, cardData: D, correct: boolean): S;

    runOnce(callback: () => void) {
        var cardData: D = this.getNextCard(this.state!);
        var card = this.template!.generateCard(cardData);

        var inputBox = <HTMLInputElement>document.getElementById("answer-input");
        var inputCallback = (attempt: string) => {
            var correct: boolean = card.check(attempt);
            if (correct) {
                card.slideOut(callback);
                inputBox.value = "";
                this.state = this.updateState(this.state!, cardData, card.correctFirst);
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
            }
        };

        card.slideIn(); 
    }

    runLoop(callback: () => void) {
        var looper = () => {
            this.runOnce(() => {
                callback();
                looper();
            });
        };
        looper();
    }
}
