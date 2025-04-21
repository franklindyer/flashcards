import {
    IDictionary,
    guidGenerator,
    makeDict
} from "./utils"
import {
    Flashcard
} from "./flashcard"
import {
    FlashcardTemplate
} from "./flashcard-template"
import {
    FlashcardGen
} from "./flashcard-generator"
import {
    registerDeckType
} from "./flashcard-deck"
import {
    StateEditor,
    boolEditor,
    scrollNumberEditor,
    singleTextFieldEditor,
    fixedNumEditors,
    multipleEditors
} from "./editor"

enum SpacedRepCardStatus {
    CardNew = 1,
    CardStudying,
    CardReview
}

enum SpacedRepStudying {
    NewCards,
    DueCards
}

enum SpacedRepOrder {
    RandomOrder = 1,
    ReviewFirst,
    NewFirst
}

type SpacedRepCardContent = {
    guid: string,
    prompt: string,
    answers: string[]
}

type SpacedRepCardTiming = {
    due: Date | null,
    intervalSeconds: number,
    status: SpacedRepCardStatus,
    streak: number
}

type SpacedRepCardData = {
    content: SpacedRepCardContent | undefined,
    cardsLeft: number
}

type SpacedRepCard = {
    content: SpacedRepCardContent,
    timing: SpacedRepCardTiming
}

type SpacedRepSettings = {
    initialHours: number,
    correctFactor: number,
    incorrectFactor: number,
    reviewCeilingDays: number,
    studying: SpacedRepStudying,
    order: SpacedRepOrder 
}

type SpacedRepHistRecord = {
    guid: string,
    answered: Date,
    timing: SpacedRepCardTiming,
    correct: boolean,
    answerSeconds: number    
}

type SpacedRepState = {
    cards: IDictionary<SpacedRepCard>,
    settings: SpacedRepSettings,
    history: SpacedRepHistRecord[]
}

const defaultSpacedRepSettings = {
    initialHours: 6,
    correctFactor: 1.6,
    incorrectFactor: 0.5,
    reviewCeilingDays: 365,
    studying: SpacedRepStudying.NewCards,
    order: SpacedRepOrder.RandomOrder
};

function defaultCardTiming(): SpacedRepCardTiming {
    return {
        due: null,
        intervalSeconds: 0,
        status: SpacedRepCardStatus.CardNew,
        streak: 0
    }
}

function makeSpacedRepCardDict(cardDat: SpacedRepCardContent[]): IDictionary<SpacedRepCard> {
    var cardDict: IDictionary<SpacedRepCard> = {};
    for (var i in cardDat) {
        var c = cardDat[i];
        cardDict[c.guid] = { content: c, timing: defaultCardTiming() };
    }
    return cardDict;
}

const defaultSpacedRepState = {
    cards: makeSpacedRepCardDict([
        { guid: "", prompt: "apple", answers: ["manzana"] },
        { guid: "", prompt: "banana", answers: ["plátano"] },
        { guid: "", prompt: "orange", answers: ["naranja"] },
    ]),    
    settings: defaultSpacedRepSettings,
    history: []
}


function makeSpacedRepCard(prompt: string, answers: string[]): SpacedRepCard {
    var guid = guidGenerator();
    return {
        content: {
            guid: guid,
            prompt: prompt,
            answers: answers
        },
        timing: {
            due: null,
            intervalSeconds: 0,
            status: SpacedRepCardStatus.CardNew,
            streak: 0
        }
    }
}

function pickSpacedRepCard(st: SpacedRepState): SpacedRepCardData {
    var inds = Object.keys(st.cards);
    var newInds = inds.filter((i) => st.cards[i].timing.due == null);
    var dueInds = inds.filter(
        (i) => st.cards[i].timing.due != null && new Date(st.cards[i].timing.due!) < new Date());
    switch (st.settings.studying) {
        case SpacedRepStudying.NewCards:
            if (newInds.length == 0) {
                return { content: undefined, cardsLeft: 0 };
            }
            var newInd = newInds[Math.floor(Math.random() * newInds.length)];
            return { content: st.cards[newInd].content, cardsLeft: newInds.length };
        case SpacedRepStudying.DueCards:
            if (newInds.length == 0) {
                return { content: undefined, cardsLeft: 0 };
            }
            var dueInd = Math.floor(Math.random() * dueInds.length);
            return { content: st.cards[dueInd].content, cardsLeft: dueInds.length };
    }
    return { content: undefined, cardsLeft: 0 };
}

class SpacedRepTemplate extends FlashcardTemplate<SpacedRepCardData> {
    generateCard(data: SpacedRepCardData): Flashcard {
        var a = document.createElement("a");
        var prompt = "No cards left to study.";
        var pred = (_: string) => false;
        var hint = "You cannot continue studying until more cards become due.";

        if (data.content !== undefined) {
            prompt = data.content.prompt;
            pred = (answer: string) => data.content!.answers.includes(answer);
            hint = data.content.answers[0];
        }

        var fontSize = 100.0/(10.0*Math.log(10+prompt.length));
        a.style.fontSize = `${fontSize}vw`;
        a.textContent = prompt;       
 
        return new Flashcard(
            a,
            pred,
            hint
        );
    }
}

