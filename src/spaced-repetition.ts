import {
    guidGenerator
} from "./utils"
import {
    Flashcard
} from "./flashcard"
import {
    FlashcardTemplate
} from "./flashcard-template"

enum SpacedRepCardStatus {
    CardNew = 1,
    CardStudying,
    CardReview
}

enum SpacedRepOrder {
    RandomOrder = 1,
    ReviewFirst,
    NewFirst
}

type SpacedRepCardContent = {
    guid: string,
    prompt: string,
    answers: string[]
}

type SpacedRepCardTiming = {
    due: Date | null,
    intervalSeconds: number,
    status: SpacedRepCardStatus
}

type SpacedRepCardData = {
    content: SpacedRepCardContent,
    cardsLeft: number
}

type SpacedRepCard = {
    content: SpacedRepCardContent,
    timing: SpacedRepCardTiming
}

type SpacedRepSettings = {
    initialHours: number,
    correctFactor: number,
    incorrectFactor: number,
    reviewInterval: number
}

type SpacedRepHistRecord = {
    guid: string,
    due: Date | null,
    answered: Date,
    timing: SpacedRepCardTiming,
    correct: boolean,
    answerSeconds: number    
}

function makeSpacedRepCard(prompt: string, answers: string[]): SpacedRepCard {
    return {
        content: {
            guid: guidGenerator(),
            prompt: prompt,
            answers: answers
        },
        timing: {
            due: null,
            intervalSeconds: 0,
            status: SpacedRepCardStatus.CardNew 
        }
    }
}

class SpacedRepTemplate extends FlashcardTemplate<SpacedRepCardData> {
    generateCard(data: SpacedRepCardData): Flashcard {
        var a = document.createElement("a");
        a.textContent = data.content.prompt;
        var fl = new Flashcard(
            a, 
            (answer: string) => data.content.answers.includes(answer),
            data.content.answers[0]
        );
        var fontSize = 100.0/(10.0*Math.log(10+data.content.prompt.length));
        fl.el.style.fontSize = `${fontSize}vw`;
        return fl;
    }
}
