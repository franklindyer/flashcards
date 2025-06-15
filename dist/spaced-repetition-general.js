"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractSpacedRepGen = void 0;
const flashcard_generator_1 = require("./flashcard-generator");
var SpacedRepStudying;
(function (SpacedRepStudying) {
    SpacedRepStudying[SpacedRepStudying["NewCards"] = 1] = "NewCards";
    SpacedRepStudying[SpacedRepStudying["DueCards"] = 2] = "DueCards";
    SpacedRepStudying[SpacedRepStudying["RandomCards"] = 3] = "RandomCards";
})(SpacedRepStudying || (SpacedRepStudying = {}));
class AbstractSpacedRepGen extends flashcard_generator_1.FlashcardGen {
    getNew(st) {
        return Object.keys(st.cards).filter((k) => this.cardIsNew(st.cards[k]));
    }
    getDue(st) {
        return Object.keys(st.cards).filter((k) => this.cardIsDue(st.cards[k]));
    }
    pickSpacedRepCard(st) {
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
                        cardsLeft: newInds.length + st.newQueue.length,
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
        var cardNewState = this.updateCard(st.settings, card, result);
        if (this.cardIsNew(cardState)) {
            if (!st.newQueue.includes(cardData.guid)) {
                st.newQueue.push(cardData.guid);
            }
            if (this.cardIsDue(cardNewState)) {
                st.newQueue = st.newQueue.filter((i) => i != cardData.guid);
            }
            if (st.studying == SpacedRepStudying.NewCards) {
                var maxNewQueueSize = Math.min(st.newQueueSize, this.getNew(st).length);
                st.newQueue = st.newQueue.slice(0, st.newQueueSize);
                st.newIndex += 1;
                if (st.newIndex >= maxNewQueueSize) {
                    st.newIndex = 0;
                }
            }
        }
        st.cards[cardGuid] = cardNewState;
        return st;
    }
}
exports.AbstractSpacedRepGen = AbstractSpacedRepGen;
