"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModularSpacedRepGen = exports.defaultSRModularState = exports.defaultSRModularSettings = void 0;
const utils_1 = require("utils/utils");
const flashcard_generator_1 = require("core/flashcard-generator");
const spaced_repetition_general_1 = require("decks/spaced-repetition-general");
const speech_1 = require("utils/speech");
const text_filters_1 = require("utils/text-filters");
const editor_1 = require("core/editor");
const shared_sr_menu_components_1 = require("utils/shared-sr-menu-components");
const flashcard_template_1 = require("core/flashcard-template");
const flashcard_deck_1 = require("core/flashcard-deck");
const spaced_repetition_newqueue_1 = require("utils/spaced-repetition-newqueue");
const flashcard_entry_1 = require("core/flashcard-entry");
exports.defaultSRModularSettings = {
    cardTypeSettings: {},
    initialHours: 8,
    correctFactor: 1.5,
    incorrectFactor: 0.5,
    inactiveTags: [],
    readCorrectAnswers: false,
    speechSettings: (0, speech_1.defaultSpeechSettings)(),
    filterSettings: text_filters_1.defaultTextFilterSettings
};
exports.defaultSRModularState = {
    cards: (0, spaced_repetition_general_1.makeSpacedRepCardDict)([], () => { return { streak: 0 }; }),
    newQ: (0, spaced_repetition_newqueue_1.emptySRQueue)(10),
    studying: spaced_repetition_general_1.SpacedRepStudying.NewCards,
    settings: exports.defaultSRModularSettings
};
function makeEmptyCard(cardType) {
    return {
        guid: (0, utils_1.guidGenerator)(),
        content: {
            cardType: cardType,
            cardEntry: flashcard_entry_1.gCardTypeRegistry[cardType].getDefaultEntry(),
            tags: []
        },
        due: new Date(),
        intervalMinutes: 0,
        auxdata: {
            streak: 0
        }
    };
}
class ModularSpacedRepGen extends spaced_repetition_general_1.AbstractAsyncSpacedRepGen {
    getGenName() { return "modular-spaced-repetition"; }
    repairDeckState(st) {
        st = (0, utils_1.recursiveRepairJSON)(st, exports.defaultSRModularState, ["cards"]);
        console.log(st);
        // st.cards = recursiveRepairEachValueJSON(st.cards, Object.values(defaultSRModularState.cards)[0]);
        if (st.settings.cardTypeSettings == null) {
            st.settings.cardTypeSettings = {};
        }
        for (var i in Object.keys(flashcard_entry_1.gCardTypeRegistry)) {
            var cardType = Object.keys(flashcard_entry_1.gCardTypeRegistry)[i];
            if (!(cardType in st.settings.cardTypeSettings)) {
                st.settings.cardTypeSettings[cardType]
                    = flashcard_entry_1.gCardTypeRegistry[cardType].getDefaultSettings();
            }
        }
        this.preprocessAllCards(st);
        return st;
    }
    cardIsEnabled(card, st) {
        return !card.content.tags.some((t) => st.settings.inactiveTags.includes(t));
    }
    correctEffect(st, card, attempt, resolve) {
        var cardData = card.data;
        if (st.settings.readCorrectAnswers) {
            var ss = st.settings.speechSettings;
            if (attempt.length > 0) {
                (0, speech_1.utter)(attempt, ss.voice, ss.rate, ss.pitch, resolve);
            }
            else {
                // TODO: how do we determine what to say about an arbitrary card that is overridden?
            }
        }
        else {
            resolve();
        }
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
    checkAnswerAsync(answer, st, card) {
        if (card.data === undefined) {
            return (0, utils_1.trivialPromise)(false);
        }
        var cardType = card.data.content.cardType;
        var cardData = card.data.content.cardData;
        var tf = (s) => (0, text_filters_1.applyTextFilter)(s, st.settings.filterSettings);
        return flashcard_entry_1.gCardTypeRegistry[cardType].checkAnswer(answer, cardData, st.settings.cardTypeSettings[cardType], tf);
    }
    preprocessAllCards(st) {
        this.getNew(st).map((k) => {
            var c = st.cards[k].content;
            flashcard_entry_1.gCardTypeRegistry[c.cardType].preprocessEntry(c.cardEntry, st.settings.cardTypeSettings[c.cardType]);
        });
        this.getDue(st).map((k) => {
            var c = st.cards[k].content;
            flashcard_entry_1.gCardTypeRegistry[c.cardType].preprocessEntry(c.cardEntry, st.settings.cardTypeSettings[c.cardType]);
        });
    }
    nextCardAsyncPreprocessing(card, st) {
        if (card.data === undefined)
            return (0, utils_1.trivialPromise)(card);
        var cardType = card.data.content.cardType;
        var cardEntry = card.data.content.cardEntry;
        var dp = flashcard_entry_1.gCardTypeRegistry[cardType].processEntry(cardEntry, st.settings.cardTypeSettings[cardType]);
        return dp.then((d) => {
            card.data.content.cardData = d;
            return card;
        });
    }
    generateCardAsync(st, card) {
        if (card.data === undefined) {
            return (0, utils_1.trivialPromise)((0, flashcard_template_1.renderCard)("noanswer-template", "No cards left to study."));
        }
        var cardType = card.data.content.cardType;
        var cardEntry = card.data.content.cardEntry;
        var fl = flashcard_entry_1.gCardTypeRegistry[cardType].generateCard(cardEntry, st.settings.cardTypeSettings[cardType]);
        fl.el.appendChild((0, spaced_repetition_general_1.makeCardsLeftSpan)(card));
        return (0, utils_1.trivialPromise)(fl);
    }
    makeEditor(st) {
        var contDiv = document.createElement("div");
        var infoWidget = (0, shared_sr_menu_components_1.infoWidgetSR)(this.gen, st);
        var studyingEditor = (0, shared_sr_menu_components_1.studyingEditorSR)(st);
        var newQueueSizeEditor = (0, editor_1.scrollNumberEditor)("Max new cards to study at once: ", st.newQ.maxNewCards, 1, 100, 1);
        var initHoursEditor = (0, editor_1.scrollNumberEditor)("Initial interval (hours): ", st.settings.initialHours, 1, 240, 1);
        var correctFactor = (0, editor_1.scrollNumberEditor)("Correct factor: ", st.settings.correctFactor, 1, 10, 0.1);
        var incorrectFactor = (0, editor_1.scrollNumberEditor)("Incorrect factor: ", st.settings.incorrectFactor, 0, 1.0, 0.01);
        var omitTagsEditor = (0, editor_1.singleTextFieldEditor)(st.settings.inactiveTags.join(','));
        omitTagsEditor.element.placeholder = "comma-separated tags...";
        var omitTagsCont = document.createElement("div");
        omitTagsCont.textContent = "Omit cards with the following tags: ";
        omitTagsCont.appendChild(omitTagsEditor.element);
        var speechCheckbox = (0, editor_1.boolEditor)("Speak correct answers using text-to-speech?", st.settings.readCorrectAnswers);
        var speechEditor = (0, speech_1.speechSettingsEditor)(st.settings.speechSettings);
        var speechDiv = document.createElement("div");
        speechDiv.appendChild(speechCheckbox.element);
        speechDiv.appendChild(speechEditor.element);
        var omitTagsEditor = (0, editor_1.singleTextFieldEditor)(st.settings.inactiveTags.join(','));
        omitTagsEditor.element.placeholder = "comma-separated tags...";
        var omitTagsCont = document.createElement("div");
        omitTagsCont.textContent = "Omit cards with the following tags: ";
        omitTagsCont.appendChild(omitTagsEditor.element);
        var filterEditor = (0, text_filters_1.textFilterSelectionMenu)(st.settings.filterSettings);
        function makeCardEditor(c) {
            var cardType = c.content.cardType;
            var cardEntry = c.content.cardEntry;
            var ed = flashcard_entry_1.gCardTypeRegistry[cardType].makeEntryEditor(c.content.cardEntry);
            var tagsEd = (0, editor_1.singleTextFieldEditor)(c.content.tags.join(','));
            tagsEd.element.placeholder = "tags...";
            ed.element.appendChild(tagsEd.element);
            return {
                element: ed.element,
                menuToState: () => {
                    return {
                        guid: c.guid,
                        content: {
                            cardType: c.content.cardType,
                            cardEntry: ed.menuToState(),
                            cardData: null,
                            tags: tagsEd.menuToState().split(",").filter((t) => t.length > 0)
                        },
                        due: c.due,
                        intervalMinutes: c.intervalMinutes,
                        auxdata: c.auxdata
                    };
                }
            };
        }
        var cardSettingsGroups = st.settings.cardTypeSettings;
        var cardEditorGroups = [];
        for (var i in Object.keys(flashcard_entry_1.gCardTypeRegistry)) {
            var t = Object.keys(flashcard_entry_1.gCardTypeRegistry)[i];
            var cardsEditor = (0, editor_1.multipleEditors)(Object.values(st.cards).filter((c) => c.content.cardType == t), () => makeEmptyCard(t), makeCardEditor, true, (s, cd) => flashcard_entry_1.gCardTypeRegistry[t].getSearchableText(cd.content.cardEntry).includes(s));
            var cardsEditorCont = document.createElement("div");
            var cardsEditorDetails = document.createElement("details");
            var cardsEditorSummary = document.createElement("summary");
            cardsEditorSummary.textContent = "Add, edit and remove cards";
            cardsEditorDetails.appendChild(cardsEditorSummary);
            cardsEditorDetails.appendChild(cardsEditor.element);
            cardsEditorCont.appendChild(cardsEditorDetails);
            cardsEditor.element = cardsEditorCont;
            cardEditorGroups.push(cardsEditor);
            cardSettingsGroups[t]
                = flashcard_entry_1.gCardTypeRegistry[t].makeSettingsEditor(st.settings.cardTypeSettings[t]);
            var header = document.createElement("h2");
            header.textContent = flashcard_entry_1.gCardTypeRegistry[t].getUserFriendlyName();
            cardsEditor.element.prepend(cardSettingsGroups[t].element);
            cardsEditor.element.prepend(header);
        }
        [
            infoWidget,
            studyingEditor.element,
            initHoursEditor.element,
            newQueueSizeEditor.element,
            correctFactor.element,
            incorrectFactor.element,
            omitTagsCont,
            speechDiv,
            filterEditor.element
        ].concat(cardEditorGroups.map((ed) => ed.element)).map((el) => {
            el.classList.add("deck-menu-submenu");
            contDiv.appendChild(el);
        });
        return {
            element: contDiv,
            menuToState: () => {
                return {
                    studying: studyingEditor.menuToState(),
                    settings: {
                        cardTypeSettings: null, // TODO
                        initialHours: initHoursEditor.menuToState(),
                        correctFactor: correctFactor.menuToState(),
                        incorrectFactor: incorrectFactor.menuToState(),
                        readCorrectAnswers: speechCheckbox.menuToState(),
                        speechSettings: speechEditor.menuToState(),
                        filterSettings: filterEditor.menuToState(),
                        inactiveTags: omitTagsEditor.menuToState().split(",")
                    },
                    newQ: (0, spaced_repetition_newqueue_1.emptySRQueue)(newQueueSizeEditor.menuToState()),
                    cards: (0, utils_1.makeDict)(cardEditorGroups.map((e) => e.menuToState()).flat(1), (c) => c.guid),
                };
            }
        };
    }
}
exports.ModularSpacedRepGen = ModularSpacedRepGen;
(0, flashcard_deck_1.registerDeckType)(new ModularSpacedRepGen(), "modular-spaced-repetition-deck", "Modular spaced repetition deck", exports.defaultSRModularState, "#ffffdd");
