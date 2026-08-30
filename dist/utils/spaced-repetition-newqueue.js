"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emptySRQueue = emptySRQueue;
exports.chooseNext = chooseNext;
exports.incorporateLast = incorporateLast;
exports.filterNewQueue = filterNewQueue;
exports.deduplicateQueue = deduplicateQueue;
exports.refillNewQueue = refillNewQueue;
function emptySRQueue(maxNewCards) {
    return {
        maxNewCards: maxNewCards,
        newQueue: [],
        refilling: true
    };
}
function chooseNext(q, allOpts, refillOnlyWhenEmpty = false) {
    var newOpts = allOpts.filter((k) => !q.newQueue.includes(k));
    var qNotFull = q.newQueue.length < q.maxNewCards;
    if (((qNotFull && !refillOnlyWhenEmpty) || q.newQueue.length == 0) && newOpts.length > 0) {
        return newOpts[0];
    }
    if (q.refilling && newOpts.length > 0) {
        return newOpts[0];
    }
    else if (q.newQueue.length > 0) {
        return q.newQueue[0];
    }
    return undefined;
}
function incorporateLast(q, c, isStillNew) {
    if (c === undefined) {
        return q;
    }
    if (c === q.newQueue[0]) {
        q.newQueue.shift();
    }
    if (isStillNew) {
        q.newQueue.push(c);
    }
    if (q.newQueue.length >= q.maxNewCards) {
        q.refilling = false;
    }
    else if (q.newQueue.length == 0) {
        q.refilling = true;
    }
    return q;
}
function filterNewQueue(q, fxn) {
    q.newQueue = q.newQueue.filter(fxn);
    return q;
}
function deduplicateQueue(q) {
    var ddQ = [];
    for (var x of q.newQueue) {
        if (!ddQ.includes(x)) {
            ddQ.push(x);
        }
    }
    q.newQueue = ddQ;
    return q;
}
function refillNewQueue(q, allOpts, refillOnlyWhenEmpty = false) {
    q.newQueue = [...q.newQueue.filter((id) => allOpts.includes(id))];
    var cardsNeeded = q.maxNewCards - q.newQueue.length;
    if (refillOnlyWhenEmpty && (q.newQueue.length > 0)) {
        cardsNeeded = 0;
    }
    if (cardsNeeded == 0) {
        return q;
    }
    var cardsAdding = Math.min(allOpts.length, cardsNeeded);
    var nextCards = allOpts.slice(0, cardsAdding);
    nextCards.forEach((s) => q.newQueue.push(s));
    q = deduplicateQueue(q);
    return q;
}
