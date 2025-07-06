import {
    Flashcard
} from "./flashcard"
import {
    FlashcardResult,
    FlashcardGen
} from "./flashcard-generator"

export abstract class FlashcardSyncGen<S, D> extends FlashcardGen<S, D> {
    // Type S is the state type for this flashcard deck
    // Type D is the type of the data involved in the single card
    getGenName(): string {  
        throw new Error("getGenName not implemented!");
    }

    abstract getNextCard(state: S): D;
    abstract updateState(state: S, cardData: D, correct: FlashcardResult): S;
    abstract generateCard(state: S, data: D): Flashcard;
    abstract checkAnswer(answer: string, state: S, data: D): boolean;

    getNextCardAsync(state: S): Promise<D> {
        return new Promise((resolve, _) => { resolve(this.getNextCard(state)); });
    }

    updateStateAsync(state: S, cardData: D, correct: FlashcardResult): Promise<S> {
        return new Promise((resolve, _) => { resolve(this.updateState(state, cardData, correct)); });
    }

    generateCardAsync(state: S, data: D): Promise<Flashcard> {
        return new Promise((resolve, _) => { resolve(this.generateCard(state, data)); });
    }

    checkAnswerAsync(answer: string, state: S, data: D): Promise<boolean> {
        return new Promise((resolve, _) => { resolve(this.checkAnswer(answer, state, data)); });
    }
}
