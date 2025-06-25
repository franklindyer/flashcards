"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractSpacedRepGen = exports.SpacedRepStudying = void 0;
exports.makeSpacedRepCardDict = makeSpacedRepCardDict;
const utils_1 = require("./utils");
const flashcard_generator_1 = require("./flashcard-generator");
const flashcard_sync_generator_1 = require("./flashcard-sync-generator");
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
class AbstractSpacedRepGen extends flashcard_sync_generator_1.FlashcardSyncGen {
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
        return Object.keys(st.cards).filter((k) => this.cardIsNew(st.cards[k]));
    }
    getDue(st) {
        return Object.keys(st.cards).filter((k) => this.cardIsDue(st.cards[k]));
    }
    getNextCard(st) {
        var inds = Object.keys(st.cards);
        var newInds = this.getNew(st);
        var dueInds = this.getDue(st);
        switch (st.studying) {
            case SpacedRepStudying.NewCards:
                if (newInds.length == 0 && st.newQueue.length == 0) {
                    return { data: undefined, context: { cardsLeft: 0, isPractice: false } };
                }
                var newInd;
                if (st.newIndex < st.newQueue.length) {
                    newInd = st.newQueue[st.newIndex];
                }
                else {
                    newInd = newInds[Math.floor(Math.random() * newInds.length)];
                }
                return {
                    data: st.cards[newInd],
                    context: {
                        cardsLeft: newInds.length,
                        isPractice: false
                    }
                };
            case SpacedRepStudying.DueCards:
                if (dueInds.length == 0) {
                    return { data: undefined, context: { cardsLeft: 0, isPractice: false } };
                }
                var dueInd = dueInds[Math.floor(Math.random() * dueInds.length)];
                return {
                    data: st.cards[dueInd],
                    context: {
                        cardsLeft: dueInds.length,
                        isPractice: false
                    }
                };
            case SpacedRepStudying.RandomCards:
                var ind = inds[Math.floor(Math.random() * inds.length)];
                return {
                    data: st.cards[ind],
                    context: {
                        cardsLeft: 0,
                        isPractice: true
                    }
                };
        }
        return {
            data: undefined,
            context: {
                cardsLeft: 0,
                isPractice: false
            }
        };
    }
    updateState(st, card, result) {
        if (result == flashcard_generator_1.FlashcardResult.Unanswered || st.studying == SpacedRepStudying.RandomCards)
            return st;
        var cardData = card.data;
        var correct = (result == flashcard_generator_1.FlashcardResult.Correct);
        var cardGuid = cardData.guid;
        var cardState = st.cards[cardGuid];
        var cardNewState = this.updateCard(card, st.settings, result);
        if (st.studying == SpacedRepStudying.NewCards) {
            if (!st.newQueue.includes(cardData.guid)) {
                st.newQueue.push(cardData.guid);
            }
            if (!this.cardIsNew(cardNewState)) {
                st.newQueue = st.newQueue.filter((i) => i != cardData.guid);
            }
            var maxNewQueueSize = Math.min(st.newQueueSize, this.getNew(st).length);
            st.newQueue = st.newQueue.slice(0, st.newQueueSize);
            st.newIndex += 1;
            if (st.newIndex >= maxNewQueueSize) {
                st.newIndex = 0;
                st.newQueue = st.newQueue.sort((a, b) => 0.5 - Math.random());
            }
        }
        st.cards[cardGuid] = cardNewState;
        return st;
    }
}
exports.AbstractSpacedRepGen = AbstractSpacedRepGen;
