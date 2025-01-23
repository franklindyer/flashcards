"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lib_1 = require("./lib");
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
        var tagOpts = relatedTo.rels[r.rel];
        return tagOpts.some((t) => w.tags.includes(t));
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
        while (d === undefined)
            d = this.fillHoles(hs, ctx, weight);
        return d;
    }
}
class WordStacks {
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
        for (var i in Object.keys(checker.allWords)) {
            var k = Object.keys(checker.allWords)[i];
            d[k] = [];
        }
        return checker.tryFillHoles(this.holes, d, this.weights);
    }
}
var demoNouns = [
    { text: "man", tags: ["person"], rels: {}, guid: (0, lib_1.guidGenerator)() },
    { text: "woman", tags: ["person"], rels: {}, guid: (0, lib_1.guidGenerator)() },
    { text: "child", tags: ["person"], rels: {}, guid: (0, lib_1.guidGenerator)() },
    { text: "book", tags: ["item", "topical", "legible"], rels: {}, guid: (0, lib_1.guidGenerator)() },
    { text: "movie", tags: ["topical"], rels: {}, guid: (0, lib_1.guidGenerator)() },
    { text: "toy", tags: ["item"], rels: {}, guid: (0, lib_1.guidGenerator)() },
    { text: "ball", tags: ["item"], rels: {}, guid: (0, lib_1.guidGenerator)() },
    { text: "sign", tags: ["object", "legible"], rels: {}, guid: (0, lib_1.guidGenerator)() },
    { text: "room", tags: ["place"], rels: {}, guid: (0, lib_1.guidGenerator)() },
    { text: "school", tags: ["place"], rels: {}, guid: (0, lib_1.guidGenerator)() },
    { text: "house", tags: ["place"], rels: {}, guid: (0, lib_1.guidGenerator)() }
];
var demoVerbs = [
    { text: "read", tags: ["intrans", "trans"], rels: { "subj": ["person"], "obj": ["legible"] }, guid: (0, lib_1.guidGenerator)() },
    { text: "jump", tags: ["intrans"], rels: { "subj": ["person"] }, guid: (0, lib_1.guidGenerator)() },
    { text: "have", tags: ["trans"], rels: { "subj": ["person"], "obj": ["item"] }, guid: (0, lib_1.guidGenerator)() },
    { text: "buy", tags: ["trans"], rels: { "subj": ["person"], "obj": ["item"] }, guid: (0, lib_1.guidGenerator)() }
];
var demoLib = {
    "n": demoNouns,
    "v": demoVerbs
};
var checker = new WordRelChecker(demoLib);
checker.addSubtag("n", "item", "hasloc");
checker.addSubtag("n", "person", "hasloc");
var stacks = () => new WordStacks(checker, (n) => 1.0);
var locPhraseHoles = [
    { wordType: "n", wordTags: ["item"], rels: [] },
    { wordType: "n", wordTags: ["place"], rels: [] }
];
var intransHoles = [
    { wordType: "v", wordTags: ["intrans"], rels: [] },
    { wordType: "n", wordTags: [], rels: [{ rel: "subj", relWordType: "v", relWordId: 0 }] }
];
for (var i = 0; i < 20; i++) {
    var s = stacks().add("n", ["hasloc"]).add("n", ["place"]).resolve();
    console.log(`${s['n'][0].text} is in ${s['n'][1].text}`);
    var s = stacks().add("v", ["intrans"]).addR("n", [], ["v0:subj"]).resolve();
    console.log(`${s['n'][0].text} ${s['v'][0].text}`);
}
