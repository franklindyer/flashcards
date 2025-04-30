import {
    IDictionary,
    guidGenerator,
    makeDict
} from "./utils"
import {
    Flashcard
} from "./flashcard"
import {
    FlashcardResult,
    FlashcardGen
} from "./flashcard-generator"
import {
    registerDeckType
} from "./flashcard-deck"
import {
    utter,
    speechSettingsEditor,
    defaultSpeechSettings,
    SpeechSettings
} from "./speech"
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
    intervalMinutes: number,
    status: SpacedRepCardStatus,
    streak: number
}

type SpacedRepCardData = {
    content: SpacedRepCardContent | undefined,
    isReview: boolean,
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
    probReview: number,
    order: SpacedRepOrder,
    readCorrectAnswers: boolean,
    speechSettings: SpeechSettings
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
    probReview: 0.1,
    order: SpacedRepOrder.RandomOrder,
    readCorrectAnswers: false,
    speechSettings: defaultSpeechSettings()
};

function defaultCardTiming(): SpacedRepCardTiming {
    return {
        due: null,
        intervalMinutes: 0,
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
        { guid: guidGenerator(), prompt: "apple", answers: ["manzana"] },
        { guid: guidGenerator(), prompt: "banana", answers: ["plátano"] },
        { guid: guidGenerator(), prompt: "orange", answers: ["naranja"] },
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
            intervalMinutes: 0,
            status: SpacedRepCardStatus.CardNew,
            streak: 0
        }
    }
}

function getNew(st: SpacedRepState): string[] {
    return Object.keys(st.cards).filter((i) => st.cards[i].timing.due == null);
}

function getDue(st: SpacedRepState): string[] {
    return Object.keys(st.cards).filter(
        (i) => st.cards[i].timing.due != null
            && (new Date(st.cards[i].timing.due!) < new Date())
            && (st.cards[i].timing.intervalMinutes < st.settings.reviewCeilingDays*(24*60)));
}

function getReview(st: SpacedRepState): string[] {
    return Object.keys(st.cards).filter(
        (i) => st.cards[i].timing.intervalMinutes > st.settings.reviewCeilingDays*(24*60));
}

function pickSpacedRepCard(st: SpacedRepState): SpacedRepCardData {
    var inds = Object.keys(st.cards);
    var newInds = getNew(st);
    var dueInds = getDue(st);
    var reviewInds = getReview(st);
    switch (st.settings.studying) {
        case SpacedRepStudying.NewCards:
            if (newInds.length == 0) {
                return { content: undefined, cardsLeft: 0, isReview: false };
            }
            var newInd = newInds[Math.floor(Math.random() * newInds.length)];
            return { 
                content: st.cards[newInd].content, 
                cardsLeft: newInds.length,
                isReview: false,
            };
        case SpacedRepStudying.DueCards:
            if (dueInds.length == 0) {
                return { content: undefined, cardsLeft: 0, isReview: false };
            } else if (reviewInds.length > 0 && Math.random() < st.settings.probReview) {
                var reviewInd = reviewInds[Math.floor(Math.random() * reviewInds.length)];
                return {
                    content: st.cards[reviewInd].content,
                    cardsLeft: dueInds.length,
                    isReview: true
                };
            }
            var dueInd = dueInds[Math.floor(Math.random() * dueInds.length)];
            return { 
                content: st.cards[dueInd].content, 
                cardsLeft: dueInds.length,
                isReview: false
            };
    }
    return { content: undefined, cardsLeft: 0, isReview: false };
}

class SpacedRepGen extends FlashcardGen<SpacedRepState, SpacedRepCardData> {
    getGenName() { return "spaced-repetition-generator"; }

    getNextCard(state: SpacedRepState): SpacedRepCardData {
        return pickSpacedRepCard(state);
    }

