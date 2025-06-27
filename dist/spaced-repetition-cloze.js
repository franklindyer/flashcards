"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClozeSpacedRepGen = exports.defaultSRClozeState = exports.defaultSRClozeSettings = void 0;
const utils_1 = require("./utils");
const flashcard_generator_1 = require("./flashcard-generator");
const spaced_repetition_general_1 = require("./spaced-repetition-general");
const speech_1 = require("./speech");
const text_filters_1 = require("./text-filters");
const editor_1 = require("./editor");
const shared_sr_menu_components_1 = require("./shared-sr-menu-components");
const flashcard_template_1 = require("./flashcard-template");
const flashcard_deck_1 = require("./flashcard-deck");
exports.defaultSRClozeSettings = {
    clozeServerUrl: "",
    sourceLangs: ["en", "es"],
    targetLang: "de",
    initialHours: 8,
    correctFactor: 1.5,
    incorrectFactor: 0.5,
    inactiveTags: [],
    readCorrectAnswers: false,
    speechSettings: (0, speech_1.defaultSpeechSettings)(),
    filterSettings: text_filters_1.defaultTextFilterSettings
};
exports.defaultSRClozeState = {
    cards: (0, spaced_repetition_general_1.makeSpacedRepCardDict)([
        { key: "Hund", tags: [] },
        { key: "Katze", tags: [] },
        { key: "Mensch", tags: [] }
    ], () => { return { streak: 0, invalid: false }; }),
    newIndex: 0,
    newQueue: [],
    newQueueSize: 10,
    studying: spaced_repetition_general_1.SpacedRepStudying.NewCards,
    settings: exports.defaultSRClozeSettings
};
function makeEmptyCard() {
    return {
        guid: (0, utils_1.guidGenerator)(),
        content: {
            key: "",
            tags: []
        },
        due: new Date(),
        intervalMinutes: 0,
        auxdata: {
            streak: 0,
            invalid: false
        }
    };
}
async function getClozePuzzle(key, serverUrl) {
    // return fetch(`${serverUrl}/key`)
    return null;
}
class ClozeSpacedRepGen extends spaced_repetition_general_1.AbstractAsyncSpacedRepGen {
    getGenName() { return "cloze-spaced-repetition"; }
    repairDeckState(st) {
        return st;
    }
    cardIsEnabled(card, st) {
        return !card.auxdata.invalid;
    }
    correctEffect(st, card, attempt, resolve) {
        var cardData = card.data;
        if (st.settings.readCorrectAnswers && card.data.auxdata.cloze !== undefined) {
            var ss = st.settings.speechSettings;
            if (attempt.length > 0) {
                (0, speech_1.utter)(attempt, ss.voice, ss.rate, ss.pitch, resolve);
            }
            else {
                (0, speech_1.utter)(cardData.auxdata.cloze.answer, ss.voice, ss.rate, ss.pitch, resolve);
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
            if (card.data.auxdata.cloze == undefined) {
                // When a card with invalid cloze is overridden, mark it as invalid
                card.data.auxdata.invalid = true;
            }
            else {
                card.data.auxdata.streak += 1;
            }
        }
        else if (correct == flashcard_generator_1.FlashcardResult.Incorrect) {
            card.data.auxdata.streak = 0;
        }
        return card.data.auxdata;
    }
    checkAnswerAsync(answer, st, card) {
        console.log("CHECKING ANSWER");
        if (card.data === undefined || card.data.auxdata.cloze === undefined) {
            return (0, utils_1.trivialPromise)(false);
        }
        var tf = (s) => (0, text_filters_1.applyTextFilter)(s, st.settings.filterSettings);
        return (0, utils_1.trivialPromise)(tf(card.data.auxdata.cloze.answer) === tf(answer));
    }
    fetchCloze(lemma, st) {
        return fetch(`${st.settings.clozeServerUrl}/cloze?` + new URLSearchParams({
            "srcs": st.settings.sourceLangs.join(","),
            "tgt": st.settings.targetLang,
            "lemma": lemma
        }).toString());
    }
    nextCardAsyncPreprocessing(card, st) {
        console.log("DOING PREPROCESSING");
        if (st.settings.clozeServerUrl.length == 0 || card.data === undefined) {
            // Returns with .cloze attribute undefined, indicating failure
            return (0, utils_1.trivialPromise)(card);
        }
        return this.fetchCloze(card.data.content.key, st).then((r) => r.json()).then((j) => {
            card.data.auxdata.cloze = {
                prompt: j["puzzle"],
                answer: j["target"],
                translation: j["source"]
            };
            console.log(card);
            return card;
        }).catch((e) => {
            console.log(e);
            return card;
        });
    }
    generateCardAsync(card) {
        console.log(card);
        if (card.data === undefined) {
            return (0, utils_1.trivialPromise)((0, flashcard_template_1.renderCard)("noanswer-template", "No cards left to study."));
        }
        else if (card.data.auxdata.cloze === undefined) {
            return (0, utils_1.trivialPromise)((0, flashcard_template_1.renderCard)("noanswer-template", `Could not get puzzle for card "${card.data.content.key}".`));
        }
        return (0, utils_1.trivialPromise)((0, flashcard_template_1.renderCard)("cloze-template", {
            group: "",
            guid: card.data.guid,
            upper: card.data.auxdata.cloze.prompt,
            lower: card.data.auxdata.cloze.translation
        }));
    }
}
exports.ClozeSpacedRepGen = ClozeSpacedRepGen;
function clozeSRMenu(st) {
    var contDiv = document.createElement("div");
    var infoWidget = (0, shared_sr_menu_components_1.infoWidgetSR)(st);
    var studyingEditor = (0, shared_sr_menu_components_1.studyingEditorSR)(st);
    var newQueueSizeEditor = (0, editor_1.scrollNumberEditor)("Max new cards to study at once: ", st.newQueueSize, 1, 100, 1);
    var clozeServerDiv = document.createElement("div");
    clozeServerDiv.classList.add("deck-menu-submenu");
    var clozeServerUrlEditor = (0, editor_1.singleTextFieldEditor)(st.settings.clozeServerUrl);
    var clozeSourceLangEditor = (0, editor_1.singleTextFieldEditor)(st.settings.sourceLangs.join(','));
    var clozeTargetLangEditor = (0, editor_1.singleTextFieldEditor)(st.settings.targetLang);
    clozeServerDiv.appendChild(clozeServerUrlEditor.element);
    clozeServerDiv.appendChild(clozeSourceLangEditor.element);
    clozeServerDiv.appendChild(clozeTargetLangEditor.element);
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
        var ed = (0, editor_1.combineEditors)([c.content.key, c.content.tags.join(',')], (k) => {
            var ed2 = (0, editor_1.singleTextFieldEditor)(k);
            ed2.element.style.display = "inline-block";
            return ed2;
        }, (ts) => {
            var ed2 = (0, editor_1.singleTextFieldEditor)(ts);
            ed2.element.placeholder = "tags...";
            return ed2;
        });
        var tf1 = ed.element.children[0];
        if (c.auxdata.invalid)
            tf1.style.backgroundColor = "#ffeeee";
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
                c.content.key = tp[0];
                c.content.tags = tp[1].split(",");
                return c;
            }
        };
    }
    var cardsEditor = (0, editor_1.multipleEditors)(Object.values(st.cards), () => makeEmptyCard(), makeCardEditor, true, (s, cd) => cd.content.key.includes(s));
    [
        infoWidget,
        studyingEditor.element,
        clozeServerDiv,
        initHoursEditor.element,
        newQueueSizeEditor.element,
        correctFactor.element,
        incorrectFactor.element,
        omitTagsCont,
        speechDiv,
        filterEditor.element,
        cardsEditor.element
    ].map((el) => {
        el.classList.add("deck-menu-submenu");
        contDiv.appendChild(el);
    });
    return {
        element: contDiv,
        menuToState: () => {
            return {
                studying: studyingEditor.menuToState(),
                settings: {
                    clozeServerUrl: clozeServerUrlEditor.menuToState(),
                    sourceLangs: clozeSourceLangEditor.menuToState().split(","),
                    targetLang: clozeTargetLangEditor.menuToState(),
                    initialHours: initHoursEditor.menuToState(),
                    correctFactor: correctFactor.menuToState(),
                    incorrectFactor: incorrectFactor.menuToState(),
                    readCorrectAnswers: speechCheckbox.menuToState(),
                    speechSettings: speechEditor.menuToState(),
                    filterSettings: filterEditor.menuToState(),
                    inactiveTags: omitTagsEditor.menuToState().split(",")
                },
                newQueue: st.newQueue,
                newIndex: st.newIndex,
                newQueueSize: newQueueSizeEditor.menuToState(),
                cards: (0, utils_1.makeDict)(cardsEditor.menuToState(), (c) => c.guid),
            };
        }
    };
}
(0, flashcard_deck_1.registerDeckType)(new ClozeSpacedRepGen(), clozeSRMenu, "cloze-spaced-repetition-deck", "Cloze spaced repetition deck", exports.defaultSRClozeState, "#ffffdd");
