import {
    IDictionary
} from "./lib";
import {
    WithTags,
    WordPicker,
    WordRelChecker
} from "./word-rel";
import {
    EnDePhraseTpl,
    makeIntransVerb,
    makeSingNoun
} from "./german-templating";

var lib: IDictionary<WithTags[]> = {"n": [], "a": [], "d": [], "v": []};

var wc = new WordRelChecker(lib);
var wp = new WordPicker(wc, (w) => 1.0);
var mktpl = () => new EnDePhraseTpl(new WordPicker(wc, (w) => 1.0), []);

const globalBaconSubtags = [
    ["n", "relative", "person"],
    ["n", "person", "agent"],
]

globalBaconSubtags.map((st) => wc.addSubtag(st[0], st[1], st[2]));

/* CHAPTER 1 */

const ch1Nouns = [
    makeSingNoun("brother", "Bruder", 0, ["relative"]),
    makeSingNoun("teacher", "Lehrer", 0, ["person", "job"]),
    makeSingNoun("pupil", "Schüler", 0, ["person", "job"]),
    makeSingNoun("father", "Vater", 0, ["relative"]),
    makeSingNoun("mother", "Mutter", 1, ["relative"]),
    makeSingNoun("book", "Buch", 2, ["item", "legible"])
]

const ch1Verbs = [
    makeIntransVerb("be", "sein", ["copula"], ["agent"]),
    makeIntransVerb("have", "haben", ["have"], ["agent"])
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
]

lib["v"] = ch1Verbs;
lib["n"] = ch1Nouns;

for (var i = 0; i < 50; i++) {
    var tpl = ch1Tpls[Math.floor(Math.random()*ch1Tpls.length)];
    console.log(tpl.gen(tpl.next(wc)));
}
