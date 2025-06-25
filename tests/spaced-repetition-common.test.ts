import {
    FlashcardResult
} from "../src/flashcard-generator"
import {
    SpacedRepState,
    SpacedRepCard,
    SpacedRepStudying,
    makeSpacedRepCardDict,
    AbstractSpacedRepGen
} from "../src/spaced-repetition-general"
import {
    SimpleSpacedRepGen,
    SRSimpleContent,
    SRSimpleAuxData,
    SRSimpleSettings,
    defaultSimpleSRState
} from "../src/spaced-repetition-simple"

function studyAllNewCards<content, timing, settings>(
    fgen: AbstractSpacedRepGen<content, timing, settings>,
    st: SpacedRepState<content, timing, settings>):
    SpacedRepState<content, timing, settings> {
    var prevStudying = st.studying;
    st.studying = SpacedRepStudying.NewCards;
    var x = fgen.getNextCard(st);
    var i = 0;
    while (x.data !== undefined) {
        i += 1;
        st = fgen.updateState(st, x, FlashcardResult.Correct);
        x = fgen.getNextCard(st);
        expect(i > 100000).toBe(false);
    }
    st.studying = prevStudying;
    return st; 
}

function advanceMins<content, timing, settings>(
    mins: number, 
    fgen: AbstractSpacedRepGen<content, timing, settings>
) {
    var dt: Date = new Date();
    dt.setTime(fgen.getDate().getTime() + mins*60*1000);
    fgen.setDate(dt);
}

const cardPairList: [string, string][] = [
    ["a", "a"],
    ["b", "b"],
    ["c", "c"],
    ["d", "d"]
];

export function makeSharedSRTests<content, timing, settings> (
    genName: string,
    mkState: (prs: [string, string][]) => SpacedRepState<content, timing, settings>,
    mkGen: () => AbstractSpacedRepGen<content, timing, settings>
) {
    describe(`${genName} spaced repetition generator common unit tests`, () => {

        test('can generate cards', () => {
            var st = mkState(cardPairList); 
            st.studying = SpacedRepStudying.NewCards; 
            var fgen = mkGen(); 
            var i = 0;
            for (i = 0; i < 10; i++) {
                var x = fgen.getNextCard(st);
                expect(x.data).toBeDefined();
                fgen.updateState(st, x, FlashcardResult.Correct);
            }
        });

        test('cannot generate new cards indefinitely', () => {
            var st = mkState(cardPairList);
            st.studying = SpacedRepStudying.NewCards; 
            var fgen = mkGen(); 
            var i = 0;
            for (i = 0; i < 12; i++) {
                var x = fgen.getNextCard(st);
                expect(x.data).toBeDefined();
                fgen.updateState(st, x, FlashcardResult.Correct);
            }
            var x = fgen.getNextCard(st);
            expect(x.data).toBeUndefined();
        });

        test('date getter and setter on test class works', () => {
            var fgen = mkGen();
            var dt = new Date();
            dt.setHours(10);
            fgen.setDate(dt);
            expect(fgen.getDate()).toBe(dt);
        });

        test('there are not initially any due cards', () => {
            var st = mkState(cardPairList);
            st.studying = SpacedRepStudying.DueCards; 
            var fgen = mkGen(); 
            var x = fgen.getNextCard(st);
            expect(x.data).toBeUndefined();
        });

        test('new cards come due after enough hours', () => {
            var st = mkState(cardPairList);
            st.studying = SpacedRepStudying.NewCards; 
            var fgen = mkGen(); 
            st = studyAllNewCards(fgen, st);

            st.studying = SpacedRepStudying.DueCards;
            var dt = new Date();
            dt.setTime(fgen.getDate().getTime() + 10000 * 60*60*1000);
            fgen.setDate(dt);
            var x = fgen.getNextCard(st);
            expect(x.data).toBeDefined();
        });

        test('due cards can be studied each day for many days', () => {
            var st = mkState(cardPairList);
            st.studying = SpacedRepStudying.NewCards;
            var fgen = mkGen();
            st = studyAllNewCards(fgen, st);
           
            var i = 0; 
            st.studying = SpacedRepStudying.DueCards;
            for (i = 0; i < 100; i++) {
                var x = fgen.getNextCard(st);
                while (x.data !== undefined) {
                    st = fgen.updateState(st, x, FlashcardResult.Correct);
                    x = fgen.getNextCard(st);
                }
                var dt = new Date();
                dt.setTime(fgen.getDate().getTime() + 24*60*60*1000);
                fgen.setDate(dt);
            }
        });

        test('number of due cards decreases by 1 precisely when card is marked correct', () => {
            var st = mkState(Array.from(Array(100).keys()).map((x) => [''+x, ''+x]));
            var fgen = mkGen();
            st = studyAllNewCards(fgen, st);

            var i = 0;
            st.studying = SpacedRepStudying.DueCards;
            advanceMins(10000 * 60, fgen);
            var x = fgen.getNextCard(st);
            while (x.data !== undefined) {
                var prevCardsLeft = x.context.cardsLeft;
                var correct = Math.random() < 0.5;
                var prevInterval = x.data.intervalMinutes;
                st = fgen.updateState(st, x, correct ? FlashcardResult.Correct : FlashcardResult.Incorrect);
                var nextInterval = st.cards[x.data.guid].intervalMinutes;
                expect(nextInterval == 0).toBe(false);
                expect(nextInterval >= prevInterval).toBe(correct);

                x = fgen.getNextCard(st);
                var currCardsLeft = x.context.cardsLeft;
                expect(currCardsLeft).toBe(prevCardsLeft - (correct ? 1 : 0));
                expect(correct).toBe(currCardsLeft == prevCardsLeft - 1);
            }
        });
    });
}

/* Simple SR deck */

function makeSimpleSRTestState(pairs: [string, string][]) {
    var st = JSON.parse(JSON.stringify(defaultSimpleSRState));
    st.cards = makeSpacedRepCardDict(
        pairs.map((pr) => { return { prompt: pr[0], answers: [pr[1]], tags: [] }}),
        () => { return { streak: 0, intervalMinutes: 0, due: new Date() }; }
    );
    return st;
}

function makeSimpleSRGenerator(): SimpleSpacedRepGen {
    var fgen = new SimpleSpacedRepGen();
    fgen.setDate(new Date());
    return fgen;
}

makeSharedSRTests('simple', makeSimpleSRTestState, makeSimpleSRGenerator);

/* Any other SR decks down here? */

