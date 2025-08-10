export class Flashcard {
    el: HTMLElement;
    check: (answer: string) => Promise<boolean>;
    hint: string;
    correctFirst: boolean;

    constructor(el: HTMLElement, hint: string, check: (answer: string) => Promise<boolean> = (_: string) => new Promise((resolve, _) => false)) {
        this.el = el;
        this.check = check;
        this.hint = hint;
        this.correctFirst = true;
    }

    slideIn() {
        var flCont = document.getElementById("flashcard-container")!;
        this.el.classList.add("flashcard");
        this.el.classList.add("flashcard-slide-in");
        this.el.onanimationend = () => { this.el.classList.remove("flashcard-slide-in"); };
        flCont.appendChild(this.el);
        (<HTMLInputElement>document.getElementById("answer-hint")).value = "";
    }

    slideOut(callback: () => void, correct: boolean) {
        var outClass = correct ? "flashcard-slide-out" : "flashcard-slide-out-unanswered";
        this.el.classList.add(outClass); 
        this.el.onanimationend = () => { 
            this.el.classList.remove(outClass);
            this.el.remove();
            callback();
        };
        (<HTMLInputElement>document.getElementById("answer-hint")).value = "";
    }

    markWrong() {
        this.correctFirst = false;
        this.el.classList.add("flashcard-incorrect");
        this.el.onanimationend = () => { this.el.classList.remove("flashcard-incorrect"); };
        (<HTMLInputElement>document.getElementById("answer-hint")).value = this.hint;
    }
    
}

