"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emptySRQueue = emptySRQueue;
exports.chooseNext = chooseNext;
exports.incorporateLast = incorporateLast;
function emptySRQueue(maxNewCards) {
    return {
        maxNewCards: maxNewCards,
        newQueue: []
    };
}
function chooseNext(q, allOpts) {
    var newOpts = allOpts.filter((k) => !q.newQueue.includes(k));
    if (q.newQueue.length < q.maxNewCards && newOpts.length > 0) {
        return newOpts[Math.floor(Math.random() * newOpts.length)];
    }
    else if (q.newQueue.length > 0) {
        return q.newQueue[0];
    }
    else {
        return undefined;
    }
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
    return q;
}
