"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const word_rel_1 = require("./word-rel");
const german_templating_1 = require("./german-templating");
var lib = { "n": [], "a": [], "d": [], "v": [] };
var wc = new word_rel_1.WordRelChecker(lib);
var wp = new word_rel_1.WordPicker(wc, (w) => 1.0);
var mktpl = () => new german_templating_1.EnDePhraseTpl(new word_rel_1.WordPicker(wc, (w) => 1.0), []);
const globalBaconSubtags = [
    ["n", "relative", "person"],
    ["n", "person", "agent"],
];
globalBaconSubtags.map((st) => wc.addSubtag(st[0], st[1], st[2]));
/* CHAPTER 1 */
const ch1Nouns = [
    (0, german_templating_1.makeSingNoun)("brother", "Bruder", 0, ["relative"]),
    (0, german_templating_1.makeSingNoun)("teacher", "Lehrer", 0, ["person", "job"]),
    (0, german_templating_1.makeSingNoun)("pupil", "Schüler", 0, ["person", "job"]),
    (0, german_templating_1.makeSingNoun)("father", "Vater", 0, ["relative"]),
    (0, german_templating_1.makeSingNoun)("mother", "Mutter", 1, ["relative"]),
    (0, german_templating_1.makeSingNoun)("book", "Buch", 2, ["item", "legible"])
];
const ch1Verbs = [
    (0, german_templating_1.makeIntransVerb)("be", "sein", ["copula"], ["agent"]),
    (0, german_templating_1.makeIntransVerb)("have", "haben", ["have"], ["agent"])
];
const ch1Tpls = [
    mktpl().rpron().format("{n0}", "{n0}"),
    mktpl().add("v", "intrans").rpron().conj(0, 1).agreeVN(0, 0)
        .format("{n0} {v0}", "{n0} {v0.0}"),
    mktpl().add("v", "copula").add("n", "job").det(0, 2).rpron(0)
        .conj(0, 1).agreeVN(0, 1)
        .format("{n1} {v0} {d0} {n0}", "{n1} {v0.0} {d0} {n0}"),
    mktpl().add("v", "have").add("n", "relative").det(0, 2).rpron(0)
        .conj(0, 1).agreeVN(0, 1)
        .format("{n1} {v0} {d0} {n0}", "{n1} {v0.0} {d0} {n0}"),
    mktpl().add("v", "have").add("n", "item").det(0, 2).rpron(0)
        .declN(0, 1).declD(0, 1).conj(0, 1).agreeVN(0, 1)
        .format("{n1} {v0} {d0} {n0}", "{n1} {v0.0} {d0} {n0}")
];
lib["v"] = ch1Verbs;
lib["n"] = ch1Nouns;
for (var i = 0; i < 50; i++) {
    var tpl = ch1Tpls[Math.floor(Math.random() * ch1Tpls.length)];
    console.log(tpl.gen(tpl.next(wc)));
}
