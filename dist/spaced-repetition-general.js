"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractSpacedRepGen = exports.AbstractAsyncSpacedRepGen = exports.SpacedRepStudying = void 0;
exports.makeSpacedRepCardDict = makeSpacedRepCardDict;
const utils_1 = require("./utils");
const flashcard_generator_1 = require("./flashcard-generator");
const spaced_repetition_newqueue_1 = require("./spaced-repetition-newqueue");
var SpacedRepStudying;
(function (SpacedRepStudying) {
    SpacedRepStudying[SpacedRepStudying["NewCards"] = 1] = "NewCards";
    SpacedRepStudying[SpacedRepStudying["DueCards"] = 2] = "DueCards";
    SpacedRepStudying[SpacedRepStudying["RandomCards"] = 3] = "RandomCards";
})(SpacedRepStudying || (exports.SpacedRepStudying = SpacedRepStudying = {}));
function makeSpacedRepCardDict(cards, defaultAuxData) {
    var cardDict = {};
    for (var i in cards) {
        var c = cards[i];
        var guid = (0, utils_1.guidGenerator)();
        cardDict[guid] = { guid: guid, content: c, due: new Date(), intervalMinutes: 0, auxdata: defaultAuxData() };
    }
    return cardDict;
}
class AbstractAsyncSpacedRepGen extends flashcard_generator_1.FlashcardGen {
    getDate = () => new Date();
    // For unit testing
    setDate(newDt) { this.getDate = () => newDt; }
    cardIsDue(card) {
        return (card.intervalMinutes > 0 && new Date(card.due).valueOf() < this.getDate().valueOf());
    }
    ;
    cardIsNew(card) {
        return (card.intervalMinutes == 0);
    }
    ;
    updateCard(card, settings, correct) {
        if (card.context.isPractice) {
            return card.data;
        }
        var isNew = card.data.intervalMinutes == 0;
        var newAuxData = this.updateAuxData(card, settings, correct);
        card.data.auxdata = newAuxData;
        var newInterval = this.updateInterval(card, settings, correct);
        card.data.intervalMinutes = newInterval;
        // Interval > 0 implies the card is no longer new
        // Only reschedule the card if it was answered correctly
        if (correct == flashcard_generator_1.FlashcardResult.Correct && newInterval > 0) {
            card.data.due = this.getDate();
            card.data.due.setHours(card.data.due.getHours() + card.data.intervalMinutes / 60);
        }
        return card.data;
    }
    getNew(st) {
        return Object.keys(st.cards).filter((k) => this.cardIsNew(st.cards[k]) && this.cardIsEnabled(st.cards[k], st));
    }
    getDue(st) {
        return Object.keys(st.cards).filter((k) => this.cardIsDue(st.cards[k]) && this.cardIsEnabled(st.cards[k], st));
    }
    getNextCardAsync(st) {
        var inds = Object.keys(st.cards);
        var newInds = this.getNew(st);
        var dueInds = this.getDue(st);
        switch (st.studying) {
            case SpacedRepStudying.NewCards:
                var newGuid = (0, spaced_repetition_newqueue_1.chooseNext)(st.newQ, newInds);
                if (newGuid === undefined) {
                    return this.nextCardAsyncPreprocessing({
                        data: undefined,
                        context: { cardsLeft: 0, isPractice: false }
                    }, st);
                }
                return this.nextCardAsyncPreprocessing({
                    data: st.cards[newGuid],
                    context: {
                        cardsLeft: newInds.length,
                        isPractice: false
                    }
                }, st);
            case SpacedRepStudying.DueCards:
                if (dueInds.length == 0) {
                    return (0, utils_1.trivialPromise)({ data: undefined, context: { cardsLeft: 0, isPractice: false } });
                }
                var dueInd = dueInds[Math.floor(Math.random() * dueInds.length)];
                return this.nextCardAsyncPreprocessing({
                    data: st.cards[dueInd],
                    context: {
                        cardsLeft: dueInds.length,
                        isPractice: false
                    }
                }, st);
            case SpacedRepStudying.RandomCards:
                var ind = inds[Math.floor(Math.random() * inds.length)];
                return this.nextCardAsyncPreprocessing({
                    data: st.cards[ind],
                    context: {
                        cardsLeft: 0,
                        isPractice: true
                    }
                }, st);
        }
        return this.nextCardAsyncPreprocessing({
            data: undefined,
            context: {
                cardsLeft: 0,
                isPractice: false
            }
        }, st);
    }
    updateStateAsync(st, card, result) {
        if (result == flashcard_generator_1.FlashcardResult.Unanswered || st.studying == SpacedRepStudying.RandomCards)
            return (0, utils_1.trivialPromise)(st);
        var cardData = card.data;
        var correct = (result == flashcard_generator_1.FlashcardResult.Correct);
        var cardGuid = cardData.guid;
        var cardState = st.cards[cardGuid];
        var cardNewState = this.updateCard(card, st.settings, result);
        // If card is still new, stick it back in the queue
        if (st.studying == SpacedRepStudying.NewCards) {
            st.newQ = (0, spaced_repetition_newqueue_1.incorporateLast)(st.newQ, cardGuid, this.cardIsNew(cardNewState));
        }
        st.cards[cardGuid] = cardNewState;
        return (0, utils_1.trivialPromise)(st);
    }
}
exports.AbstractAsyncSpacedRepGen = AbstractAsyncSpacedRepGen;
class AbstractSpacedRepGen extends AbstractAsyncSpacedRepGen {
    nextCardAsyncPreprocessing(c, state) {
        return (0, utils_1.trivialPromise)(c);
    }
    generateCardAsync(data) {
        return new Promise((resolve, _) => { resolve(this.generateCard(data)); });
    }
    checkAnswerAsync(answer, state, data) {
        return new Promise((resolve, _) => { resolve(this.checkAnswer(answer, state, data)); });
    }
}
exports.AbstractSpacedRepGen = AbstractSpacedRepGen;
