import {
    IDictionary,
    shuffleArr
} from "./utils"

export type SRNewQueue = {
    maxNewCards: number,
    newQueue: string[],
}

export function chooseNext(q: SRNewQueue, allOpts: string[]): string | undefined {
    var newOpts = allOpts.filter((k) => !(k in q.newQueue));
    if (q.newQueue.length < q.maxNewCards && newOpts.length > 0) {
        return newOpts[Math.floor(Math.random() * newOpts.length)];
    } else if (q.newQueue.length > 0) {
        return q.newQueue[0];
    } else {
        return undefined;
    }
}

export function incorporateLast(q: SRNewQueue, c: string | undefined): SRNewQueue {
    if (c === undefined) {
        return q;
    }
    if (c === q.newQueue[0]) {
        q.newQueue.shift();
    }
    q.newQueue.push(c);
    return q;
}
