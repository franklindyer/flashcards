export class Flashcard {
    el: HTMLElement;
    check: (answer: string) => boolean;

    constructor(el: HTMLElement, check: (answer: string) => boolean) {
        this.el = el;
        this.check = check;
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
    }

    markWrong() {
        this.el.classList.add("flashcard-incorrect");
        this.el.onanimationend = () => { this.el.classList.remove("flashcard-incorrect"); };
    }
    
}

function basicFlashcard(prompt: string, answer: string) {
    var el = document.createElement("p");
    el.textContent = prompt;
    const flashcard = new Flashcard(el, (attempt: string) => answer == attempt);
    return flashcard;
}

var fl = basicFlashcard("1+2", "3");
// setTimeout(() => fl.slideIn(), 2000);
// setTimeout(() => fl.markWrong(), 4000);
// setTimeout(() => fl.slideOut(), 6000);
