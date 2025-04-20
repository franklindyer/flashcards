export class Flashcard {
    el: HTMLElement;
    check: (answer: string) => boolean;
    hint: string;

    constructor(el: HTMLElement, check: (answer: string) => boolean, hint: string) {
        this.el = el;
        this.check = check;
        this.hint = hint;
    }

    slideIn() {
        var flCont = document.getElementById("flashcard-container")!;
        this.el.classList.add("flashcard");
        this.el.classList.add("flashcard-slide-in");
        this.el.onanimationend = () => { this.el.classList.remove("flashcard-slide-in"); };
        flCont.appendChild(this.el);
    }

    slideOut(callback: () => void) {
        this.el.classList.add("flashcard-slide-out"); 
        this.el.onanimationend = () => { 
            this.el.classList.remove("flashcard-slide-out");
            this.el.remove();
            callback();
        };
        (<HTMLInputElement>document.getElementById("answer-hint")).value = "";
    }

    markWrong() {
        this.el.classList.add("flashcard-incorrect");
        this.el.onanimationend = () => { this.el.classList.remove("flashcard-incorrect"); };
        (<HTMLInputElement>document.getElementById("answer-hint")).value = this.hint;
    }
    
}

function basicFlashcard(prompt: string, answer: string) {
    var el = document.createElement("p");
    el.textContent = prompt;
    const flashcard = new Flashcard(el, (attempt: string) => answer == attempt, answer);
    return flashcard;
}

