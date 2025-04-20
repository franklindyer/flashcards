"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Flashcard = void 0;
class Flashcard {
    el;
    check;
    constructor(el, check) {
        this.el = el;
        this.check = check;
    }
    slideIn() {
        var flCont = document.getElementById("flashcard-container");
        this.el.classList.add("flashcard");
        this.el.classList.add("flashcard-slide-in");
        this.el.onanimationend = () => { this.el.classList.remove("flashcard-slide-in"); };
        flCont.appendChild(this.el);
    }
    slideOut(callback) {
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
exports.Flashcard = Flashcard;
function basicFlashcard(prompt, answer) {
    var el = document.createElement("p");
    el.textContent = prompt;
    const flashcard = new Flashcard(el, (attempt) => answer == attempt);
    return flashcard;
}
var fl = basicFlashcard("1+2", "3");
// setTimeout(() => fl.slideIn(), 2000);
// setTimeout(() => fl.markWrong(), 4000);
// setTimeout(() => fl.slideOut(), 6000);
