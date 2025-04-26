import {
    IDictionary,
    guidGenerator
} from "./utils"
import {
    Flashcard
} from "./flashcard"
import {
    FlashcardGen
} from "./flashcard-generator"
import {
    FlashcardTemplate
} from "./flashcard-template"
import {
    registerDeckType
} from "./flashcard-deck"

type ClozeCardData = {
    group: string,
    guid: string,    
    upper: string,
    lower: string
}

type ClozeCardGroup = {
    key: string,
    cards: ClozeCardData[],
    correct: number,
    incorrect: number
}

type ClozeDeckState = {
    cards: IDictionary<ClozeCardGroup>
}

class ClozeFlashcardGen extends FlashcardGen<ClozeDeckState, ClozeCardData> {
    getGenName() { return "cloze-puzzles"; }

    getNextCard(state: ClozeDeckState): ClozeCardData {
        var key = Object.keys(state.cards)[Math.floor(Math.random() * Object.keys(state.cards).length)];
        var group = state.cards[key];
        return group.cards[Math.floor(Math.random() * Object.keys(group.cards).length)];
    }

    updateState(state: ClozeDeckState, cardData: ClozeCardData, correct: boolean): ClozeDeckState {
        if (correct) {
            state.cards[cardData.group].correct += 1;
        } else {
            state.cards[cardData.group].incorrect += 1;
        }
        return state;
    } 
}

class ClozeBasicTemplate extends FlashcardTemplate<ClozeCardData> {
    generateCard(data: ClozeCardData): Flashcard {
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
        aUpper.textContent = data.upper.replace(/\{\{([^\{\}]+)\}\}/, (match, p1) => {
            targetWords.push(p1);
            return "___";
        });
        var answer = targetWords.join(", ");
        aLower.textContent = data.lower;

        var fontSize = 100.0/(10.0*Math.log(10+aUpper.textContent.length));
        aUpper.style.fontSize = `${fontSize}vw`;
        aLower.style.fontSize = `${0.7*fontSize}vw`;

        var fl = new Flashcard(el, (attempt: string) => answer == attempt, answer);
        return fl;
    }
}

var clozeDefaultState: ClozeDeckState = {
    cards: {
        "gehen": {
            key: "gehen",
            cards: [
                {
                    group: "gehen",
                    guid: guidGenerator(),
                    upper: "Ich {{gehe}} ins Kino.",
                    lower: "I go to the movies."
                },
                {
                    group: "gehen",
                    guid: guidGenerator(),
                    upper: "Wohin {{gehst}} du?",
                    lower: "Where are you going?" 
                }
            ],
            correct: 0,
            incorrect: 0
        },
        "haben": {
            key: "haben",
            cards: [
                {
                    group: "haben",
                    guid: guidGenerator(),
                    upper: "Ich {{habe}} einen Hund.",
                    lower: "I have a dog."
                },
                {
                    group: "haben",
                    guid: guidGenerator(),
                    upper: "{{Hast}} du einen Hund?",
                    lower: "Do you have a dog?"
                }
            ],
            correct: 0,
            incorrect: 0
        }
    }
};

registerDeckType(
    new ClozeFlashcardGen(),
    new ClozeBasicTemplate(),
    () => null!,
    "cloze-quizzer",
    "Simple German cloze quizzer",
    clozeDefaultState
);
