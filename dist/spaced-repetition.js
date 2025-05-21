"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const flashcard_1 = require("./flashcard");
const flashcard_generator_1 = require("./flashcard-generator");
const flashcard_deck_1 = require("./flashcard-deck");
const speech_1 = require("./speech");
const text_filters_1 = require("./text-filters");
const editor_1 = require("./editor");
const random_templating_1 = require("./random-templating");
var SpacedRepCardStatus;
(function (SpacedRepCardStatus) {
    SpacedRepCardStatus[SpacedRepCardStatus["CardNew"] = 1] = "CardNew";
    SpacedRepCardStatus[SpacedRepCardStatus["CardStudying"] = 2] = "CardStudying";
    SpacedRepCardStatus[SpacedRepCardStatus["CardReview"] = 3] = "CardReview";
})(SpacedRepCardStatus || (SpacedRepCardStatus = {}));
var SpacedRepStudying;
(function (SpacedRepStudying) {
    SpacedRepStudying[SpacedRepStudying["NewCards"] = 0] = "NewCards";
    SpacedRepStudying[SpacedRepStudying["DueCards"] = 1] = "DueCards";
})(SpacedRepStudying || (SpacedRepStudying = {}));
var SpacedRepOrder;
(function (SpacedRepOrder) {
    SpacedRepOrder[SpacedRepOrder["RandomOrder"] = 1] = "RandomOrder";
    SpacedRepOrder[SpacedRepOrder["ReviewFirst"] = 2] = "ReviewFirst";
    SpacedRepOrder[SpacedRepOrder["NewFirst"] = 3] = "NewFirst";
})(SpacedRepOrder || (SpacedRepOrder = {}));
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
    speechSettings: (0, speech_1.defaultSpeechSettings)(),
    filterSettings: text_filters_1.defaultTextFilterSettings
};
function defaultCardTiming() {
    return {
        due: null,
        intervalMinutes: 0,
        status: SpacedRepCardStatus.CardNew,
        streak: 0
    };
}
function makeSpacedRepCardDict(cardDat) {
    var cardDict = {};
    for (var i in cardDat) {
        var c = cardDat[i];
        cardDict[c.guid] = { content: c, timing: defaultCardTiming() };
    }
    return cardDict;
}
const defaultSpacedRepState = {
    cards: makeSpacedRepCardDict([
        { guid: (0, utils_1.guidGenerator)(), prompt: "apple", answers: ["manzana"] },
        { guid: (0, utils_1.guidGenerator)(), prompt: "banana", answers: ["plátano"] },
        { guid: (0, utils_1.guidGenerator)(), prompt: "orange", answers: ["naranja"] },
        { guid: (0, utils_1.guidGenerator)(), prompt: "I have {r0:an apple,a banana,an orange}", answers: ["tengo {r0:una manzana,un plátano,una naranja}"] },
        { guid: (0, utils_1.guidGenerator)(), prompt: "{r0:I want,you want,he wants} {r1:an apple,a banana,an orange}", answers: ["{r0:quiero,quieres,quiere} {r1:una manzana,un plátano,una naranja}"] },
    ]),
    settings: defaultSpacedRepSettings,
    history: []
};
function makeSpacedRepCard(prompt, answers) {
    var guid = (0, utils_1.guidGenerator)();
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
    };
}
function getNew(st) {
    return Object.keys(st.cards).filter((i) => st.cards[i].timing.due == null);
}
function getDue(st) {
    return Object.keys(st.cards).filter((i) => st.cards[i].timing.due != null
        && (new Date(st.cards[i].timing.due) < new Date())
        && (st.cards[i].timing.intervalMinutes < st.settings.reviewCeilingDays * (24 * 60)));
}
function getReview(st) {
    return Object.keys(st.cards).filter((i) => st.cards[i].timing.intervalMinutes > st.settings.reviewCeilingDays * (24 * 60));
}
function pickSpacedRepCard(st) {
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
            }
            else if (reviewInds.length > 0 && Math.random() < st.settings.probReview) {
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
class SpacedRepGen extends flashcard_generator_1.FlashcardGen {
    getGenName() { return "spaced-repetition-generator"; }
    getNextCard(state) {
        var cardData = pickSpacedRepCard(state);
        if (cardData.content != undefined) {
            cardData.content = this.applyRandomTemplating(cardData.content);
        }
        return cardData;
    }
    updateState(state, cardData, result) {
        if (result == flashcard_generator_1.FlashcardResult.Unanswered || state.settings.practiceMode)
            return state;
        var correct = (result == flashcard_generator_1.FlashcardResult.Correct);
        var cardState = state.cards[cardData.content.guid];
        var dueDate = cardState.timing.due;
        if (correct) {
            cardState.timing.intervalMinutes
                = cardState.timing.intervalMinutes * state.settings.correctFactor;
            cardState.timing.streak += 1;
        }
        else {
            cardState.timing.intervalMinutes
                = cardState.timing.intervalMinutes * state.settings.incorrectFactor;
            cardState.timing.streak = 0;
        }
        if (cardState.timing.due === null) {
            if (cardState.timing.streak >= 3) {
                cardState.timing.intervalMinutes = state.settings.initialHours * 60;
                cardState.timing.due = new Date();
                cardState.timing.due
                    .setHours(cardState.timing.due.getHours() + cardState.timing.intervalMinutes / 60);
            }
        }
        else if (correct) {
            cardState.timing.due = new Date();
            cardState.timing.due
                .setHours(cardState.timing.due.getHours() + cardState.timing.intervalMinutes / 60);
        }
        cardState.timing.due = JSON.parse(JSON.stringify(cardState.timing.due));
        state.cards[cardData.content.guid] = cardState;
        state.history.push({
            guid: cardData.content.guid,
            answered: new Date(),
            timing: state.cards[cardData.content.guid].timing,
            correct: correct,
            answerSeconds: 0
        });
        return state;
    }
    applyRandomTemplating(data) {
        var subData = (0, random_templating_1.randomizeStringSub)(data.prompt);
        var prompt = subData[0];
        var rands = subData[1];
        var answers = [];
        for (var i in data.answers) {
            subData = (0, random_templating_1.randomizeStringSub)(data.answers[i], rands);
            var ans = subData[0];
            rands = subData[1];
            answers.push(ans);
        }
        return {
            guid: data.guid,
            prompt: prompt,
            answers: answers
        };
    }
    checkAnswer(answer, st, cardData) {
        var tf = (s) => (0, text_filters_1.applyTextFilter)(s, st.settings.filterSettings);
        if (cardData.content === undefined)
            return false;
        else {
            return cardData.content.answers.map(tf).includes(tf(answer));
        }
    }
    generateCard(data) {
        var a = document.createElement("a");
        var prompt = "No cards left to study.";
        var hint = "You cannot continue studying until more cards become due.";
        if (data.content !== undefined) {
            // var tplContent = this.applyRandomTemplating(data.content);
            prompt = data.content.prompt; // tplContent.prompt;
            hint = data.content.answers[0]; // tplContent.answers[0];
        }
        var fontSize = 100.0 / (10.0 * Math.log(10 + prompt.length));
        a.style.fontSize = `${fontSize}vw`;
        a.textContent = prompt;
        var fl = new flashcard_1.Flashcard(a, hint);
        if (data.isReview) {
            fl.el.style.backgroundColor = "#eeeeff";
        }
        var cardsLeft = document.createElement("span");
        cardsLeft.classList.add("cards-left-span");
        if (data.isPractice) {
            cardsLeft.textContent = "This is a practice card. It will not affect your progress.";
            fl.el.style.backgroundColor = "#ffffee";
        }
        else {
            cardsLeft.textContent = `${data.cardsLeft} cards remaining`;
        }
        fl.el.appendChild(cardsLeft);
        return fl;
    }
    correctEffect(st, c, attempt, resolve) {
        if (st.settings.readCorrectAnswers) {
            var ss = st.settings.speechSettings;
            if (attempt.length > 0) {
                (0, speech_1.utter)(attempt, ss.voice, ss.rate, ss.pitch, resolve);
            }
            else {
                (0, speech_1.utter)(c.content.answers[0], ss.voice, ss.rate, ss.pitch, resolve);
            }
        }
        else {
            resolve();
        }
    }
    repairDeckState(st) {
        if (st.settings.practiceMode == null)
            st.settings.practiceMode = false;
        return st;
    }
}
function spacedRepMenu(st) {
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
    var studyingNewEditor = (0, editor_1.boolEditor)("Studying new cards?", st.settings.studying === SpacedRepStudying.NewCards);
    var practiceModeEditor = (0, editor_1.boolEditor)("Just practicing?", st.settings.practiceMode);
    var initHoursEditor = (0, editor_1.scrollNumberEditor)("Initial interval (hours): ", conf.initialHours, 1, 240, 1);
    var reviewsEditor = (0, editor_1.scrollNumberEditor)("Probability of getting review cards: ", conf.probReview, 0, 0.5, 0.01);
    var correctFactor = (0, editor_1.scrollNumberEditor)("Correct factor: ", conf.correctFactor, 1, 10, 0.1);
    var incorrectFactor = (0, editor_1.scrollNumberEditor)("Incorrect factor: ", conf.incorrectFactor, 0, 1, 0.01);
    var speechCheckbox = (0, editor_1.boolEditor)("Speak correct answers using text-to-speech?", st.settings.readCorrectAnswers);
    var speechEditor = (0, speech_1.speechSettingsEditor)(st.settings.speechSettings);
    var speechDiv = document.createElement("div");
    speechDiv.appendChild(speechCheckbox.element);
    speechDiv.appendChild(speechEditor.element);
    var filterEditor = (0, text_filters_1.textFilterSelectionMenu)(st.settings.filterSettings);
    [
        studyingNewEditor.element,
        practiceModeEditor.element,
        initHoursEditor.element,
        reviewsEditor.element,
        correctFactor.element,
        incorrectFactor.element,
        speechDiv,
        filterEditor.element
    ].map((el) => el.classList.add("deck-menu-submenu"));
    function makeCardEditor(c) {
        var ed = (0, editor_1.makeSwappingEditor)([c.content.prompt, c.content.answers.join('|')]);
        var cardInfo = document.createElement("a");
        cardInfo.style.color = "lightgray";
        cardInfo.style.marginLeft = "10px";
        cardInfo.style.marginRight = "10px";
        cardInfo.style.verticalAlign = "middle";
        if (c.timing.due === null) {
            cardInfo.textContent = "not studied";
        }
        else {
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
                };
            }
        };
    }
    ;
    var cardsEditor = (0, editor_1.multipleEditors)(Object.values(st.cards), () => makeSpacedRepCard("", []), makeCardEditor, true, (s, cd) => cd.content.prompt.includes(s) || cd.content.answers.some((a) => a.includes(s)));
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
        speechDiv,
        filterEditor.element,
        cardsEditor.element,
    ];
    components.map((el) => contDiv.appendChild(el));
    return {
        element: contDiv,
        menuToState: () => {
            return {
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
                    filterSettings: filterEditor.menuToState()
                },
                cards: (0, utils_1.makeDict)(cardsEditor.menuToState(), (c) => c.content.guid),
                history: st.history
            };
        }
    };
}
(0, flashcard_deck_1.registerDeckType)(new SpacedRepGen(), spacedRepMenu, "spaced-repetition-deck", "Spaced repetition deck", defaultSpacedRepState, "#ffffdd");
