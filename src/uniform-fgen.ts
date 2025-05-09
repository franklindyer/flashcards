import {
    IDictionary,
    guidGenerator
} from "./utils"
import {
    Flashcard
} from "./flashcard"
import {
    FlashcardResult,
    FlashcardGen
} from "./flashcard-generator"
import {
    gDeckTypeRegistry,
    gDeckRegistry,
    registerDeckType
} from "./flashcard-deck"
import {
    renderCard
} from "./flashcard-template"
import {
    BasicCardData
} from "./basic-template"
import {
    StateEditor,
    makeTranslationEditor,
    multipleEditors
} from "./editor"

type KVFlashcardState = {
    deck: BasicCardData[],
    history: [string, boolean][]
}

class KVFlashcardGen extends FlashcardGen<KVFlashcardState, BasicCardData> {
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
    
    generateCard(state: KVFlashcardState, data: BasicCardData): Flashcard {
        return renderCard("basic-template", data);
    }

    correctEffect(_: KVFlashcardState, __: string, resolve: () => void) { resolve() };
}

function makeKVEditor(state: KVFlashcardState): StateEditor<KVFlashcardState> {
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

var kvDefaultState: KVFlashcardState = {
    deck: [
        ["cat", "gato"],
        ["dog", "perro"]
    ],
    history: []
};

registerDeckType(
    new KVFlashcardGen(),
    makeKVEditor,
    "key-value-quizzer",
    "Simple key-value quizzer",
    kvDefaultState
);