class SpacedRepGen extends FlashcardGen<SpacedRepState, SpacedRepCardData> {
    getGenName() { return "spaced-repetition-generator"; }

    getNextCard(state: SpacedRepState): SpacedRepCardData {
        return pickSpacedRepCard(state);
    }

    updateState(state: SpacedRepState, cardData: SpacedRepCardData, correct: boolean): SpacedRepState {
        var cardState = state.cards[cardData.content!.guid];
        var dueDate = cardState.timing.due;

        if (correct) {
            cardState.timing.intervalSeconds 
                = cardState.timing.intervalSeconds * state.settings.correctFactor;
            cardState.timing.streak += 1;
        } else {
            cardState.timing.intervalSeconds 
                = cardState.timing.intervalSeconds * state.settings.incorrectFactor;
            cardState.timing.streak = 0;
        }                

        if (cardState.timing.due === null) {
            if (cardState.timing.streak >= 3) {
                cardState.timing.intervalSeconds = state.settings.initialHours * 3600;
                cardState.timing.due = new Date();
                cardState.timing.due!
                    .setHours(cardState.timing.due!.getHours() + cardState.timing.intervalSeconds/3600); 
            }
        } else if (correct) {
            cardState.timing.due = new Date();
            cardState.timing.due!
                .setHours(cardState.timing.due!.getHours() + cardState.timing.intervalSeconds/3600); 
        }
        cardState.timing.due = <Date>JSON.parse(JSON.stringify(cardState.timing.due));

        state.history.push({
            guid: cardData.content!.guid,
            answered: new Date(),
            timing: state.cards[cardData.content!.guid].timing,
            correct: correct,
            answerSeconds: 0
        });

        return state;
    }
}

function spacedRepMenu(st: SpacedRepState): StateEditor<SpacedRepState> {
    var contDiv = document.createElement("div");
    var conf = st.settings;
    var studyingNewEditor = boolEditor("Studying new cards?", st.settings.studying === SpacedRepStudying.NewCards);
    var initHoursEditor = scrollNumberEditor("Initial interval (hours): ", conf.initialHours, 1, 240, 1);
    var correctFactor = scrollNumberEditor("Correct factor: ", conf.correctFactor, 1, 10, 0.1);
    var incorrectFactor = scrollNumberEditor("Incorrect factor: ", conf.incorrectFactor, 0, 1, 0.01);

    function makeCardEditor(c: SpacedRepCard): StateEditor<SpacedRepCard> {
        var ed = fixedNumEditors([c.content.prompt, c.content.answers.join('|')], singleTextFieldEditor);
        var cardInfo = document.createElement("a");
        cardInfo.style.color = "lightgray";
        cardInfo.style.marginLeft = "10px";
        cardInfo.style.marginRight = "10px";
        cardInfo.style.verticalAlign = "middle";
        if (c.timing.due === null) {
            cardInfo.textContent = "not studied";
        } else {
            cardInfo.textContent = `due ${c.timing.due.toLocaleString().split('T')[0]}`;
        }
        ed.element.appendChild(cardInfo);
        return {
            element: ed.element,
            menuToState: () => {
                let tp = ed.menuToState();
                return {
                    content: {
                        guid: c.content.guid,
                        prompt: tp[0],
                        answers: tp[1].split('|')
                    },
                    timing: {
                        due: c.timing.due,
                        intervalSeconds: c.timing.intervalSeconds,
                        streak: c.timing.streak,
                        status: c.timing.status,
                    }
                }
            }
        }
    };
    var cardsEditor = multipleEditors(
        Object.values(st.cards), 
        () => makeSpacedRepCard("", []), 
        makeCardEditor,
        true,
        (s, cd) => cd.content.prompt.includes(s) || cd.content.answers.some((a) => a.includes(s)));
    var cardsEditorTitle = document.createElement("h3");
    cardsEditorTitle.textContent = "Cards";
    cardsEditor.element.prepend(cardsEditorTitle);

    var components = [
        studyingNewEditor.element,
        initHoursEditor.element,
        correctFactor.element,
        incorrectFactor.element,
        cardsEditor.element
    ];
    components.map((el) => contDiv.appendChild(el));
    return {
        element: contDiv,
        menuToState: () => { return {
            settings: {
                initialHours: initHoursEditor.menuToState(),
                correctFactor: correctFactor.menuToState(),
                incorrectFactor: incorrectFactor.menuToState(),
                studying: studyingNewEditor.menuToState() ? SpacedRepStudying.NewCards : SpacedRepStudying.DueCards,
                reviewCeilingDays: st.settings.reviewCeilingDays,
                order: SpacedRepOrder.RandomOrder,
            },
            cards: makeDict(cardsEditor.menuToState(), (c) => c.content.guid),
            history: st.history
        }}
    }
}

registerDeckType(
    new SpacedRepGen(),
    new SpacedRepTemplate(),
    spacedRepMenu,
    "spaced-repetition-deck",
    "Spaced repetition deck",
    defaultSpacedRepState
)
