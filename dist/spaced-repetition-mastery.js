"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MasterSpacedRepGen = void 0;
const utils_1 = require("./utils");
const flashcard_1 = require("./flashcard");
const flashcard_generator_1 = require("./flashcard-generator");
const spaced_repetition_general_1 = require("./spaced-repetition-general");
const speech_1 = require("./speech");
const text_filters_1 = require("./text-filters");
const editor_1 = require("./editor");
const flashcard_deck_1 = require("./flashcard-deck");
const defaultMasterSRSettings = {
    initialHours: 6,
    correctMaxFactor: 5.0,
    correctMinFactor: 1.1,
    incorrectMaxFactor: 0.5,
    incorrectMinFactor: 0.1,
    punishmentExponent: 1.5,
    initialMastery: 0.5,
    masteryDeficitHalflife: 3,
    inactiveTags: [],
    readCorrectAnswers: false,
    speechSettings: (0, speech_1.defaultSpeechSettings)(),
    filterSettings: text_filters_1.defaultTextFilterSettings
};
const defaultMasterSRState = {
    cards: (0, spaced_repetition_general_1.makeSpacedRepCardDict)([
        { prompt: "the dog", answers: ["le chien"], tags: [] },
        { prompt: "the man", answers: ["l'homme"], tags: [] },
        { prompt: "the woman", answers: ["la dame"], tags: [] }
    ], () => { return { streak: 0, intervalMinutes: 0, due: undefined, numCorrect: 0, numIncorrect: 0, mastery: 0.5 }; }),
    newIndex: 0,
    newQueue: [],
    newQueueSize: 10,
    studying: spaced_repetition_general_1.SpacedRepStudying.NewCards,
    settings: defaultMasterSRSettings
};
function makeEmptyCard() {
    return {
        guid: (0, utils_1.guidGenerator)(),
        content: {
            prompt: "",
            answers: [""],
            tags: []
        },
        timing: {
            streak: 0,
            intervalMinutes: 0,
            numCorrect: 0,
            numIncorrect: 0,
            mastery: 0.5,
            due: undefined
        }
    };
}
function calculateMasteryCoef(settings, card) {
    var c = card.timing.numCorrect;
    var d = card.timing.numIncorrect;
    var k = settings.masteryDeficitHalflife;
    var p = settings.initialMastery;
    var alpha = settings.punishmentExponent;
    return (c + p * k) / (c + Math.pow(d, alpha) + k);
}
class MasterSpacedRepGen extends spaced_repetition_general_1.AbstractSpacedRepGen {
    getGenName() { return "simple-spaced-repetition"; }
    cardIsDue(card) {
        return (card.timing.due != undefined) && (new Date(card.timing.due) < new Date());
    }
    cardIsNew(card) {
        return card.timing.due == undefined;
    }
    updateCard(settings, card, correct) {
        var cardData = card.data;
        var isNew = cardData.timing.due === undefined;
        if (card.context.isPractice) {
            return cardData;
        }
        var mastery = calculateMasteryCoef(settings, card.data);
        cardData.timing.mastery = mastery;
        if (correct == flashcard_generator_1.FlashcardResult.Correct) {
            cardData.timing.streak += 1;
            cardData.timing.numCorrect += 1;
            if (isNew && cardData.timing.streak >= 3) {
                cardData.timing.intervalMinutes = settings.initialHours * 60;
                cardData.timing.due = new Date();
                cardData.timing.due.setHours(cardData.timing.due.getHours() + cardData.timing.intervalMinutes / 60);
            }
            else if (!isNew) {
                var factor = settings.correctMinFactor + (settings.correctMaxFactor - settings.correctMinFactor) * mastery;
                cardData.timing.intervalMinutes = factor * cardData.timing.intervalMinutes;
            }
        }
        else if (correct == flashcard_generator_1.FlashcardResult.Incorrect) {
            cardData.timing.streak = 0;
            cardData.timing.numIncorrect += 1;
            if (!isNew) {
                var factor = settings.incorrectMinFactor + (settings.incorrectMaxFactor - settings.correctMinFactor) * mastery;
                cardData.timing.intervalMinutes = factor * cardData.timing.intervalMinutes;
            }
        }
        // Reschedule card if it came due
        if (!isNew) {
            cardData.timing.due = new Date();
            cardData.timing.due.setHours(cardData.timing.due.getHours() + cardData.timing.intervalMinutes / 60);
        }
        return cardData;
    }
    repairDeckState(st) {
        return st;
    }
    generateCard(card) {
        var a = document.createElement("a");
        var prompt = "No cards left to study.";
        var hint = "You cannot continue studying until more cards become due.";
        var masteryColor = "white";
        if (card.data !== undefined) {
            prompt = card.data.content.prompt;
            hint = card.data.content.answers[0];
            var masteryColorParam = Math.floor(50 * card.data.timing.mastery);
            masteryColor = `rgb(${255 - masteryColorParam},${205 + masteryColorParam},200)`;
        }
        var fontSize = 100.0 / (10.0 * Math.log(10 + prompt.length));
        a.style.fontSize = `${fontSize}vw`;
        a.textContent = prompt;
        var fl = new flashcard_1.Flashcard(a, hint);
        var infoText = document.createElement("span");
        infoText.classList.add("cards-left-span");
        infoText.style.backgroundColor = masteryColor;
        if (card.context.isPractice) {
            infoText.textContent = "This is a practice card. It will not affect your progress.";
            fl.el.style.backgroundColor = "#ffffee";
        }
        else {
            infoText.textContent = `${card.context.cardsLeft} cards remaining`;
        }
        fl.el.appendChild(infoText);
        return fl;
    }
    checkAnswer(answer, st, card) {
        if (card.data === undefined)
            return false;
        var cardData = card.data;
        var tf = (s) => (0, text_filters_1.applyTextFilter)(s, st.settings.filterSettings);
        return cardData.content.answers.map(tf).includes(tf(answer));
    }
    correctEffect(st, card, attempt, resolve) {
        var cardData = card.data;
        if (st.settings.readCorrectAnswers) {
            var ss = st.settings.speechSettings;
            if (attempt.length > 0) {
                (0, speech_1.utter)(attempt, ss.voice, ss.rate, ss.pitch, resolve);
            }
            else {
                (0, speech_1.utter)(cardData.content.answers[0], ss.voice, ss.rate, ss.pitch, resolve);
            }
        }
        else {
            resolve();
        }
    }
}
exports.MasterSpacedRepGen = MasterSpacedRepGen;
function simpleSRMenu(st) {
    var contDiv = document.createElement("div");
    var totP = document.createElement("p");
    totP.textContent = `Total cards: ${Object.keys(st.cards).length}`;
    totP.style.color = "#666666";
    totP.style.fontWeight = "bold";
    var newP = document.createElement("p");
    newP.textContent = `New cards: ${Object.keys(st.cards).filter((i) => st.cards[i].timing.due == undefined).length}`;
    newP.style.color = "#9999ee";
    newP.style.fontWeight = "bold";
    var dueP = document.createElement("p");
    dueP.textContent = `Due cards: ${Object.keys(st.cards).filter((i) => st.cards[i].timing.due !== undefined).length}`;
    dueP.style.color = "#ee9999";
    dueP.style.fontWeight = "bold";
    var studyingEditor = (0, editor_1.radioEditor)(st.studying, [spaced_repetition_general_1.SpacedRepStudying.NewCards, spaced_repetition_general_1.SpacedRepStudying.DueCards, spaced_repetition_general_1.SpacedRepStudying.RandomCards], ["Study new cards", "Study due cards", "Practice random cards"]);
    var settings = st.settings;
    var initHoursEditor = (0, editor_1.scrollNumberEditor)("Initial interval (hours): ", settings.initialHours, 1, 240, 1);
    var newQueueSizeEditor = (0, editor_1.scrollNumberEditor)("Max new cards to study at once: ", st.newQueueSize, 1, 100, 1);
    var correctMaxEditor = (0, editor_1.scrollNumberEditor)("Max correct factor: ", settings.correctMaxFactor, 1, 10, 0.1);
    var correctMinEditor = (0, editor_1.scrollNumberEditor)("Min correct factor: ", settings.correctMinFactor, 1, 10, 0.1);
    var incorrectMaxEditor = (0, editor_1.scrollNumberEditor)("Max incorrect factor: ", settings.incorrectMaxFactor, 0.1, 0.9, 0.01);
    var incorrectMinEditor = (0, editor_1.scrollNumberEditor)("Min incorrect factor: ", settings.incorrectMinFactor, 0.1, 0.9, 0.01);
    var punishmentEditor = (0, editor_1.scrollNumberEditor)("Punishment exponent: ", settings.punishmentExponent, 1.0, 5.0, 0.1);
    var initialMasteryEditor = (0, editor_1.scrollNumberEditor)("Initial mastery value: ", settings.initialMastery, 0.0, 1.0, 0.01);
    var halflifeEditor = (0, editor_1.scrollNumberEditor)("Number of correct answers to halve initial mastery deficit: ", settings.masteryDeficitHalflife, 1, 50, 1);
    var paramsDiv = document.createElement("div");
    [
        initHoursEditor,
        correctMaxEditor,
        correctMinEditor,
        incorrectMaxEditor,
        incorrectMinEditor,
        punishmentEditor,
        initialMasteryEditor,
        halflifeEditor
    ].map((ed2) => paramsDiv.appendChild(ed2.element));
    var speechCheckbox = (0, editor_1.boolEditor)("Speak correct answers using text-to-speech?", settings.readCorrectAnswers);
    var speechEditor = (0, speech_1.speechSettingsEditor)(settings.speechSettings);
    var speechDiv = document.createElement("div");
    speechDiv.appendChild(speechCheckbox.element);
    speechDiv.appendChild(speechEditor.element);
    var omitTagsEditor = (0, editor_1.singleTextFieldEditor)(settings.inactiveTags.join(','));
    omitTagsEditor.element.placeholder = "comma-separated tags...";
    var omitTagsCont = document.createElement("div");
    omitTagsCont.textContent = "Omit cards with the following tags: ";
    omitTagsCont.appendChild(omitTagsEditor.element);
    var filterEditor = (0, text_filters_1.textFilterSelectionMenu)(settings.filterSettings);
    [
        studyingEditor.element,
        paramsDiv,
        newQueueSizeEditor.element,
        omitTagsCont,
        speechDiv,
        filterEditor.element
    ].map((el) => el.classList.add("deck-menu-submenu"));
    function makeCardEditor(c) {
        var ed = (0, editor_1.combineEditors)([[c.content.prompt, c.content.answers.join('|')], c.content.tags.join(',')], (pr) => {
            var ed2 = (0, editor_1.swappingTextEditor)(pr);
            ed2.element.style.display = "inline-block";
            return ed2;
        }, (ts) => {
            var ed2 = (0, editor_1.singleTextFieldEditor)(ts);
            ed2.element.placeholder = "tags...";
            return ed2;
        });
        var cardInfo = document.createElement("a");
        cardInfo.style.color = "lightgray";
        cardInfo.style.marginLeft = "10px";
        cardInfo.style.marginRight = "10px";
        cardInfo.style.verticalAlign = "middle";
        if (c.timing.due === undefined) {
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
                    guid: c.guid,
                    content: {
                        prompt: tp[0][0],
                        answers: tp[0][1].split('|'),
                        tags: tp[1].split(',').filter((t) => t.length > 0)
                    },
                    timing: c.timing
                };
            }
        };
    }
    ;
    var cardsEditor = (0, editor_1.multipleEditors)(Object.values(st.cards), () => makeEmptyCard(), makeCardEditor, true, (s, cd) => cd.content.prompt.includes(s) || cd.content.answers.some((a) => a.includes(s)));
    var cardsEditorTitle = document.createElement("h3");
    cardsEditorTitle.textContent = "Cards";
    cardsEditor.element.prepend(cardsEditorTitle);
    cardsEditor.element.classList.add("deck-menu-submenu");
    var components = [
        totP,
        newP,
        dueP,
        studyingEditor.element,
        paramsDiv,
        newQueueSizeEditor.element,
        omitTagsCont,
        speechDiv,
        filterEditor.element,
        cardsEditor.element,
    ];
    components.map((el) => contDiv.appendChild(el));
    return {
        element: contDiv,
        menuToState: () => {
            return {
                studying: studyingEditor.menuToState(),
                settings: {
                    initialHours: initHoursEditor.menuToState(),
                    correctMaxFactor: correctMaxEditor.menuToState(),
                    correctMinFactor: correctMinEditor.menuToState(),
                    incorrectMaxFactor: incorrectMaxEditor.menuToState(),
                    incorrectMinFactor: incorrectMinEditor.menuToState(),
                    punishmentExponent: punishmentEditor.menuToState(),
                    initialMastery: initialMasteryEditor.menuToState(),
                    masteryDeficitHalflife: halflifeEditor.menuToState(),
                    readCorrectAnswers: speechCheckbox.menuToState(),
                    speechSettings: speechEditor.menuToState(),
                    filterSettings: filterEditor.menuToState(),
                    inactiveTags: omitTagsEditor.menuToState().split(',')
                },
                newQueue: st.newQueue,
                newIndex: st.newIndex,
                newQueueSize: newQueueSizeEditor.menuToState(),
                cards: (0, utils_1.makeDict)(cardsEditor.menuToState(), (c) => c.guid),
            };
        }
    };
}
(0, flashcard_deck_1.registerDeckType)(new MasterSpacedRepGen(), simpleSRMenu, "master--spaced-repetition-deck", "Mastery-based spaced repetition deck", defaultMasterSRState, "#ffffdd");
