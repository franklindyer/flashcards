import {
    IDictionary,
    guidGenerator
} from "./lib"
import {
    weightedRandom
} from "./weighted-rand"

interface WithTags {
    tags: string[];
    rels: IDictionary<string[]>; // Disjunctive restrictions on what tags the words it relates to have
    guid: string;
}

type WordRelation = {
    rel: string,
    relWordType: string,
    relWordId: number
}

type WordHole = {
    wordType: string,
    wordTags: string[], // Conjunctive restrictions on what tags of words may fill this hole
    rels: WordRelation[]
}

class WordSatChecker {
    allWords: IDictionary<WithTags[]>;
    // cache: IDictionary<WithTags[]>;

    constructor(words: IDictionary<WithTags[]>) {
        this.allWords = words;
    }

    satisfiesRelation(w: WithTags, r: WordRelation, ctx: IDictionary<WithTags[]>): boolean {
        var relatedTo = ctx[r.relWordType][r.relWordId];
        var tagOpts = relatedTo.rels[r.rel];
        return tagOpts.some((t) => w.tags.includes(t)); 
    }

    canFillHole(w: WithTags, h: WordHole, ctx: IDictionary<WithTags[]>): boolean {
        return h.rels.every((r) => this.satisfiesRelation(w, r, ctx));
    }

    getGuessesForHole(h: WordHole, ctx: IDictionary<WithTags[]>): WithTags[] {
        var choices = this.allWords[h.wordType];
        choices = choices.filter((w) => h.wordTags.every((t) => w.tags.includes(t)));
        choices = choices.filter((w) => this.canFillHole(w, h, ctx));
        return choices;
    }

    fillHoles(hs: WordHole[], ctx: IDictionary<WithTags[]>, weight: (w: WithTags) => number): IDictionary<WithTags[]> | undefined {
        var i = 0;
        while (i < hs.length) {
            var h = <WordHole>hs[i];
            var choices = this.getGuessesForHole(h, ctx);
            if (choices.length === 0) return undefined; // Failure
            var w = weightedRandom(choices, weight, Math.random());
            ctx[h.wordType].push(w);
            i++;
        }
        return ctx;
    }
}

// Demo example

type DemoWord = {
    text: string,
    tags: string[],
    rels: IDictionary<string[]>,
    guid: string
}

var demoNouns: DemoWord[] = [
    { text: "man", tags: ["person"], rels: {}, guid: guidGenerator() },
    { text: "woman", tags: ["person"], rels: {}, guid: guidGenerator() },
    { text: "child", tags: ["person"], rels: {}, guid: guidGenerator() },
    { text: "book", tags: ["item", "topical", "legible"], rels: {}, guid: guidGenerator() },
    { text: "movie", tags: ["topical"], rels: {}, guid: guidGenerator() },
    { text: "toy", tags: ["item"], rels: {}, guid: guidGenerator() },
    { text: "ball", tags: ["item"], rels: {}, guid: guidGenerator() },
    { text: "sign", tags: ["object", "legible"], rels: {}, guid: guidGenerator() },
    { text: "room", tags: ["place"], rels: {}, guid: guidGenerator() },
    { text: "school", tags: ["place"], rels: {}, guid: guidGenerator() },
    { text: "house", tags: ["place"], rels: {}, guid: guidGenerator() }
]

var demoVerbs: DemoWord[] = [
    { text: "read", tags: ["intrans", "trans"], rels: { "subj": ["person"], "obj": ["legible"] }, guid: guidGenerator() },
    { text: "jump", tags: ["intrans"], rels: { "subj": ["person"] }, guid: guidGenerator() },
    { text: "have", tags: ["trans"], rels: { "subj": ["person"], "obj": ["item"] }, guid: guidGenerator() },
    { text: "buy", tags: ["trans"], rels: { "subj": ["person"], "obj": ["item"] }, guid: guidGenerator() }
];

var demoLib: IDictionary<WithTags[]> = {
    "n": demoNouns,
    "v": demoVerbs
}

var checker = new WordSatChecker(demoLib);

var locPhraseHoles = [
    { wordType: "n", wordTags: ["item"], rels: [] },
    { wordType: "n", wordTags: ["place"], rels: [] }
];

var intransHoles = [
    { wordType: "v", wordTags: ["intrans"], rels: [] },
    { wordType: "n", wordTags: [], rels: [{ rel: "subj", relWordType: "v", relWordId: 0 }] }
];

for (var i = 0; i < 20; i++) {
    console.log("HIHIHI");
    var ctx = <IDictionary<any>>checker.fillHoles(locPhraseHoles, { "n": [], "v": [] }, (w) => 1.0);
    console.log(`${ctx['n'][0].text} is in ${ctx['n'][1].text}`);
    var ctx = <IDictionary<any>>checker.fillHoles(intransHoles, { "n": [], "v": [] }, (w) => 1.0);
    console.log(`${ctx['n'][0].text} ${ctx['v'][0].text}`);
}
