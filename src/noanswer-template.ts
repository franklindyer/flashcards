import {
    trivialPromise
} from "./utils"
import {
    Flashcard
} from "./flashcard"
import {
    FlashcardTemplate,
    gTemplateRegistry,
    registerTemplate
} from "./flashcard-template"

export type NoAnswerCardData = string;

class NoAnswerFlashcardTemplate extends FlashcardTemplate<NoAnswerCardData> {
    getName(): string { return "noanswer-template"; }
   
    render(data: NoAnswerCardData): Flashcard {
        var a = document.createElement("div");
        a.textContent = data;
        var fontSize = 100.0/(10.0*Math.log(10+data[0].length));
        var fl = new Flashcard(a, "", (_) => trivialPromise(false));
        fl.el.style.fontSize = `${fontSize}vw`;
        return fl;
    }
}

registerTemplate(new NoAnswerFlashcardTemplate());
