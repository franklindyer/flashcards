import {
    SRNewQueue,
    emptySRQueue,
    chooseNext,
    incorporateLast,
    filterNewQueue,
    deduplicateQueue,
    refillNewQueue
} from "../src/utils/spaced-repetition-newqueue"

function numberStrings(n: number) {
    return [...[...new Array(n).keys()].map((n) => n.toString())];
}

describe('SR new queue works correctly', () => {

    test('newqueue refills to the correct amount', () => {
        var newOptions: string[] = numberStrings(100); 
        var q: SRNewQueue = emptySRQueue(10);
        q = refillNewQueue(q, newOptions);
        expect(q.newQueue.length).toEqual(10);
    });

    test('precisely the cards marked as no longer new are removed', () => {
        var newOptions: string[] = numberStrings(100); 
        var q: SRNewQueue = emptySRQueue(10);

        var isStillNewSeq = [...[...new Array(100).keys()].map((n) => Math.random() < 0.5)]
        for (var b of isStillNewSeq) {
            var c = chooseNext(q, newOptions);
            expect(c).toBeDefined();
            q = incorporateLast(q, c, b);
            if (b) {
                expect(q.newQueue).toContain(c);
            } else {
                expect(q.newQueue).not.toContain(c);
            }
        }
    });

    test('cards in new queue are studied in cyclic order', () => {
        var newOptions: string[] = numberStrings(100); 
        var q: SRNewQueue = emptySRQueue(10);

        var cardSeq: string[] = [];
        for (var i = 0; i < 100; i++) {
            var c = chooseNext(q, newOptions);
            expect(c).toBeDefined();
            cardSeq.push(c!);
            q = incorporateLast(q, c, true);
            expect(q.newQueue).toContain(c);
        }

        for (var i = 0; i < 100; i++) {
            expect(cardSeq[i % 10]).toEqual(cardSeq[i]);
        }       
    });

    test('queue is refilled in batches when the argument is set', () => {
        var newOptions: string[] = numberStrings(100); 
        var q: SRNewQueue = emptySRQueue(10);

        var cardSeq: string[] = [];
        var lastQEmptiedTime = -1;
        var lastQFilledTime = -1;
        var prevQSize = -1;
        for (var i = 0; i < 100; i++) {
            var c = chooseNext(q, newOptions, true);
            cardSeq.push(c!);
            var isStillNew = Math.random() < 0.5;
            if (!isStillNew) {
                newOptions = [...newOptions.filter((n) => n != c)];
            }
            q = incorporateLast(q, c, isStillNew);

            if (q.newQueue.length == 0) {
                lastQEmptiedTime = i;
            }
            if (q.newQueue.length == q.maxNewCards) {
                lastQFilledTime = i;
            }
 
            if (lastQEmptiedTime > lastQFilledTime && i > lastQEmptiedTime) {
                expect(q.newQueue.length).toBeGreaterThanOrEqual(prevQSize);
            } else if (lastQEmptiedTime < lastQFilledTime && i > lastQFilledTime) {
                expect(q.newQueue.length).toBeLessThanOrEqual(prevQSize);
            }

            prevQSize = q.newQueue.length;
            console.log(prevQSize);
        }
    });

    // test('queue is refilled continuously when the argument is not set', () => {});

    // test('', () => {});
    // test('', () => {});

});
