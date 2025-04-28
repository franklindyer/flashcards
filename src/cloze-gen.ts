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
    StateEditor,
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

type ClozeDeckState = {
    cards: IDictionary<ClozeCardGroup>
}

class ClozeFlashcardGen extends FlashcardGen<ClozeDeckState, ClozeCardData> {
    getGenName() { return "cloze-puzzles"; }

    getNextCard(state: ClozeDeckState): ClozeCardData {
        var key = Object.keys(state.cards)[Math.floor(Math.random() * Object.keys(state.cards).length)];
        var group = state.cards[key];
        return group.cards[Math.floor(Math.random() * Object.keys(group.cards).length)];
    }

    updateState(state: ClozeDeckState, cardData: ClozeCardData, result: FlashcardResult): ClozeDeckState {
        if (result == FlashcardResult.Correct) {
            state.cards[cardData.group].correct += 1;
        } else if (result == FlashcardResult.Incorrect) {
            state.cards[cardData.group].incorrect += 1;
        } else {
            state.cards[cardData.group].skipped += 1;
        }
        return state;
    } 
    
    generateCard(data: ClozeCardData): Flashcard {
        var el = document.createElement("div");
        el.style.display = "block";
        el.style.textAlign = "center";
        var aUpper = document.createElement("p");
        var aLower = document.createElement("p");
        aUpper.style.display = "block";
        aLower.style.display = "block";
        el.appendChild(aUpper);
        el.appendChild(document.createElement("hr"));        
        el.appendChild(aLower);

        var targetWords: string[] = [];
        aUpper.textContent = data.upper.replace(/\{\{([^\{\}]+)\}\}/, (match, p1) => {
            targetWords.push(p1);
            return "___";
        });
        var answer = targetWords.join(", ");
        aLower.textContent = data.lower;

        var fontSize = 100.0/(10.0*Math.log(10+aUpper.textContent.length));
        aUpper.style.fontSize = `${fontSize}vw`;
        aLower.style.fontSize = `${0.7*fontSize}vw`;

        var fl = new Flashcard(el, (attempt: string) => answer == attempt, answer);
        return fl;
    }
}

function makeClozeEditor(state: ClozeDeckState): StateEditor<ClozeDeckState> {
    var container = document.createElement("div");

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
    container.appendChild(fileEd.element);
    container.appendChild(deckSummary);

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
            return state;
        }
    };
}

var clozeDefaultState: ClozeDeckState = {
    cards: {
        "gehen": {
            key: "gehen",
            cards: [
                {
                    group: "gehen",
                    guid: guidGenerator(),
                    upper: "Ich {{gehe}} ins Kino.",
                    lower: "I go to the movies."
                },
                {
                    group: "gehen",
                    guid: guidGenerator(),
                    upper: "Wohin {{gehst}} du?",
                    lower: "Where are you going?" 
                }
            ],
            correct: 0,
            incorrect: 0,
            skipped: 0
        },
        "haben": {
            key: "haben",
            cards: [
                {
                    group: "haben",
                    guid: guidGenerator(),
                    upper: "Ich {{habe}} einen Hund.",
                    lower: "I have a dog."
                },
                {
                    group: "haben",
                    guid: guidGenerator(),
                    upper: "{{Hast}} du einen Hund?",
                    lower: "Do you have a dog?"
                }
            ],
            correct: 0,
            incorrect: 0,
            skipped: 0
        }
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
