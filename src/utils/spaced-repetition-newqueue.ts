export type SRNewQueue = {
    maxNewCards: number,
    newQueue: string[],
}

export function emptySRQueue(maxNewCards: number) {
    return {
        maxNewCards: maxNewCards,
        newQueue: []
    };
}

export function chooseNext(q: SRNewQueue, allOpts: string[]): string | undefined {
    var newOpts = allOpts.filter((k) => !q.newQueue.includes(k));
    
    if (q.newQueue.length > 0 && allOpts.includes(q.newQueue[0])) {
        return q.newQueue[0];
    } else {
        return undefined;
    }
}

export function incorporateLast(
    q: SRNewQueue, 
    c: string | undefined,
    isStillNew: boolean): 
    SRNewQueue {
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

export function filterNewQueue(q: SRNewQueue, fxn: (id: string) => boolean) {
    q.newQueue = q.newQueue.filter(fxn);
    return q;
}

export function deduplicateQueue(q: SRNewQueue) {
    var ddQ: string[] = [];
    for (var x of q.newQueue) {
        if (!ddQ.includes(x)) {
            ddQ.push(x);
        }
    }
    q.newQueue = ddQ;
    return q;
}

export function refillNewQueue(
    q: SRNewQueue, 
    allOpts: string[],
    refillOnlyWhenEmpty: boolean = false): SRNewQueue {
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
