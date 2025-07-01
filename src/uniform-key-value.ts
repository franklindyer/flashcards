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
    FlashcardSyncGen
} from "./flashcard-sync-generator"
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

    correctEffect(_: KVFlashcardState, __: BasicCardData, ___: string, resolve: () => void) { resolve() };
    repairDeckState(st: any) { return st; }
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
        ["dog", "perro"],
        ["{r0:the dog,the cat} runs", "{r0:el perro,el gato} corre"],
        ["{r0:I want,you want,he wants} {r1:to eat,to drink}", "{r0:quiero,quieres,quiere} {r1:comer,beber}"]
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
