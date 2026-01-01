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
    renderString
} from "nunjucks"
import {
    MenuComponent
} from "menus/menus"

type KVCard = {
    front: string,
    back: string
}

export type KVFlashcardState = {
    deck: KVCard[],
    history: [string, boolean][]
}

export class KVFlashcardGen extends FlashcardSyncGen<KVFlashcardState, KVCard> {
    getGenName() { return "uniform-key-value"; }

    getNextCard(state: KVFlashcardState): KVCard {
        var dat = state.deck[Math.floor(Math.random() * Object.keys(state.deck).length)];
        return dat;
    }

    updateState(state: KVFlashcardState, cardData: KVCard, correct: FlashcardResult): KVFlashcardState {
        if (correct != FlashcardResult.Unanswered) {
            state.history.push([cardData.front, correct == FlashcardResult.Correct]);
        }
        return state;
    }
    
    checkAnswer(ans: string, state: KVFlashcardState, cardData: KVCard) {
        return (ans == cardData.back);
    }
    
    generateCard(_: KVFlashcardState, data: KVCard): Flashcard {
        return renderCard("basic-template",[data.front, data.back])
    }

    makeEditor(st: KVFlashcardState): MenuComponent<KVFlashcardState> {
        var contDiv = document.createElement("div");
        var menuTpl: string = `
            <div is="menu-group">
                <div is="menu-list" name="deck">
                    <div is="menu-group" style="display: inline-block;">
                        <input is="menu-textbox" name="front" />
                        <input is="menu-textbox" name="back" />
                    </div>
                </div>
            </div>
        `;
        var menuHTML = renderString(menuTpl, { st: st });
        contDiv.innerHTML = menuHTML;
        var menu = <MenuComponent<KVFlashcardState>><any>contDiv.children[0];
        menu.setState(st);
        return menu;
    }

    correctEffect(_: KVFlashcardState, __: KVCard, ___: string, resolve: () => void) { resolve() };
    repairDeckState(st: any) { return st; }
}

var kvDefaultState: KVFlashcardState = {
    deck: [
        { front: "cat", back: "gato"},
        { front: "dog", back: "perro"},
        { front: "the dog runs", back: "el perro corre"}
    ],
    history: []
};

registerDeckType(
    new KVFlashcardGen(),
    "key-value-quizzer",
    "Simple key-value quizzer",
    kvDefaultState
);
