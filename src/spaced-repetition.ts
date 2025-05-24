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
    TextFilterSettings,
    applyTextFilter,
    textFilterSelectionMenu,
    defaultTextFilterSettings
} from "./text-filters"
import {
    StateEditor,
    boolEditor,
    scrollNumberEditor,
    singleTextFieldEditor,
    fixedNumEditors,
    makeSwappingEditor,
    multipleEditors,
    combineEditors
} from "./editor"
import {
    randomizeStringSub
} from "./random-templating"


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
    answers: string[],
    tags: string[]
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
    isPractice: boolean,
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
    practiceMode: boolean,
    probReview: number,
    order: SpacedRepOrder,
    readCorrectAnswers: boolean,
    speechSettings: SpeechSettings,
    filterSettings: TextFilterSettings,
    inactiveTags: string[] 
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
    practiceMode: false,
    probReview: 0.1,
    order: SpacedRepOrder.RandomOrder,
    readCorrectAnswers: false,
    speechSettings: defaultSpeechSettings(),
    filterSettings: defaultTextFilterSettings,
    inactiveTags: []
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
        { guid: guidGenerator(), prompt: "apple", answers: ["manzana"], tags: [] },
        { guid: guidGenerator(), prompt: "banana", answers: ["plátano"], tags: [] },
        { guid: guidGenerator(), prompt: "orange", answers: ["naranja"], tags: [] },
        { guid: guidGenerator(), prompt: "I have {r0:an apple,a banana,an orange}", answers: ["tengo {r0:una manzana,un plátano,una naranja}"], tags: [] },
        { guid: guidGenerator(), prompt: "{r0:I want,you want,he wants} {r1:an apple,a banana,an orange}", answers: ["{r0:quiero,quieres,quiere} {r1:una manzana,un plátano,una naranja}"], tags: [] },
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
            answers: answers,
            tags: []
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
    return Object.keys(st.cards)
            .filter((i) => st.cards[i].timing.due == null)
            .filter((i) => st.cards[i].content.tags.filter((t) => st.settings.inactiveTags.includes(t)).length == 0);
}

function getDue(st: SpacedRepState): string[] {
    return Object.keys(st.cards).filter(
        (i) => st.cards[i].timing.due != null
            && (new Date(st.cards[i].timing.due!) < new Date())
            && (st.cards[i].timing.intervalMinutes < st.settings.reviewCeilingDays*(24*60))
            && (st.cards[i].content.tags.filter((t) => st.settings.inactiveTags.includes(t)).length == 0));
}

function getReview(st: SpacedRepState): string[] {
    return Object.keys(st.cards).filter(
        (i) => (st.cards[i].timing.intervalMinutes > st.settings.reviewCeilingDays*(24*60))
                && (st.cards[i].content.tags.filter((t) => st.settings.inactiveTags.includes(t)).length == 0));
}

function pickSpacedRepCard(st: SpacedRepState): SpacedRepCardData {
    var inds = Object.keys(st.cards);
    var newInds = getNew(st);
    var dueInds = getDue(st);
    var reviewInds = getReview(st);
    switch (st.settings.studying) {
        case SpacedRepStudying.NewCards:
            if (newInds.length == 0) {
                return { content: undefined, cardsLeft: 0, isReview: false, isPractice: false };
            }
            var newInd = newInds[Math.floor(Math.random() * newInds.length)];
            return { 
                content: st.cards[newInd].content, 
                cardsLeft: newInds.length,
                isReview: false,
                isPractice: st.settings.practiceMode
            };
        case SpacedRepStudying.DueCards:
            if (dueInds.length == 0) {
                return { content: undefined, cardsLeft: 0, isReview: false, isPractice: false };
            } else if (reviewInds.length > 0 && Math.random() < st.settings.probReview) {
                var reviewInd = reviewInds[Math.floor(Math.random() * reviewInds.length)];
                return {
                    content: st.cards[reviewInd].content,
                    cardsLeft: dueInds.length,
                    isReview: true,
                    isPractice: st.settings.practiceMode
                };
            }
            var dueInd = dueInds[Math.floor(Math.random() * dueInds.length)];
            return { 
                content: st.cards[dueInd].content, 
                cardsLeft: dueInds.length,
                isReview: false,
                isPractice: st.settings.practiceMode
            };
    }
    return { content: undefined, cardsLeft: 0, isReview: false, isPractice: false };
}

class SpacedRepGen extends FlashcardGen<SpacedRepState, SpacedRepCardData> {
    getGenName() { return "spaced-repetition-generator"; }

    getNextCard(state: SpacedRepState): SpacedRepCardData {
        var cardData = pickSpacedRepCard(state);
        if (cardData.content != undefined) {
            cardData.content = this.applyRandomTemplating(cardData.content);
        }
        return cardData;
    }

