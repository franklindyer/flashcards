"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Flashcard = void 0;
class Flashcard {
    el;
    check;
    hint;
    correctFirst;
    constructor(el, check, hint) {
        this.el = el;
        this.check = check;
        this.hint = hint;
        this.correctFirst = true;
    }
    slideIn() {
        var flCont = document.getElementById("flashcard-container");
        this.el.classList.add("flashcard");
        this.el.classList.add("flashcard-slide-in");
        this.el.onanimationend = () => { this.el.classList.remove("flashcard-slide-in"); };
        flCont.appendChild(this.el);
        document.getElementById("answer-hint").value = "";
    }
    slideOut(callback) {
        this.el.classList.add("flashcard-slide-out");
        this.el.onanimationend = () => {
            this.el.classList.remove("flashcard-slide-out");
            this.el.remove();
            callback();
        };
        document.getElementById("answer-hint").value = "";
    }
    markWrong() {
        this.correctFirst = false;
        this.el.classList.add("flashcard-incorrect");
        this.el.onanimationend = () => { this.el.classList.remove("flashcard-incorrect"); };
        document.getElementById("answer-hint").value = this.hint;
    }
}
exports.Flashcard = Flashcard;
function basicFlashcard(prompt, answer) {
    var el = document.createElement("p");
    el.textContent = prompt;
    const flashcard = new Flashcard(el, (attempt) => answer == attempt, answer);
    return flashcard;
}
