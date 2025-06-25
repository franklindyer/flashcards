"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleSpacedRepGen = exports.defaultSimpleSRState = exports.defaultSimpleSRSettings = void 0;
exports.makeEmptyCard = makeEmptyCard;
const utils_1 = require("./utils");
const flashcard_1 = require("./flashcard");
const flashcard_generator_1 = require("./flashcard-generator");
const spaced_repetition_general_1 = require("./spaced-repetition-general");
const speech_1 = require("./speech");
const text_filters_1 = require("./text-filters");
const editor_1 = require("./editor");
const flashcard_deck_1 = require("./flashcard-deck");
exports.defaultSimpleSRSettings = {
    initialHours: 6,
    correctFactor: 1.6,
    incorrectFactor: 0.5,
    inactiveTags: [],
    readCorrectAnswers: false,
    speechSettings: (0, speech_1.defaultSpeechSettings)(),
    filterSettings: text_filters_1.defaultTextFilterSettings
};
exports.defaultSimpleSRState = {
    cards: (0, spaced_repetition_general_1.makeSpacedRepCardDict)([
        { prompt: "the dog", answers: ["le chien"], tags: [] },
        { prompt: "the man", answers: ["l'homme"], tags: [] },
        { prompt: "the woman", answers: ["la dame"], tags: [] }
    ], () => { return { streak: 0, intervalMinutes: 0, due: undefined }; }),
    newIndex: 0,
    newQueue: [],
    newQueueSize: 10,
    studying: spaced_repetition_general_1.SpacedRepStudying.NewCards,
    settings: exports.defaultSimpleSRSettings
};
function makeEmptyCard() {
    return {
        guid: (0, utils_1.guidGenerator)(),
        content: {
            prompt: "",
            answers: [""],
            tags: []
        },
        due: new Date(),
        intervalMinutes: 0,
        auxdata: {
            streak: 0
        }
    };
}
class SimpleSpacedRepGen extends spaced_repetition_general_1.AbstractSpacedRepGen {
    getGenName() { return "simple-spaced-repetition"; }
    updateInterval(card, settings, correct) {
        var cardData = card.data;
        if (correct == flashcard_generator_1.FlashcardResult.Correct) {
            if (cardData.intervalMinutes == 0 && cardData.auxdata.streak >= 3) {
                return settings.initialHours * 60;
            }
            else if (cardData.intervalMinutes != 0) {
                return cardData.intervalMinutes * settings.correctFactor;
            }
            else {
                return 0;
            }
        }
        else if (correct == flashcard_generator_1.FlashcardResult.Incorrect && cardData.intervalMinutes > 0) {
            return cardData.intervalMinutes * settings.incorrectFactor;
        }
        else {
            return cardData.intervalMinutes;
        }
    }
    updateAuxData(card, settings, correct) {
        if (correct == flashcard_generator_1.FlashcardResult.Correct) {
            card.data.auxdata.streak += 1;
        }
        else if (correct == flashcard_generator_1.FlashcardResult.Incorrect) {
            card.data.auxdata.streak = 0;
        }
        return card.data.auxdata;
    }
    repairDeckState(st) {
        return st;
    }
    generateCard(card) {
        var a = document.createElement("a");
        var prompt = "No cards left to study.";
        var hint = "You cannot continue studying until more cards become due.";
        if (card.data !== undefined) {
            prompt = card.data.content.prompt;
            hint = card.data.content.answers[0];
        }
        var fontSize = 100.0 / (10.0 * Math.log(10 + prompt.length));
        a.style.fontSize = `${fontSize}vw`;
        a.textContent = prompt;
        var fl = new flashcard_1.Flashcard(a, hint);
        var infoText = document.createElement("span");
        infoText.classList.add("cards-left-span");
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
exports.SimpleSpacedRepGen = SimpleSpacedRepGen;
function simpleSRMenu(st) {
    var contDiv = document.createElement("div");
    var totP = document.createElement("p");
    totP.textContent = `Total cards: ${Object.keys(st.cards).length}`;
    totP.style.color = "#666666";
    totP.style.fontWeight = "bold";
    var newP = document.createElement("p");
    newP.textContent = `New cards: ${Object.keys(st.cards).filter((i) => st.cards[i].intervalMinutes == 0).length}`;
    newP.style.color = "#9999ee";
    newP.style.fontWeight = "bold";
    var dueP = document.createElement("p");
    dueP.textContent = `Due cards: ${Object.keys(st.cards).filter((i) => st.cards[i].intervalMinutes > 0 && new Date(st.cards[i].due) < new Date()).length}`;
    dueP.style.color = "#ee9999";
    dueP.style.fontWeight = "bold";
    var studyingEditor = (0, editor_1.radioEditor)(st.studying, [spaced_repetition_general_1.SpacedRepStudying.NewCards, spaced_repetition_general_1.SpacedRepStudying.DueCards, spaced_repetition_general_1.SpacedRepStudying.RandomCards], ["Study new cards", "Study due cards", "Practice random cards"]);
    var settings = st.settings;
    var initHoursEditor = (0, editor_1.scrollNumberEditor)("Initial interval (hours): ", settings.initialHours, 1, 240, 1);
    var newQueueSizeEditor = (0, editor_1.scrollNumberEditor)("Max new cards to study at once: ", st.newQueueSize, 1, 100, 1);
    var correctFactor = (0, editor_1.scrollNumberEditor)("Correct factor: ", settings.correctFactor, 1, 10, 0.1);
    var incorrectFactor = (0, editor_1.scrollNumberEditor)("Incorrect factor: ", settings.incorrectFactor, 0, 1.0, 0.01);
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
        initHoursEditor.element,
        correctFactor.element,
        incorrectFactor.element,
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
        if (c.intervalMinutes == 0) {
            cardInfo.textContent = "not studied";
        }
        else {
            cardInfo.textContent = `due ${c.due.toLocaleString().split('T')[0]}`;
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
                    due: c.due,
                    intervalMinutes: c.intervalMinutes,
                    auxdata: c.auxdata
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
        initHoursEditor.element,
        correctFactor.element,
        incorrectFactor.element,
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
                    correctFactor: correctFactor.menuToState(),
                    incorrectFactor: incorrectFactor.menuToState(),
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
(0, flashcard_deck_1.registerDeckType)(new SimpleSpacedRepGen(), simpleSRMenu, "simple-spaced-repetition-deck", "Simple spaced repetition deck", exports.defaultSimpleSRState, "#ffffdd");
