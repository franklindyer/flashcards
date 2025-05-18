import {
    IDictionary,
    guidGenerator,
    getUuid
} from "./utils"
import {
    Flashcard
} from "./flashcard"
import {
    FlashcardResult,
    FlashcardGen
} from "./flashcard-generator"
import {
    renderCard
} from "./flashcard-template"
import {
    StateEditor,
    boolEditor,
    fileUploadEditor
} from "./editor"
import {
    registerDeckType
} from "./flashcard-deck"

type ClozeCardData = {
    group: string,
    guid: string,    
    upper: string,
    lower: string
}

type ClozeCardGroup = {
    key: string,
    cards: ClozeCardData[],
    correct: number,
    incorrect: number,
    skipped: number
}

type ClozeDeckSettings = {
    blacklist: string[],
    blacklistSkipped: boolean
}

type ClozeDeckState = {
    cards: IDictionary<ClozeCardGroup>,
    settings: ClozeDeckSettings
}

class ClozeFlashcardGen extends FlashcardGen<ClozeDeckState, ClozeCardData> {
    getGenName() { return "cloze-puzzles"; }

    getNextCard(state: ClozeDeckState): ClozeCardData {
        var cardIsOk = (c: ClozeCardData) => !(state.settings.blacklist.includes(c.guid));
        var validKeys = Object.keys(state.cards).filter((k) => state.cards[k].cards.some(cardIsOk));
        var key = validKeys[Math.floor(Math.random() * validKeys.length)];
        var group = state.cards[key].cards.filter(cardIsOk);
        return group[Math.floor(Math.random() * group.length)];
    }

    updateState(state: ClozeDeckState, cardData: ClozeCardData, result: FlashcardResult): ClozeDeckState {
        if (result == FlashcardResult.Correct) {
            state.cards[cardData.group].correct += 1;
        } else if (result == FlashcardResult.Incorrect) {
            state.cards[cardData.group].incorrect += 1;
        } else {
            state.cards[cardData.group].skipped += 1;
            if (state.settings.blacklistSkipped) {
                state.settings.blacklist.push(cardData.guid);
            }
        }
        return state;
    } 
    
    checkAnswer(ans: string, st: ClozeDeckState, cardData: ClozeCardData) {
        var targetWords: string[] = [];
        cardData.upper.replaceAll(/\{\{([^\{\}]+)\}\}/g, (match, p1) => {
            targetWords.push(p1);
            return match;
        });
        var correctAns = targetWords.join(", ");
        return (ans == correctAns);
    }

    generateCard(data: ClozeCardData): Flashcard {
        return renderCard("cloze-template", data);
    }

    correctEffect(_: ClozeDeckState, __: ClozeCardData, ___: string, resolve: () => void) { resolve(); }
}

function makeClozeCard(group: string, top: string, bottom: string): ClozeCardData {
    return {
        group: group,
        guid: getUuid(`${top} | ${bottom}`, 5),
        upper: top,
        lower: bottom
    };
}

function makeClozeEditor(state: ClozeDeckState): StateEditor<ClozeDeckState> {
    var container = document.createElement("div");

    var blacklistEditor = boolEditor("Permanently remove skipped cards?", state.settings.blacklistSkipped);
    blacklistEditor.element.classList.add("deck-menu-submenu");

    var summaryContainer = document.createElement("div");
    summaryContainer.classList.add("deck-menu-submenu");

    var loadCards = (s: string) => {
         if (s.length > 0) {
            var newCardDict: IDictionary<ClozeCardGroup> = {};
            var infoList = <any>JSON.parse(s);
            console.log(infoList);
            for (var i in Object.keys(infoList)) {
                var k = Object.keys(infoList)[i];
                newCardDict[k] = {
                    key: k,
                    cards: infoList[k].map((c: any) => { return {
                        upper: c["prompt"],
                        lower: c["translation"],
                        guid: guidGenerator(),
                        group: k
                    }; }),
                    correct: Object.keys(state.cards).includes(k) ? state.cards[k].correct : 0,
                    incorrect: Object.keys(state.cards).includes(k) ? state.cards[k].incorrect : 0,
                    skipped: Object.keys(state.cards).includes(k) ? state.cards[k].skipped : 0
                };
            }
            state.cards = newCardDict;
        }
    }

    var deckSummary = document.createElement("div");
    var makeDeckSummary = () => {
        deckSummary.innerHTML = "";
        var keys = Object.keys(state.cards).sort();
        for (var i in keys) {
            var k = keys[i];
            var entryDiv = document.createElement("div");
            entryDiv.classList.add("deck-editor-info-entry");
            var entryKey = document.createElement("span");
            entryKey.textContent = k;
            var entryInfo = document.createElement("span");
            entryInfo.textContent = `${state.cards[k].cards.length} puzzles`;
            entryInfo.style.float = "right";
            entryDiv.appendChild(entryKey);
            entryDiv.appendChild(entryInfo);
            deckSummary.appendChild(entryDiv);
        }
    };
    makeDeckSummary();
    var fileEd = fileUploadEditor("Upload cloze puzzles", (s) => {
        loadCards(s);
        makeDeckSummary();
    });
    summaryContainer.appendChild(fileEd.element);
    summaryContainer.appendChild(deckSummary);

    container.appendChild(blacklistEditor.element);
    container.appendChild(summaryContainer);

    return {
        element: container,
        menuToState: () => {
            var deckStr = fileEd.menuToState();
            if (deckStr.length > 0) {
                var newCardDict: IDictionary<ClozeCardGroup> = {};
                var infoList = <any>JSON.parse(deckStr);
                console.log(infoList);
                for (var i in Object.keys(infoList)) {
                    var k = Object.keys(infoList)[i];
                    newCardDict[k] = {
                        key: k,
                        cards: infoList[k].map((c: any) => makeClozeCard(k, c["prompt"], c["translation"])),
                        correct: Object.keys(state.cards).includes(k) ? state.cards[k].correct : 0,
                        incorrect: Object.keys(state.cards).includes(k) ? state.cards[k].incorrect : 0,
                        skipped: Object.keys(state.cards).includes(k) ? state.cards[k].skipped : 0
                    };
                }
                state.cards = newCardDict;
            }
            state.settings.blacklistSkipped  = blacklistEditor.menuToState();
            return state;
        }
    };
}

var clozeDefaultState: ClozeDeckState = {
    cards: {
        "gehen": {
            key: "gehen",
            cards: [
                makeClozeCard("gehen", "Ich {{gehe}} ins Kino.", "I go to the movies."),
                makeClozeCard("gehen", "Wohin {{gehst}} du?", "Where are you going?")
            ],
            correct: 0,
            incorrect: 0,
            skipped: 0
        },
        "haben": {
            key: "haben",
            cards: [
                makeClozeCard("haben", "Ich {{habe}} einen Hund.", "I have a dog."),
                makeClozeCard("haben", "{{Hast}} du einen Hund?", "Do you have a dog?")
            ],
            correct: 0,
            incorrect: 0,
            skipped: 0
        }
    },
    settings: {
        blacklist: [],
        blacklistSkipped: true
    }
};

registerDeckType(
    new ClozeFlashcardGen(),
    makeClozeEditor,
    "cloze-quizzer",
    "Simple German cloze quizzer",
    clozeDefaultState,
    "#ffddbb"
);