    updateState(state: SpacedRepState, cardData: SpacedRepCardData, result: FlashcardResult): SpacedRepState {
        if (result == FlashcardResult.Unanswered || state.settings.practiceMode)
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

    applyRandomTemplating(data: SpacedRepCardContent): SpacedRepCardContent {
        var subData = randomizeStringSub(data.prompt);
        var prompt = subData[0];
        var rands = subData[1];

        var answers: string[] = [];
        for (var i in data.answers) {
            subData = randomizeStringSub(data.answers[i], rands);
            var ans = subData[0];
            rands = subData[1];
            answers.push(ans);
        }

        return {
            guid: data.guid,
            prompt: prompt,
            answers: answers,
            tags: data.tags
        }       
    }

    checkAnswer(answer: string, st: SpacedRepState, cardData: SpacedRepCardData) {
        var tf = (s: string) => applyTextFilter(s, st.settings.filterSettings);
        if (cardData.content === undefined) return false;
        else {
            return cardData.content.answers.map(tf).includes(tf(answer));
        }
    }

    generateCard(data: SpacedRepCardData): Flashcard {
        var a = document.createElement("a");
        var prompt = "No cards left to study.";
        var hint = "You cannot continue studying until more cards become due.";

        if (data.content !== undefined) {
            // var tplContent = this.applyRandomTemplating(data.content);
            prompt = data.content.prompt; // tplContent.prompt;
            hint = data.content.answers[0]; // tplContent.answers[0];
        }

        var fontSize = 100.0/(10.0*Math.log(10+prompt.length));
        a.style.fontSize = `${fontSize}vw`;
        a.textContent = prompt;       

        var fl = new Flashcard(a, hint);

        if (data.isReview) {
            fl.el.style.backgroundColor = "#eeeeff";
        }

        var cardsLeft = document.createElement("span");
        cardsLeft.classList.add("cards-left-span");
        if (data.isPractice) {
            cardsLeft.textContent = "This is a practice card. It will not affect your progress.";
            fl.el.style.backgroundColor = "#ffffee";
        } else {
            cardsLeft.textContent = `${data.cardsLeft} cards remaining`;
        }
        fl.el.appendChild(cardsLeft);

        return fl;
    }

    correctEffect(st: SpacedRepState, c: SpacedRepCardData, attempt: string, resolve: () => void) {
        if (st.settings.readCorrectAnswers) {
            var ss = st.settings.speechSettings;
            if (attempt.length > 0) {
                utter(attempt, ss.voice, ss.rate, ss.pitch, resolve);
            } else {
                utter(c.content!.answers[0], ss.voice, ss.rate, ss.pitch, resolve);
            }
        } else {
            resolve();
        }
    }

    repairDeckState(st: any) {
        if (st.settings.practiceMode == null)
            st.settings.practiceMode = false;
        if (st.settings.inactiveTags == null)
            st.settings.inactiveTags = [];

        Object.keys(st.cards).map((k) => {
            var c = st.cards[k];
            if (c.content.tags == null)
                c.content.tags = [];
            st.cards[k] = c;
        });

        return st;
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
    var practiceModeEditor = boolEditor("Just practicing?", st.settings.practiceMode);
    var initHoursEditor = scrollNumberEditor("Initial interval (hours): ", conf.initialHours, 1, 240, 1);
    var reviewsEditor = scrollNumberEditor("Probability of getting review cards: ", conf.probReview, 0, 0.5, 0.01);

    var correctFactor = scrollNumberEditor("Correct factor: ", conf.correctFactor, 1, 10, 0.1);
    var incorrectFactor = scrollNumberEditor("Incorrect factor: ", conf.incorrectFactor, 0, 1, 0.01);

    var speechCheckbox = boolEditor("Speak correct answers using text-to-speech?", st.settings.readCorrectAnswers);
    var speechEditor = speechSettingsEditor(st.settings.speechSettings);
    var speechDiv = document.createElement("div");
    speechDiv.appendChild(speechCheckbox.element);
    speechDiv.appendChild(speechEditor.element);

    var omitTagsEditor = singleTextFieldEditor(st.settings.inactiveTags.join(','));
    (<HTMLInputElement>omitTagsEditor.element).placeholder = "comma-separated tags...";
    var omitTagsCont = document.createElement("div");
    omitTagsCont.textContent = "Omit cards with the following tags: "
    omitTagsCont.appendChild(omitTagsEditor.element);

    var filterEditor = textFilterSelectionMenu(st.settings.filterSettings);

    [
        studyingNewEditor.element,
        practiceModeEditor.element,
        initHoursEditor.element,
        reviewsEditor.element,
        correctFactor.element,
        incorrectFactor.element,
        omitTagsCont,
        speechDiv,
        filterEditor.element
    ].map((el) => el.classList.add("deck-menu-submenu"))

    function makeCardEditor(c: SpacedRepCard): StateEditor<SpacedRepCard> {
        var ed = combineEditors(
            [[c.content.prompt, c.content.answers.join('|')], c.content.tags.join(',')],
            (pr: any) => { 
                var ed2 = makeSwappingEditor(pr); 
                ed2.element.style.display = "inline-block";
                return ed2;
            },
            (ts: string) => {
                var ed2 = singleTextFieldEditor(ts);
                (<HTMLInputElement>ed2.element).placeholder = "tags...";
                return ed2;
            }
        );
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
                        prompt: tp[0][0],
                        answers: tp[0][1].split('|'),
                        tags: tp[1].split(',').filter((t) => t.length > 0)
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
    cardsEditor.element.classList.add("deck-menu-submenu");

    var components = [
        totP,
        newP,
        dueP,
        reviewP,
        studyingNewEditor.element,
        practiceModeEditor.element,
        initHoursEditor.element,
        correctFactor.element,
        incorrectFactor.element,
        reviewsEditor.element,
        omitTagsCont,
        speechDiv,
        filterEditor.element,
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
                practiceMode: practiceModeEditor.menuToState(),
                reviewCeilingDays: st.settings.reviewCeilingDays,
                probReview: reviewsEditor.menuToState(),
                order: SpacedRepOrder.RandomOrder,
                readCorrectAnswers: speechCheckbox.menuToState(),
                speechSettings: speechEditor.menuToState(),
                filterSettings: filterEditor.menuToState(),
                inactiveTags: omitTagsEditor.menuToState().split(',')
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
