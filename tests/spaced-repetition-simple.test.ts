import {
    FlashcardResult
} from "../src/flashcard-generator"
import {
    SpacedRepState,
    SpacedRepCard,
    SpacedRepStudying,
    makeSpacedRepCardDict
} from "../src/spaced-repetition-general"
import {
    SimpleSpacedRepGen,
    SRSimpleContent,
    SRSimpleTiming,
    SRSimpleSettings,
    defaultSimpleSRState
} from "../src/spaced-repetition-simple"

class SimpleSpacedRepTestGen extends SimpleSpacedRepGen {
    setDate(newDt: Date) { this.getDate = () => newDt; }
}

function makeSimpleSRTestState(pairs: string[][]) {
    var st = JSON.parse(JSON.stringify(defaultSimpleSRState));
    st.cards = makeSpacedRepCardDict(
        pairs.map((pr) => { return { prompt: pr[0], answers: [pr[1]], tags: [] }}),
        () => { return { streak: 0, intervalMinutes: 0, due: undefined }; }
    );
    return st;
}

function makeSimpleSRGenerator(): SimpleSpacedRepTestGen {
    var fgen = new SimpleSpacedRepTestGen();
    fgen.setDate(new Date());
    return fgen;
}

function studyAllNewCards(
    fgen: SimpleSpacedRepTestGen,
    st: SpacedRepState<SRSimpleContent, SRSimpleTiming, SRSimpleSettings>):
    SpacedRepState<SRSimpleContent, SRSimpleTiming, SRSimpleSettings> {
    var prevStudying = st.studying;
    st.studying = SpacedRepStudying.NewCards;
    var x = fgen.getNextCard(st);
    while (x.data !== undefined) {
        st = fgen.updateState(st, x, FlashcardResult.Correct);
        x = fgen.getNextCard(st);
    }
    st.studying = prevStudying;
    return st; 
}

const cardPairList = [
    ["a", "a"],
    ["b", "b"],
    ["c", "c"],
    ["d", "d"]
];

describe('simple spaced repetition generator unit tests', () => {

    test('can generate cards', () => {
        var st = makeSimpleSRTestState(cardPairList);
        st.studying = SpacedRepStudying.NewCards; 
        var fgen = makeSimpleSRGenerator(); 
        var i = 0;
        for (i = 0; i < 10; i++) {
            var x = fgen.getNextCard(st);
            expect(x.data).toBeDefined();
            fgen.updateState(st, x, FlashcardResult.Correct);
        }
    });

    test('cannot generate new cards indefinitely', () => {
        var st = makeSimpleSRTestState(cardPairList);
        st.studying = SpacedRepStudying.NewCards; 
        var fgen = makeSimpleSRGenerator(); 
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
        var fgen = makeSimpleSRGenerator();
        var dt = new Date();
        dt.setHours(10);
        fgen.setDate(dt);
        expect(fgen.getDate()).toBe(dt);
    });

    test('there are not initially any due cards', () => {
        var st = makeSimpleSRTestState(cardPairList);
        st.studying = SpacedRepStudying.DueCards; 
        var fgen = makeSimpleSRGenerator(); 
        var x = fgen.getNextCard(st);
        expect(x.data).toBeUndefined();
    });

    test('new cards come due after enough hours', () => {
        var st = makeSimpleSRTestState(cardPairList);
        st.studying = SpacedRepStudying.NewCards; 
        var fgen = makeSimpleSRGenerator(); 
        st = studyAllNewCards(fgen, st);

        st.studying = SpacedRepStudying.DueCards;
        var dt = new Date();
        dt.setTime(fgen.getDate().getTime() + (st.settings.initialHours * 60*60*1000));
        fgen.setDate(dt);
        var x = fgen.getNextCard(st);
        expect(x.data).toBeDefined();
    });

    test('due cards can be studied each day for many days', () => {
        var st = makeSimpleSRTestState(cardPairList);
        st.studying = SpacedRepStudying.NewCards;
        var fgen = makeSimpleSRGenerator();
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
});

