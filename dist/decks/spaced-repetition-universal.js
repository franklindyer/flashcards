"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UniversalSpacedRepGen = exports.defaultSRUniversalState = exports.defaultSRUniversalSettings = void 0;
exports.makeSRCardDict = makeSRCardDict;
const utils_1 = require("utils/utils");
const flashcard_1 = require("core/flashcard");
const flashcard_generator_1 = require("core/flashcard-generator");
const speech_1 = require("utils/speech");
const text_filters_1 = require("utils/text-filters");
const nj_templates_1 = require("utils/nj-templates");
const nunjucks_1 = require("nunjucks");
const flashcard_deck_1 = require("core/flashcard-deck");
const spaced_repetition_newqueue_1 = require("utils/spaced-repetition-newqueue");
const flashcard_entry_1 = require("core/flashcard-entry");
const pushcard_queue_1 = require("utils/pushcard-queue");
const spaced_repetition_universal_types_1 = require("decks/spaced-repetition-universal-types");
const spaced_repetition_universal_menu_1 = require("decks/spaced-repetition-universal-menu");
/* --- USEFUL UTILITIES FOR DEFINING SR DECK --- */
exports.defaultSRUniversalSettings = {
    cardTypeSettings: {},
    initialStreak: 3,
    initialHours: 24,
    minimumHours: 8,
    minimumMinutesWhenWrong: 10,
    correctFactor: 1.5,
    incorrectFactor: 0.5,
    spreadingCoef: 0.0,
    fillQOnlyWhenEmpty: true,
    inactiveTags: [],
    readCorrectAnswers: false,
    preventReversedNewCards: false,
    speechSettings: (0, speech_1.defaultSpeechSettings)(),
    filterSettings: text_filters_1.defaultTextFilterSettings,
    pushcardQueue: (0, pushcard_queue_1.defaultPushcardQueue)()
};
function makeSRCardDict(cards) {
    var cardDict = {};
    for (var i in cards) {
        var c = cards[i];
        cardDict[c.guid] = c;
    }
    return cardDict;
}
exports.defaultSRUniversalState = {
    cards: {},
    newQ: (0, spaced_repetition_newqueue_1.emptySRQueue)(10),
    studying: spaced_repetition_universal_types_1.SRStudying.NewCards,
    settings: exports.defaultSRUniversalSettings
};
function infoWidgetSR(totalCards, newCards, dueCards) {
    var contDiv = document.createElement("div");
    contDiv.classList.add("deck-menu-submenu");
    var totP = document.createElement("p");
    totP.textContent = `Total cards: ${totalCards}`;
    var newP = document.createElement("p");
    newP.textContent = `New cards: ${newCards}`;
    newP.style.color = "#9999ee";
    newP.style.fontWeight = "bold";
    var dueP = document.createElement("p");
    dueP.textContent = `Due cards: ${dueCards}`;
    dueP.style.color = "#ee9999";
    dueP.style.fontWeight = "bold";
    [totP, newP, dueP].map((el) => contDiv.appendChild(el));
    return contDiv;
}
class UniversalSpacedRepGen extends flashcard_generator_1.FlashcardGen {
    getGenName() { return "universal-spaced-repetition"; }
    // mock-up datetime function for unit testing purposes
    getDate = () => new Date();
    setDate(newDt) { this.getDate = () => newDt; }
    repairDeckState(st) {
        st = (0, utils_1.recursiveRepairJSON)(st, exports.defaultSRUniversalState, ["cards", "cardTypeSettings"]);
        // st.cards = recursiveRepairEachValueJSON(st.cards, Object.values(defaultSRModularState.cards)[0]);
        if (st.settings.cardTypeSettings === undefined) {
            st.settings.cardTypeSettings = {};
        }
        for (var i in Object.keys(flashcard_entry_1.gCardTypeRegistry)) {
            var cardType = Object.keys(flashcard_entry_1.gCardTypeRegistry)[i];
            if (!Object.keys(st.settings.cardTypeSettings).includes(cardType)) {
                st.settings.cardTypeSettings[cardType]
                    = flashcard_entry_1.gCardTypeRegistry[cardType].getDefaultSettings();
            }
            else {
                var currentSettings = st.settings.cardTypeSettings[cardType];
                var repairedSettings = (0, utils_1.recursiveRepairJSON)(currentSettings, flashcard_entry_1.gCardTypeRegistry[cardType].getDefaultSettings());
                st.settings.cardTypeSettings[cardType] = repairedSettings;
            }
        }
        for (var i in Object.keys(st.cards)) {
            var guid = Object.keys(st.cards)[i];
            var emptyCard = (0, spaced_repetition_universal_types_1.makeEmptyCard)(st.cards[guid].cardType);
            if (!("extraInfo" in st.cards[guid]) || st.cards[guid].extraInfo === null)
                st.cards[guid].extraInfo = "";
            st.cards[guid].stats = (0, utils_1.recursiveRepairJSON)(st.cards[guid].stats, emptyCard.stats);
        }
        this.preprocessAllCards(st);
        // Fill the new queue, in case it isn't full yet
        // st.newQ = refillNewQueue(st.newQ, this.getNew(st), st.settings.fillQOnlyWhenEmpty);
        return st;
    }
    cardIsDue(card) {
        return (card.intervalMinutes > 0 && new Date(card.due).valueOf() < this.getDate().valueOf());
    }
    cardIsNew(card) {
        return (card.intervalMinutes == 0);
    }
    getDue(st) {
        return Object.keys(st.cards).filter((k) => this.cardIsDue(st.cards[k]) && this.cardIsEnabled(st.cards[k], st));
    }
    getNew(st) {
        return Object.keys(st.cards).filter((k) => this.cardIsNew(st.cards[k]) && this.cardIsEnabled(st.cards[k], st));
    }
    cardIsEnabled(card, st) {
        return !card.tags.some((t) => st.settings.inactiveTags.includes(t));
    }
    // A pure effect that should be triggered when a card is finally answered correctly
    correctEffect(st, card, attempt, resolve) {
        var cardVirtual = card.virtual;
        var cardTypeSettings = st.settings.cardTypeSettings[cardVirtual.cardType];
        if (st.settings.readCorrectAnswers) {
            flashcard_entry_1.gCardTypeRegistry[cardVirtual.cardType].speakCard(card.processed, cardTypeSettings, resolve);
        }
        else {
            resolve();
        }
    }
    // Update a card's interval based on settings and the attempt's success/failure
    updateInterval(card, settings, correct) {
        var cardData = card.virtual;
        if (correct == flashcard_generator_1.FlashcardResult.Correct) {
            if (cardData.intervalMinutes == 0 && cardData.stats.streak >= settings.initialStreak) {
                return settings.initialHours * 60;
            }
            else if (cardData.intervalMinutes != 0) {
                return Math.max(cardData.intervalMinutes * settings.correctFactor, settings.minimumHours * 60);
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
    updateStats(card, settings, correct) {
        if (correct !== flashcard_generator_1.FlashcardResult.Unanswered) {
            card.virtual.stats.lastStudied = card.virtual.stats.lastStudied.slice(1);
            card.virtual.stats.lastStudied.unshift(this.getDate());
            card.virtual.stats.lastStreak = card.virtual.stats.streak;
            card.virtual.stats.lastStreakWrong = card.virtual.stats.streakWrong;
        }
        if (correct == flashcard_generator_1.FlashcardResult.Correct) {
            card.virtual.stats.streak += 1;
            card.virtual.stats.streakWrong = 0;
            card.virtual.stats.numCorrect += 1;
        }
        else if (correct == flashcard_generator_1.FlashcardResult.Incorrect) {
            card.virtual.stats.maxStreakBroken = Math.max(card.virtual.stats.maxStreakBroken, card.virtual.stats.streak);
            card.virtual.stats.streak = 0;
            card.virtual.stats.streakWrong += 1;
            card.virtual.stats.numIncorrect += 1;
        }
        return card.virtual.stats;
    }
    updateCard(card, st, correct) {
        // Physical card data may be affected by templating or other modifications, so must get card data from deck by its GUID
        var cardVirtual = st.cards[card.virtual.guid];
        if (card.context.isPractice) {
            return cardVirtual;
        }
        var isNew = cardVirtual.intervalMinutes == 0;
        var newStats = this.updateStats(card, st.settings, correct);
        cardVirtual.stats = newStats;
        var newInterval = this.updateInterval(card, st.settings, correct);
        cardVirtual.intervalMinutes = newInterval;
        var smoothedInterval = cardVirtual.intervalMinutes;
        smoothedInterval = (1 + st.settings.spreadingCoef * (2 * Math.random() - 1)) * smoothedInterval;
        // Interval > 0 implies the card is no longer new
        if (correct == flashcard_generator_1.FlashcardResult.Correct && newInterval > 0) {
            // When correct, reschedule card using its current interval
            cardVirtual.due = this.getDate();
            cardVirtual.due.setHours(cardVirtual.due.getHours() + smoothedInterval / 60);
        }
        else if (correct == flashcard_generator_1.FlashcardResult.Incorrect && newInterval > 0) {
            // When incorrect, reschedule for re-study after a short timeout
            cardVirtual.due = this.getDate();
            cardVirtual.due.setMinutes(cardVirtual.due.getMinutes() + st.settings.minimumMinutesWhenWrong);
        }
        return cardVirtual;
    }
    updateStateAsync(st, card, result) {
        if (result == flashcard_generator_1.FlashcardResult.Unanswered || st.studying == spaced_repetition_universal_types_1.SRStudying.RandomCards) {
            return (0, utils_1.trivialPromise)(st);
        }
        var cardGuid = card.virtual.guid;
        var cardNewState = this.updateCard(card, st, result);
        // If card is still new, stick it back in the queue
        if (card.context.studying === "new") {
            st.newQ = (0, spaced_repetition_newqueue_1.incorporateLast)(st.newQ, cardGuid, this.cardIsNew(cardNewState));
        }
        st.newQ = (0, spaced_repetition_newqueue_1.filterNewQueue)(st.newQ, (id) => this.cardIsEnabled(st.cards[id], st));
        // st.newQ = refillNewQueue(st.newQ, this.getNew(st), st.settings.fillQOnlyWhenEmpty);
        st.cards[cardGuid] = cardNewState;
        return (0, utils_1.trivialPromise)(st);
    }
    reportableData(st, card, attempt, result) {
        if (!card.virtual || result == flashcard_generator_1.FlashcardResult.Unanswered) {
            return {};
        }
        return {
            "guid": card.virtual.guid,
            "stats": card.virtual.stats,
            "due": card.virtual.due,
            "timestamp": this.getDate(),
            "interval": card.virtual.intervalMinutes,
            "attempt": attempt.slice(0, 50),
            "correct": result == flashcard_generator_1.FlashcardResult.Correct
        };
    }
    getNextCardAsync(st) {
        var inds = Object.keys(st.cards);
        var newInds = this.getNew(st);
        console.log(newInds);
        var dueInds = this.getDue(st);
        var emptyCard = this.nextCardAsyncPreprocessing({
            virtual: undefined,
            context: { cardsLeft: 0, isPractice: false, studying: "" }
        }, st);
        if (inds.length == 0) {
            return emptyCard;
        }
        if ((st.studying == spaced_repetition_universal_types_1.SRStudying.NewCards) ||
            (st.studying == spaced_repetition_universal_types_1.SRStudying.NewThenDueCards && newInds.length > 0) ||
            (st.studying == spaced_repetition_universal_types_1.SRStudying.DueThenNewCards && dueInds.length == 0)) {
            var newGuid = (0, spaced_repetition_newqueue_1.chooseNext)(st.newQ, newInds, st.settings.fillQOnlyWhenEmpty);
            if (newGuid === undefined) {
                return emptyCard;
            }
            return this.nextCardAsyncPreprocessing({
                virtual: st.cards[newGuid],
                context: {
                    cardsLeft: newInds.length,
                    isPractice: false,
                    studying: "new"
                }
            }, st);
        }
        else if ((st.studying == spaced_repetition_universal_types_1.SRStudying.DueCards) ||
            (st.studying == spaced_repetition_universal_types_1.SRStudying.DueThenNewCards) ||
            (st.studying == spaced_repetition_universal_types_1.SRStudying.NewThenDueCards && newInds.length == 0)) {
            if (dueInds.length == 0) {
                return emptyCard;
            }
            var dueInd = dueInds[Math.floor(Math.random() * dueInds.length)];
            return this.nextCardAsyncPreprocessing({
                virtual: st.cards[dueInd],
                context: {
                    cardsLeft: dueInds.length,
                    isPractice: false,
                    studying: "due"
                }
            }, st);
        }
        else if (st.studying == spaced_repetition_universal_types_1.SRStudying.RandomCards) {
            if (inds.length == 0) {
                return emptyCard;
            }
            var ind = inds[Math.floor(Math.random() * inds.length)];
            return this.nextCardAsyncPreprocessing({
                virtual: st.cards[ind],
                context: {
                    cardsLeft: 0,
                    isPractice: true,
                    studying: "random"
                }
            }, st);
        }
        return this.nextCardAsyncPreprocessing({
            virtual: undefined,
            context: {
                cardsLeft: 0,
                isPractice: false,
                studying: ""
            }
        }, st);
    }
    checkAnswerAsync(answer, st, card) {
        if (card.virtual === undefined) {
            return (0, utils_1.trivialPromise)(false);
        }
        var cardType = card.virtual.cardType;
        var cardData = card.processed;
        var tf = (s) => (0, text_filters_1.applyTextFilter)(s, st.settings.filterSettings);
        return flashcard_entry_1.gCardTypeRegistry[cardType].checkAnswer(answer, cardData, st.settings.cardTypeSettings[cardType], tf);
    }
    preprocessAllCards(st) {
        this.getNew(st).map((k) => {
            var c = st.cards[k];
            flashcard_entry_1.gCardTypeRegistry[c.cardType].preprocessEntry(c.cardEntry, st.settings.cardTypeSettings[c.cardType]);
        });
        this.getDue(st).map((k) => {
            var c = st.cards[k];
            flashcard_entry_1.gCardTypeRegistry[c.cardType].preprocessEntry(c.cardEntry, st.settings.cardTypeSettings[c.cardType]);
        });
    }
    nextCardAsyncPreprocessing(card, st) {
        if (card.virtual === undefined) {
            return (0, utils_1.trivialPromise)(card);
        }
        var cardType = card.virtual.cardType;
        var cardEntry = card.virtual.cardEntry;
        var context = { preventReversedCard: card.virtual.intervalMinutes == 0 && st.settings.preventReversedNewCards };
        var dp = flashcard_entry_1.gCardTypeRegistry[cardType].processEntry(cardEntry, st.settings.cardTypeSettings[cardType], context);
        return dp.then((d) => {
            card.processed = d;
            return card;
        });
    }
    generateCardAsync(st, card) {
        if (card.virtual === undefined || card.processed === undefined) {
            var htmlString = (0, nunjucks_1.renderString)(nj_templates_1.njNoCardsLeft, {});
            var el = (new DOMParser().parseFromString(htmlString, "text/html").body.firstChild);
            return (0, utils_1.trivialPromise)(new flashcard_1.Flashcard(el, ""));
        }
        var cardType = card.virtual.cardType;
        var cardEntry = card.virtual.cardEntry;
        var cardProcessed = card.processed;
        var contextDict = { ...card.context };
        contextDict["extra"] = card.virtual.extraInfo;
        var fl = flashcard_entry_1.gCardTypeRegistry[cardType].generateCard(cardProcessed, st.settings.cardTypeSettings[cardType], contextDict);
        return (0, utils_1.trivialPromise)(fl);
    }
    makeEditor(st) {
        var _this = this;
        var contDiv = document.createElement("div");
        var numDue = this.gen.getDue(st).length;
        var numNew = this.gen.getNew(st).length;
        var numTotal = Object.keys(st.cards).length;
        var menuTpl = spaced_repetition_universal_menu_1.srUniversalMenuTpl;
        var menuHTML = (0, nunjucks_1.renderString)(menuTpl, {
            st: st,
            ttsVoices: [...(0, speech_1.gSynth)().getVoices()],
            numDue: numDue,
            numNew: numNew,
            numTotal: numTotal
        });
        contDiv.innerHTML = menuHTML;
        var menu = contDiv.children[0];
        var simpleCardsMenu = menu.querySelector("[name='simpleCards']");
        var clozeCardsMenu = menu.querySelector("[name='clozeCards']");
        var multiCardsMenu = menu.querySelector("[name='multiCards']");
        [[simpleCardsMenu, "simple-card"],
            [clozeCardsMenu, "cloze-card"],
            [multiCardsMenu, "multi-sided-card"]].forEach((m) => {
            var settingsMenu = menu.querySelector(`[name='${m[1]}']`);
            m[0].dynamicDefaultState = () => {
                return (0, spaced_repetition_universal_types_1.makeEmptyCard)(m[1], settingsMenu.getState());
            };
        });
        var cardPreviewState = (guid) => {
            return _this.gen.nextCardAsyncPreprocessing({
                virtual: menu.getState().cards[guid],
                context: {
                    cardsLeft: 0,
                    isPractice: false
                }
            }, menu.getState());
        };
        var cardPreviewCallback = (el) => {
            var guid = el.getState().guid;
            var previewDiv = el.querySelector(".flashcard-container");
            previewDiv.style.display = "none";
            var previewBtn = el.querySelector(".menu-preview-card-button");
            var prelistenBtn = el.querySelector(".menu-prelisten-card-button");
            previewBtn.onclick = (e) => {
                var cardStatePromise = cardPreviewState(guid);
                cardStatePromise.then((cs) => {
                    var cardDivPromise = _this.gen.generateCardAsync(menu.getState(), cs);
                    cardDivPromise.then((cp) => {
                        cp.el.classList.add("flashcard");
                        cp.el.classList.add("flashcard-preview");
                        previewDiv.innerHTML = "";
                        previewDiv.style.display = "block";
                        previewDiv.appendChild(cp.el);
                        var detailsEl = previewDiv.closest("details");
                        if (detailsEl) {
                            detailsEl.open = true;
                        }
                    });
                });
            };
            prelistenBtn.onclick = (e) => {
                var cardStatePromise = cardPreviewState(guid);
                cardStatePromise.then((cs) => {
                    var cardTypeClass = flashcard_entry_1.gCardTypeRegistry[cs.virtual.cardType];
                    var cardTypeSettings = menu.getState().settings.cardTypeSettings[cs.virtual.cardType];
                    cardTypeClass.speakCard(cs.processed, cardTypeSettings, () => { });
                });
            };
            var swapperBtn = el.querySelector(".menu-swapper-button");
            if (swapperBtn) {
                var promptMenu = el.querySelector("[name='cardEntry.prompt']");
                var answerMenu = el.querySelector("[name='cardEntry.answer']");
                swapperBtn.onclick = (e) => {
                    var aux = promptMenu.value;
                    promptMenu.value = answerMenu.value;
                    answerMenu.value = aux;
                };
            }
        };
        simpleCardsMenu.entryCallback = cardPreviewCallback;
        clozeCardsMenu.entryCallback = cardPreviewCallback;
        multiCardsMenu.entryCallback = cardPreviewCallback;
        menu.querySelector(".menu-pushcard-refresh-button").click();
        menu.preProc = (st) => {
            var cardsList = [...Object.values(st.cards)];
            st.settings.cardTypeSettings.simpleCards
                = [...Object.values(st.cards).filter((c) => c.cardType == "simple-card")];
            st.settings.cardTypeSettings.clozeCards
                = [...Object.values(st.cards).filter((c) => c.cardType == "cloze-card")];
            st.settings.cardTypeSettings.multiCards
                = [...Object.values(st.cards).filter((c) => c.cardType == "multi-sided-card")];
            st.settings.cardTypeSettings.simpleCards.sort((c1, c2) => (c1.stats.created < c2.stats.created) ? -1 : 1);
            return st;
        };
        menu.postProc = (st) => {
            st.cards = [];
            st.cards = st.cards.concat(st.settings.cardTypeSettings["simpleCards"]);
            st.cards = st.cards.concat(st.settings.cardTypeSettings["clozeCards"]);
            st.cards = st.cards.concat(st.settings.cardTypeSettings["multiCards"]);
            st.cards = st.cards.concat([...st.settings.pushcardQueue.accepted.map((j) => (0, utils_1.recursiveRepairJSON)(j.data, (0, spaced_repetition_universal_types_1.makeEmptyCard)(j.data.cardType, st.settings)))]);
            for (var i = 0; i < st.cards.length; i++) {
                // Add any missing fields to new cards, e.g. guid and created timestamp 
                st.cards[i] = (0, utils_1.recursiveRepairJSON)(st.cards[i], (0, spaced_repetition_universal_types_1.makeEmptyCard)(st.cards[i].cardType, st.settings));
            }
            st.settings.pushcardQueue.accepted = [];
            st.cards = makeSRCardDict(st.cards);
            delete st.settings.cardTypeSettings["simpleCards"];
            delete st.settings.cardTypeSettings["clozeCards"];
            delete st.settings.cardTypeSettings["multiCards"];
            return st;
        };
        menu.setState(st);
        return menu;
    }
}
exports.UniversalSpacedRepGen = UniversalSpacedRepGen;
(0, flashcard_deck_1.registerDeckType)(new UniversalSpacedRepGen(), "universal-spaced-repetition-deck", "Universal spaced repetition deck", exports.defaultSRUniversalState, "#eaa9fc");
