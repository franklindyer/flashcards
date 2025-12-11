import {
    trivialPromise
} from "utils/utils"
import {
    Flashcard
} from "core/flashcard"
import {
    FlashcardTemplate,
    registerTemplate
} from "core/flashcard-template"

export type NoAnswerCardData = string;

class NoAnswerFlashcardTemplate extends FlashcardTemplate<NoAnswerCardData> {
    getName(): string { return "noanswer-template"; }
   
    render(data: NoAnswerCardData): Flashcard {
        var a = document.createElement("div");
        a.textContent = data;
        var fontSize = 90.0/(10.0*Math.log(10+data[0].length));
        var fl = new Flashcard(a, "", (_) => trivialPromise(false));
        fl.el.style.fontSize = `${fontSize}vw`;
        return fl;
    }
}

registerTemplate(new NoAnswerFlashcardTemplate());
