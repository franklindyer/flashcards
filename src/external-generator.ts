import {
    Flashcard
} from "./flashcard"
import {
    FlashcardResult,
    FlashcardGen
} from "./flashcard-generator"

export type ExternalFlashcardData = {
    html: string,
    answerHashes: string[]
}

export type ExternalFlashcardState = {
    url: string
}

export class ExternalFlashcardGen extends FlashcardGen<ExternalFlashcardState, ExternalFlashcardData> {
    getGenName() { return "external-flashcard-gen"; }

    repairDeckState(st: any) { return st; }
    correctEffect(_: ExternalFlashcardState, __: ExternalFlashcardData, ___: string, resolve: () => void) { resolve() };

    getNextCardAsync(state: ExternalFlashcardState): Promise<ExternalFlashcardData> {
        var url = state.url + "/getNextCard";
        var postBody = {
            state: state
        };
        return fetch(url, {
            method: "POST",
            body: JSON.stringify(postBody)
        }).then((r) => r.json())
          .then((r) => <ExternalFlashcardData>r);
    }

    updateStateAsync(
        state: ExternalFlashcardState,
        cardData: ExternalFlashcardData,
        correct: FlashcardResult
    ): Promise<ExternalFlashcardState> {
        return null!;
    }

    checkAnswerAsync(
        ans: string,
        state: ExternalFlashcardState,
        cardData: ExternalFlashcardData
    ):  Promise<boolean> {
        return null!;
    }

    generateCardAsync(data: ExternalFlashcardData): Promise<Flashcard> {
        return null!;
    }
} 
