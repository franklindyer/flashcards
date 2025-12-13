import {
    Flashcard
} from "core/flashcard"
import {
    FlashcardResult
} from "core/flashcard-generator"
import {
    FlashcardSyncGen
} from "core/flashcard-sync-generator"
import {
    registerDeckType
} from "core/flashcard-deck"
import {
    renderCard
} from "core/flashcard-template"
import {
    BasicCardData
} from "utils/basic-template"
import {
    StateEditor,
    makeTranslationEditor
} from "core/editor"

export type KVFlashcardState = {
    deck: BasicCardData[],
    history: [string, boolean][]
}

export class KVFlashcardGen extends FlashcardSyncGen<KVFlashcardState, BasicCardData> {
    getGenName() { return "uniform-key-value"; }

    getNextCard(state: KVFlashcardState): BasicCardData {
        var dat = state.deck[Math.floor(Math.random() * Object.keys(state.deck).length)];
        return dat;
    }

    updateState(state: KVFlashcardState, cardData: BasicCardData, correct: FlashcardResult): KVFlashcardState {
        if (correct != FlashcardResult.Unanswered) {
            state.history.push([cardData[0], correct == FlashcardResult.Correct]);
        }
        return state;
    }
    
    checkAnswer(ans: string, state: KVFlashcardState, cardData: BasicCardData) {
        return (ans == cardData[1]);
    }
    
    generateCard(_: KVFlashcardState, data: BasicCardData): Flashcard {
        return renderCard("basic-template", data);
    }

    makeEditor(state: KVFlashcardState): StateEditor<KVFlashcardState> {
        var transEd = makeTranslationEditor(state.deck, (x: string) => true);
        return {
            element: transEd.element,
            menuToState: () => {
                return {
                    deck: transEd.menuToState(),
                    history: state.history
                };
            }
        }
    }

    correctEffect(_: KVFlashcardState, __: BasicCardData, ___: string, resolve: () => void) { resolve() };
    repairDeckState(st: any) { return st; }
}

var kvDefaultState: KVFlashcardState = {
    deck: [
        ["cat", "gato"],
        ["dog", "perro"],
        ["the dog runs", "el perro corre"],
    ],
    history: []
};

registerDeckType(
    new KVFlashcardGen(),
    "key-value-quizzer",
    "Simple key-value quizzer",
    kvDefaultState
);
