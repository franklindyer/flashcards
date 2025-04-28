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
    StateEditor,
    makeTranslationEditor,
    multipleEditors
} from "./editor"

type KVCardData = [string, string];

type KVFlashcardState = {
    deck: KVCardData[],
    history: [string, boolean][]
}

class KVFlashcardGen extends FlashcardGen<KVFlashcardState, KVCardData> {
    getGenName() { return "uniform-key-value"; }

    getNextCard(state: KVFlashcardState): KVCardData {
        var dat = state.deck[Math.floor(Math.random() * Object.keys(state.deck).length)];
        return dat;
    }

    updateState(state: KVFlashcardState, cardData: KVCardData, correct: FlashcardResult): KVFlashcardState {
        if (correct != FlashcardResult.Unanswered) {
            state.history.push([cardData[0], correct == FlashcardResult.Correct]);
        }
        return state;
    }
    
    generateCard(data: KVCardData): Flashcard {
        var a = document.createElement("a");
        a.textContent = data[0];
        var fl = new Flashcard(a, (answer: string) => data[1] == answer, data[1]);
        var fontSize = 100.0/(10.0*Math.log(10+data[0].length));
        fl.el.style.fontSize = `${fontSize}vw`;
        return fl;
    }
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

// var kvGen = new KVFlashcardGen();
// kvGen.state = kvState;
// kvGen.template = new KVBasicTemplate();
// kvGen.runLoop()

registerDeckType(
    new KVFlashcardGen(),
    makeKVEditor,
    "key-value-quizzer",
    "Simple key-value quizzer",
    kvDefaultState
);
