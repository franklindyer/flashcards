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
        q = refillNewQueue(q, newOptions);

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

    // test('cards in new queue are studied in cyclic order', () => {});
    // test('queue is refilled in batches when the argument is set', () => {});
    // test('queue is refilled continuously when the argument is not set', () => {});

    // test('', () => {});
    // test('', () => {});

});
