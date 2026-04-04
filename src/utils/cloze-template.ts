import {
    Flashcard
} from "core/flashcard"
import {
    FlashcardTemplate,
    gTemplateRegistry,
    registerTemplate
} from "core/flashcard-template"

export type ClozeCardData = {
    group: string,
    guid: string,
    upper: string,
    lower: string
};

class ClozeFlashcardTemplate extends FlashcardTemplate<ClozeCardData> {
    getName(): string { return "cloze-template"; }

    render(data: ClozeCardData): Flashcard {
        var el = document.createElement("div");
        el.style.display = "block";
        el.style.textAlign = "center";

        var aUpper = document.createElement("p");
        var aLower = document.createElement("p");
        aUpper.style.display = "block";
        aLower.style.display = "block";
        el.appendChild(aUpper); 
        el.appendChild(document.createElement("hr"));
        el.appendChild(aLower);

        var targetWords: string[] = [];
        aUpper.textContent = data.upper.replaceAll(/\{\{([^\{\}]+)\}\}/g, (match, p1) => {
            targetWords.push(p1);
            return "___";
        });
        var answer = targetWords.join(", ");
        aLower.textContent = data.lower;

        var fontSize = 900.0/(10.0*Math.log(10+aUpper.textContent.length));
        aUpper.style.fontSize = `${fontSize}px`;
        aLower.style.fontSize = `${0.7*fontSize}px`; 

        var puzzleSourceSpan = document.createElement("span");
        puzzleSourceSpan.textContent = data.group;
        puzzleSourceSpan.classList.add("cloze-puzzle-attribution");
        el.appendChild(puzzleSourceSpan);
   
        var fl = new Flashcard(el, answer);
        return fl;
    }
}

registerTemplate(new ClozeFlashcardTemplate());
