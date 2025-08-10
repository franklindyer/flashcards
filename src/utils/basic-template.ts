import {
    Flashcard
} from "core/flashcard"
import {
    FlashcardTemplate,
    gTemplateRegistry,
    registerTemplate
} from "core/flashcard-template"

export type BasicCardData = [string, string];

class BasicFlashcardTemplate extends FlashcardTemplate<BasicCardData> {
    getName(): string { return "basic-template"; }
   
    render(data: BasicCardData): Flashcard {
        var a = document.createElement("div");
        a.textContent = data[0];
        var fontSize = 100.0/(10.0*Math.log(10+data[0].length));
        var fl = new Flashcard(a, data[1]);
        fl.el.style.fontSize = `${fontSize}vw`;
        return fl;
    }
}

registerTemplate(new BasicFlashcardTemplate());
