import {
    Flashcard
} from "./flashcard";

export abstract class FlashcardTemplate<D> {
    abstract generateCard(data: D): Flashcard;
}
