import {
    FlashcardResult
} from "../src/core/flashcard-generator"
import {
    KVFlashcardState,
    KVFlashcardGen
} from "../src/decks/uniform-key-value"

function makeKVTestState(): KVFlashcardState {
    return {
        deck: [
            ["a", "a"],
            ["b", "b"],
            ["c", "c"],
            ["d", "d"]
        ],
        history: []
    };
}

describe('uniform key-value generator unit tests', () => {
    test('can generate cards', () => {
        var st = makeKVTestState();
        var fgen = new KVFlashcardGen();
        var i = 0;
        for (i = 0; i < 20; i++) {
            var x = fgen.getNextCard(st);
            expect(["a", "b", "c", "d"]).toContain(x[0]);
        }
    });

    test('generated cards appear uniformly distributed', () => {
        var st = makeKVTestState();
        var fgen = new KVFlashcardGen();
        var results = Array(1000).fill(0).map((_) => fgen.getNextCard(st)[0]);

        var numAs = results.filter((x) => x === "a").length;
        expect(numAs).toBeGreaterThanOrEqual(100);
        expect(numAs).toBeLessThanOrEqual(400);
        
        var numBs = results.filter((x) => x === "b").length;
        expect(numBs).toBeGreaterThanOrEqual(100);
        expect(numBs).toBeLessThanOrEqual(400);
    });

    test('deck state does not change', () => {
        var st = makeKVTestState();
        var st0 = makeKVTestState();
        var fgen = new KVFlashcardGen();

        var i = 0;
        for (i = 0; i < 100; i++) {
            var x = fgen.getNextCard(st);
            fgen.updateState(st, x, FlashcardResult.Correct);
        }

        expect(st.deck).toStrictEqual(st0.deck); 
    });
});