    updateState(state: SpacedRepState, cardData: SpacedRepCardData, result: FlashcardResult): SpacedRepState {
        if (result == FlashcardResult.Unanswered)
            return state;

        var correct = (result == FlashcardResult.Correct);
        var cardState = state.cards[cardData.content!.guid];
        var dueDate = cardState.timing.due;

        if (correct) {
            cardState.timing.intervalMinutes 
                = cardState.timing.intervalMinutes * state.settings.correctFactor;
            cardState.timing.streak += 1;
        } else {
            cardState.timing.intervalMinutes
                = cardState.timing.intervalMinutes * state.settings.incorrectFactor;
            cardState.timing.streak = 0;
        }                

        if (cardState.timing.due === null) {
            if (cardState.timing.streak >= 3) {
                cardState.timing.intervalMinutes = state.settings.initialHours * 60;
                cardState.timing.due = new Date();
                cardState.timing.due!
                    .setHours(cardState.timing.due!.getHours() + cardState.timing.intervalMinutes/60); 
            }
        } else if (correct) {
            cardState.timing.due = new Date();
            cardState.timing.due!
                .setHours(cardState.timing.due!.getHours() + cardState.timing.intervalMinutes/60); 
        }
        cardState.timing.due = <Date>JSON.parse(JSON.stringify(cardState.timing.due));

        state.cards[cardData.content!.guid] = cardState;

        state.history.push({
            guid: cardData.content!.guid,
            answered: new Date(),
            timing: state.cards[cardData.content!.guid].timing,
            correct: correct,
            answerSeconds: 0
        });

        return state;
    }

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

        var fl = new Flashcard(a, pred, hint);

        if (data.isReview) {
            fl.el.style.backgroundColor = "#eeeeff";
        }

        var cardsLeft = document.createElement("span");
        cardsLeft.classList.add("cards-left-span");
        cardsLeft.textContent = `${data.cardsLeft} cards remaining`;
        fl.el.appendChild(cardsLeft);

        return fl;
    }

    correctEffect(st: SpacedRepState, attempt: string, resolve: () => void) {
        if (st.settings.readCorrectAnswers) {
            var ss = st.settings.speechSettings;
            utter(attempt, ss.voice, ss.rate, ss.pitch, resolve); 
        } else {
            resolve();
        }
    }

}

function spacedRepMenu(st: SpacedRepState): StateEditor<SpacedRepState> {
    var contDiv = document.createElement("div");

    var totP = document.createElement("p");
    totP.textContent = `Total cards: ${Object.keys(st.cards).length}`;
    totP.style.color = "#666666";
    totP.style.fontWeight = "bold";
    var newP = document.createElement("p");
    newP.textContent = `New cards: ${getNew(st).length}`;
    newP.style.color = "#9999ee";
    newP.style.fontWeight = "bold";
    var dueP = document.createElement("p");
    dueP.textContent = `Due cards: ${getDue(st).length}`;
    dueP.style.color = "#ee9999";
    dueP.style.fontWeight = "bold";
    var reviewP = document.createElement("p");
    reviewP.textContent = `Review cards: ${getReview(st).length}`;
    reviewP.style.color = "#99cc99";
    reviewP.style.fontWeight = "bold";

    var conf = st.settings;
    var studyingNewEditor = boolEditor("Studying new cards?", st.settings.studying === SpacedRepStudying.NewCards);
    var initHoursEditor = scrollNumberEditor("Initial interval (hours): ", conf.initialHours, 1, 240, 1);
    var reviewsEditor = scrollNumberEditor("Probability of getting review cards: ", conf.probReview, 0, 0.5, 0.01);

    var correctFactor = scrollNumberEditor("Correct factor: ", conf.correctFactor, 1, 10, 0.1);
    var incorrectFactor = scrollNumberEditor("Incorrect factor: ", conf.incorrectFactor, 0, 1, 0.01);

    var speechCheckbox = boolEditor("Speak correct answers using text-to-speech?", st.settings.readCorrectAnswers);
    var speechEditor = speechSettingsEditor(st.settings.speechSettings);

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
                        intervalMinutes: c.timing.intervalMinutes,
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
        totP,
        newP,
        dueP,
        reviewP,
        studyingNewEditor.element,
        initHoursEditor.element,
        correctFactor.element,
        incorrectFactor.element,
        reviewsEditor.element,
        speechCheckbox.element,
        speechEditor.element,
        cardsEditor.element,
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
                probReview: reviewsEditor.menuToState(),
                order: SpacedRepOrder.RandomOrder,
                readCorrectAnswers: speechCheckbox.menuToState(),
                speechSettings: speechEditor.menuToState()
            },
            cards: makeDict(cardsEditor.menuToState(), (c) => c.content.guid),
            history: st.history
        }}
    }
}

registerDeckType(
    new SpacedRepGen(),
    spacedRepMenu,
    "spaced-repetition-deck",
    "Spaced repetition deck",
    defaultSpacedRepState,
    "#ffffdd"
)
