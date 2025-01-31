"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WordPicker = exports.WordRelChecker = void 0;
const weighted_rand_1 = require("./weighted-rand");
class WordRelChecker {
    constructor(words) {
        this.allWords = words;
    }
    addSubtag(wordType, childTag, parentTag) {
        for (var i in Object.keys(this.allWords[wordType])) {
            var w = this.allWords[wordType][i];
            if (w.tags.includes(childTag) && !w.tags.includes(parentTag)) {
                w.tags.push(parentTag);
            }
        }
    }
    satisfiesRelation(w, r, ctx) {
        var relatedTo = ctx[r.relWordType][r.relWordId];
        if (r.rel[0] == "<") {
            var tagOpts = w.rels[r.rel.slice(1)];
            return tagOpts.some((t) => relatedTo.tags.includes(t));
        }
        else {
            var tagOpts = relatedTo.rels[r.rel];
            return tagOpts.some((t) => w.tags.includes(t));
        }
    }
    canFillHole(w, h, ctx) {
        return h.rels.every((r) => this.satisfiesRelation(w, r, ctx));
    }
    getGuessesForHole(h, ctx) {
        var choices = this.allWords[h.wordType];
        choices = choices.filter((w) => h.wordTags.every((t) => w.tags.includes(t)));
        choices = choices.filter((w) => this.canFillHole(w, h, ctx));
        return choices;
    }
    fillHoles(hs, ctx, weight) {
        var i = 0;
        while (i < hs.length) {
            var h = hs[i];
            var choices = this.getGuessesForHole(h, ctx);
            if (choices.length === 0)
                return undefined; // Failure
            var w = (0, weighted_rand_1.weightedRandom)(choices, weight, Math.random());
            ctx[h.wordType].push(w);
            i++;
        }
        return ctx;
    }
    tryFillHoles(hs, ctx, weight) {
        var d = undefined;
        var numAttempts = 0;
        while (d === undefined) {
            if (numAttempts > 20) {
                throw new Error("Too many attempts.");
            }
            numAttempts++;
            d = this.fillHoles(hs, ctx, weight);
        }
        return d;
    }
}
exports.WordRelChecker = WordRelChecker;
class WordPicker {
    constructor(checker, weights) {
        this.checker = checker;
        this.weights = weights;
        this.holes = [];
    }
    add(t, tags) {
        this.holes.push({ wordType: t, wordTags: tags, rels: [] });
        return this;
    }
    processSelString(selString) {
        var selStringParts = selString.split(":");
        var selString1 = selStringParts[0].split('');
        var wdType = selString1.filter((c) => !"0123456789".includes(c)).join('');
        var wdInd = parseInt(selString1.filter((c) => "0123456789".includes(c)).join(''));
        return [wdType, wdInd, selStringParts[1]];
    }
    addR(t, tags, selStrings) {
        // each selString should look something like "x3:subj" or "y0:obj" etc.
        var selStrParts = selStrings.map(this.processSelString);
        var rels = selStrParts.map((p) => {
            return {
                rel: p[2],
                relWordType: p[0],
                relWordId: p[1]
            };
        });
        this.holes.push({ wordType: t, wordTags: tags, rels: rels });
        return this;
    }
    resolve() {
        var d = {};
        for (var i in Object.keys(this.checker.allWords)) {
            var k = Object.keys(this.checker.allWords)[i];
            d[k] = [];
        }
        var res = this.checker.tryFillHoles(this.holes, d, this.weights);
        return res;
    }
}
exports.WordPicker = WordPicker;
// Demo example
/*
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

var checker = new WordRelChecker(demoLib);
checker.addSubtag("n", "item", "hasloc");
checker.addSubtag("n", "person", "hasloc");

var stacks = () => new WordPicker(checker, (n) => 1.0);

var locPhraseHoles = [
    { wordType: "n", wordTags: ["item"], rels: [] },
    { wordType: "n", wordTags: ["place"], rels: [] }
];

var intransHoles = [
    { wordType: "v", wordTags: ["intrans"], rels: [] },
    { wordType: "n", wordTags: [], rels: [{ rel: "subj", relWordType: "v", relWordId: 0 }] }
];

for (var i = 0; i < 20; i++) {
    var s = <IDictionary<DemoWord[]>>stacks().add("n", ["hasloc"]).add("n", ["place"]).resolve();
    console.log(`${s['n'][0].text} is in ${s['n'][1].text}`);
    var s = <IDictionary<DemoWord[]>>stacks().add("v", ["intrans"]).addR("n", [], ["v0:subj"]).resolve();
    console.log(`${s['n'][0].text} ${s['v'][0].text}`);
}
*/
