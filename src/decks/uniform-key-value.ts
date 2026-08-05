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
            <menu-group>
                <menu-list name="deck">
                    <button class="add-another-button">Add another</button>
                    <input class="search-bar" placeholder="search..."></input>
                    <div class="list-entry-container"></div>
                    <menu-group style="display: block;" class="list-default-entry">
                        <menu-textbox name="front" style="display: inline-block;"></menu-textbox>
                        <menu-textbox name="back" style="display: inline-block;"></menu-textbox>
                        <button class="list-entry-remove-button">remove</button>
                        <button class="list-entry-restore-button">restore</button>
                    </menu-group>
                </menu-list>
            </menu-group>
        `;
        var menuHTML = renderString(menuTpl, { st: st });
        contDiv.innerHTML = menuHTML;
        var menu = <MenuComponent<KVFlashcardState>><any>contDiv.children[0];
        menu.setState(st);
        return menu;
    }

    correctEffect(_: KVFlashcardState, __: KVCard, ___: string, resolve: () => void) { resolve(); }
    reportableData(state: KVFlashcardState, cardData: KVCard, attempt: string, correct: FlashcardResult) { return {}; }
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
