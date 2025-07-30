"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleSpacedRepGen = exports.defaultSimpleSRState = exports.defaultSimpleSRSettings = void 0;
exports.makeEmptyCard = makeEmptyCard;
const utils_1 = require("./utils");
const random_templating_1 = require("./random-templating");
const flashcard_1 = require("./flashcard");
const flashcard_generator_1 = require("./flashcard-generator");
const spaced_repetition_general_1 = require("./spaced-repetition-general");
const speech_1 = require("./speech");
const text_filters_1 = require("./text-filters");
const editor_1 = require("./editor");
const shared_sr_menu_components_1 = require("./shared-sr-menu-components");
const flashcard_deck_1 = require("./flashcard-deck");
const spaced_repetition_newqueue_1 = require("./spaced-repetition-newqueue");
exports.defaultSimpleSRSettings = {
    initialHours: 6,
    correctFactor: 1.6,
    incorrectFactor: 0.5,
    inactiveTags: [],
    doTwoSided: true,
    readCorrectAnswers: false,
    speechSettings: (0, speech_1.defaultSpeechSettings)(),
    filterSettings: text_filters_1.defaultTextFilterSettings
};
exports.defaultSimpleSRState = {
    cards: (0, spaced_repetition_general_1.makeSpacedRepCardDict)([
        { prompt: ["the dog"], answers: ["le chien"], tags: [], twoSided: false },
        { prompt: ["the man"], answers: ["l'homme"], tags: [], twoSided: false },
        { prompt: ["the woman"], answers: ["la dame"], tags: [], twoSided: false }
    ], () => { return { streak: 0, intervalMinutes: 0, due: undefined }; }),
    newQ: (0, spaced_repetition_newqueue_1.emptySRQueue)(10),
    studying: spaced_repetition_general_1.SpacedRepStudying.NewCards,
    settings: exports.defaultSimpleSRSettings
};
function makeEmptyCard() {
    return {
        guid: (0, utils_1.guidGenerator)(),
        content: {
            prompt: [""],
            answers: [""],
            tags: [],
            twoSided: false
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
    cardIsEnabled(card, st) {
        return !card.content.tags.some((t) => st.settings.inactiveTags.some((s) => t === s));
    }
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
        if (st.newQ === undefined) {
            st.newQ = (0, spaced_repetition_newqueue_1.emptySRQueue)(10);
        }
        if (st.settings.doTwoSided === undefined) {
            st.settings.doTwoSided = true;
        }
        for (var i in Object.keys(st.cards)) {
            var k = Object.keys(st.cards)[i];
            if (!Object.prototype.toString.call(st.cards[k].content.prompt).includes("Array")) {
                st.cards[k].content.prompt = [st.cards[k].content.prompt];
            }
            if (!("twoSided" in st.cards[k])) {
                st.cards[k]["twoSided"] = false;
            }
        }
        return st;
    }
    applyCardTemplating(card) {
        // Random substitution card templating
        var new_prompt = [];
        var new_answers = [];
        var ctx = {};
        for (var i in Object.keys(card.data.content.prompt)) {
            var res = (0, random_templating_1.randomizeStringSub)(card.data.content.prompt[i], ctx);
            ctx = res[1];
            new_prompt.push(res[0]);
        }
        for (var i in Object.keys(card.data.content.answers)) {
            var res = (0, random_templating_1.randomizeStringSub)(card.data.content.answers[i], ctx);
            ctx = res[1];
            new_answers.push(res[0]);
        }
        card.data.content.prompt = new_prompt;
        card.data.content.answers = new_answers;
        return card;
    }
    nextCardPreprocessing(card, st) {
        // Clone the card so we don't mess with its state in the deck
        var card = JSON.parse(JSON.stringify(card));
        if (card.data !== undefined) {
            card = this.applyCardTemplating(card);
            if (card.data.content.twoSided && st.settings.doTwoSided) {
                card.data.content.reversed = (Math.random() < 0.5);
            }
        }
        return card;
    }
    generateCard(st, card) {
        var a = document.createElement("a");
        var prompt = "No cards left to study.";
        var answers = [];
        var hint = "You cannot continue studying until more cards become due.";
        if (card.data !== undefined) {
            if (card.data.content.reversed) {
                prompt = card.data.content.answers[0];
                answers = card.data.content.prompt;
                hint = card.data.content.prompt[0];
            }
            else {
                prompt = card.data.content.prompt[0];
                answers = card.data.content.answers;
                hint = card.data.content.answers[0];
            }
        }
        var fontSize = 100.0 / (10.0 * Math.log(10 + prompt.length));
        a.style.fontSize = `${fontSize}vw`;
        a.textContent = prompt;
        var fl = new flashcard_1.Flashcard(a, hint);
        if (card.context.isPractice) {
            fl.el.style.backgroundColor = "#ffffee";
        }
        fl.el.appendChild((0, spaced_repetition_general_1.makeCardsLeftSpan)(card));
        return fl;
    }
    checkAnswer(answer, st, card) {
        if (card.data === undefined)
            return false;
        var cardData = card.data;
        var tf = (s) => (0, text_filters_1.applyTextFilter)(s, st.settings.filterSettings);
        // When verifying the answer, check if the card has been reversed
        if (cardData.content.twoSided && cardData.content.reversed)
            return cardData.content.prompt.map(tf).includes(tf(answer));
        else
            return cardData.content.answers.map(tf).includes(tf(answer));
    }
    correctEffect(st, card, attempt, resolve) {
        var cardData = card.data;
        if (st.settings.readCorrectAnswers) {
            var ss = st.settings.speechSettings;
            if (attempt.length > 0 && !(cardData.content.reversed)) {
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
    var infoWidget = (0, shared_sr_menu_components_1.infoWidgetSR)(st);
    var studyingEditor = (0, shared_sr_menu_components_1.studyingEditorSR)(st);
    var settings = st.settings;
    var initHoursEditor = (0, editor_1.scrollNumberEditor)("Initial interval (hours): ", settings.initialHours, 1, 240, 1);
    var newQueueSizeEditor = (0, editor_1.scrollNumberEditor)("Max new cards to study at once: ", st.newQ.maxNewCards, 1, 100, 1);
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
    var twoSidedEditor = (0, editor_1.boolEditor)("Study both sides of two-sided cards?", settings.doTwoSided);
    var twoSidedCont = document.createElement("div");
    twoSidedCont.appendChild(twoSidedEditor.element);
    var filterEditor = (0, text_filters_1.textFilterSelectionMenu)(settings.filterSettings);
    [
        studyingEditor.element,
        initHoursEditor.element,
        correctFactor.element,
        incorrectFactor.element,
        newQueueSizeEditor.element,
        omitTagsCont,
        twoSidedCont,
        speechDiv,
        filterEditor.element
    ].map((el) => el.classList.add("deck-menu-submenu"));
    function makeCardEditor(c) {
        var edDetails = document.createElement("details");
        var edSummary = document.createElement("summary");
        edDetails.style.display = "inline-block";
        edDetails.appendChild(edSummary);
        edDetails.classList.add("cardlist-accordion");
        edDetails.onkeyup = function (e) {
            // The default behavior for SPACE in a <details> element is to toggle its openness.
            // We need to disable this since the user may be typing in an <input> inside this element.
            if (e.keyCode == 32) {
                e.preventDefault();
            }
        };
        var edMain = (0, editor_1.swappingTextEditor)([c.content.prompt.join('|'), c.content.answers.join('|')]);
        edMain.element.style.display = "inline-block";
        edSummary.appendChild(edMain.element);
        var tagsEd = (0, editor_1.singleTextFieldEditor)(c.content.tags.join(','));
        tagsEd.element.placeholder = "tags...";
        edDetails.appendChild(tagsEd.element);
        var twoSideEd = (0, editor_1.boolEditor)("Double-sided card?", c.content.twoSided);
        edDetails.appendChild(twoSideEd.element);
        var cardInfo = document.createElement("a");
        cardInfo.classList.add("sr-card-due-date");
        cardInfo.style.color = "lightgray";
        cardInfo.style.marginLeft = "10px";
        cardInfo.style.marginRight = "10px";
        cardInfo.style.verticalAlign = "middle";
        if (c.intervalMinutes == 0) {
            cardInfo.textContent = "not studied";
        }
        else {
            cardInfo.textContent = `due ${(0, utils_1.getSRFutureDateInfo)(c.due)}`;
        }
        cardInfo.style.display = "block";
        edDetails.appendChild(cardInfo);
        var listenBtn = ((ed) => (0, utils_1.iconButton)("speaker.png", () => {
            var ss = speechEditor.menuToState();
            var tgtText = ed.menuToState()[1];
            (0, speech_1.utter)(tgtText, ss.voice, ss.rate, ss.pitch, () => { });
        }))(edMain);
        listenBtn.style.float = "";
        var listenDiv = document.createElement("div");
        listenDiv.style.overflowY = "visible";
        listenDiv.appendChild(listenBtn);
        edDetails.appendChild(listenDiv);
        return {
            element: edDetails,
            menuToState: () => {
                let tp = edMain.menuToState();
                return {
                    guid: c.guid,
                    content: {
                        prompt: tp[0].split('|'),
                        answers: tp[1].split('|'),
                        tags: tagsEd.menuToState().split(',').filter((t) => t.length > 0),
                        twoSided: twoSideEd.menuToState()
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
        infoWidget,
        studyingEditor.element,
        initHoursEditor.element,
        correctFactor.element,
        incorrectFactor.element,
        newQueueSizeEditor.element,
        omitTagsCont,
        twoSidedCont,
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
                    inactiveTags: omitTagsEditor.menuToState().split(','),
                    doTwoSided: twoSidedEditor.menuToState()
                },
                newQ: (0, spaced_repetition_newqueue_1.emptySRQueue)(newQueueSizeEditor.menuToState()),
                cards: (0, utils_1.makeDict)(cardsEditor.menuToState(), (c) => c.guid),
            };
        }
    };
}
(0, flashcard_deck_1.registerDeckType)(new SimpleSpacedRepGen(), simpleSRMenu, "simple-spaced-repetition-deck", "Simple spaced repetition deck", exports.defaultSimpleSRState, "#ffffdd");
