"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lib_1 = require("./lib");
const word_rel_1 = require("./word-rel");
const russian_templating_1 = require("./russian-templating");
function makePengMenu(st) {
    var chapters = Object.keys(penguinChapters);
    var contDiv = document.createElement("div");
    var chapterBoxes = {};
    for (var i in chapters) {
        var ed = (0, lib_1.boolEditor)(`Chapter ${chapters[i]}`, st.activeChapters.includes(chapters[i]));
        chapterBoxes[chapters[i]] = ed;
        contDiv.appendChild(ed.element);
    }
    return {
        element: contDiv,
        menuToState: () => {
            return {
                activeChapters: Object.keys(chapterBoxes).filter((k) => chapterBoxes[k].menuToState()),
                stats: st.stats
            };
        }
    };
}
var lib = {
    "n": [],
    "v": [],
    "a": []
};
var penguinGlobalSubs = [
    [/(\s|^)a ([aeiou])/g, "$1an $2"],
    [/(\s|^)в лесе/g, "$1в лесу"],
    [/(\s|^)в саде/g, "$1в саду"],
    [/(\s|^)в Крыме/g, "$1в Крыму"],
    [/(\s|^)о ([аоэуиАОЭУИ])/g, "$1об $2"],
    [/(\s|^) мне/g, "обо мне"]
];
var penguinGlobalSubtags = [
    ["n", "item", "hasloc"],
    ["n", "relative", "person"],
    ["n", "person", "agent"],
    ["n", "person", "hasloc"],
    ["n", "country", "region"],
    ["n", "building", "structure"],
    ["n", "structure", "site"],
    ["n", "geo-feature", "site"],
    ["n", "in-place", "place"],
    ["n", "at-place", "place"],
    ["n", "item", "orderable"],
    ["n", "site", "orderable"],
    ["n", "item", "object"],
    ["n", "building", "object"],
    ["n", "person", "object"],
    ["n", "site", "where"],
    ["n", "hasloc", "where"]
];
var wc = new word_rel_1.WordRelChecker(lib);
// var wp = new WordPicker(wc, (w) => 1.0);
var mktpl = () => new russian_templating_1.EnRuPhraseTpl(new word_rel_1.WordPicker(wc, (w) => 1.0), penguinGlobalSubs);
// CHAPTER 3
var ch3Nouns = [
    (0, russian_templating_1.makeSingularNoun)("englishwoman", "англичанка", "f", true, ["agent", "person", "hasloc"]),
    (0, russian_templating_1.makeSingularNoun)("beetroot soup", "борщ", "m", false, ["food", "drink", "hasloc", "item"]),
    (0, russian_templating_1.makeSingularNoun)("brother", "брат", "m", true, ["agent", "person", "hasloc", "relative"]),
    //        makeSingularNoun("Vanya", "Ваня", true, "f", ["agent", "person", "name", "hasloc"]),
    (0, russian_templating_1.makeSingularNoun)("wine", "вино", "n", false, ["drink", "hasloc", "item"]),
    (0, russian_templating_1.makeSingularNoun)("vodka", "водка", "f", false, ["drink", "hasloc", "item"]),
    //        makeSingularNoun("Volodya", "Володя", "f", true, ["agent", "person", "name", "hasloc"]),
    (0, russian_templating_1.makeSingularNoun)("newspaper", "газета", "f", false, ["hasloc", "item"]),
    (0, russian_templating_1.makeSingularNoun)("door", "дверь", "m", false, ["where", "openable", "orderable"]),
    (0, russian_templating_1.makeSingularNoun)("day", "день", "m", false, ["timeunit"]),
    (0, russian_templating_1.makeSingularNoun)("house", "дом", "m", false, ["in-place", "hasloc", "building"]),
    (0, russian_templating_1.makeSingularNoun)("uncle", "дядя", "f", true, ["agent", "person", "hasloc", "relative"]),
    (0, russian_templating_1.makeSingularNoun)("mother", "мать", "f", true, ["agent", "person", "hasloc", "relative"]),
    (0, russian_templating_1.makeSingularNoun)("menu", "меню", "n", false, ["item", "hasloc"]),
    (0, russian_templating_1.makeSingularNoun)("Moscow", "Москва", "f", false, ["in-place", "city", "geo-place"]),
    (0, russian_templating_1.makeSingularNoun)("window", "окно", "n", false, ["hasloc", "openable", "orderable"]),
    (0, russian_templating_1.makeSingularNoun)("dad", "папа", "m", true, ["agent", "person", "hasloc", "relative"]),
    (0, russian_templating_1.makeSingularNoun)("rouble", "рубль", "f", false, ["item"]),
    (0, russian_templating_1.makeSingularNoun)("Siberia", "Сибирь", "f", false, ["in-place", "region", "geo-place"]),
    (0, russian_templating_1.makeSingularNoun)("sour cream", "сметана", "f", false, ["food", "item", "hasloc"]),
    (0, russian_templating_1.makeSingularNoun)("taxi", "такси", "n", false, ["hasloc", "vehicle"]),
    (0, russian_templating_1.makeSingularNoun)("exercise", "упражнение", "n", false, ["nonphysical", "orderable"]),
    (0, russian_templating_1.makeSingularNoun)("morning", "утро", "n", false, ["timerange"]),
    (0, russian_templating_1.makeSingularNoun)("tea", "чай", "m", false, ["drink", "item", "hasloc"]),
    (0, russian_templating_1.makeSingularNoun)("chocolate", "шоколад", "m", false, ["food", "item", "hasloc"])
];
var ch3Tpls = [
    mktpl().add("n", "item").format("this is {n0}", "это {n0}"),
    mktpl().add("n", "where").format("where is (the) {n0}?", "где {n0}?"),
    mktpl().add("n", "where").format("there's (the) {n0}", "вот {n0}"),
];
// CHAPTER 4
var ch4Nouns = [
    (0, russian_templating_1.makeSingularNoun)("bus", "автобус", "m", false, ["hasloc", "vehicle", "at-place"]),
    (0, russian_templating_1.makeSingularNoun)("hotel", "гостиница", "f", false, ["hasloc", "building", "in-place"]),
    (0, russian_templating_1.makeSingularNoun)("London", "Лондон", "m", false, ["in-place", "city", "geo-place"]),
    (0, russian_templating_1.makeSingularNoun)("metro", "метро", "n", false, ["in-place", "hasloc", "structure"]),
    (0, russian_templating_1.makeSingularNoun)("female friend", "подруга", "f", true, ["agent", "person", "hasloc"]),
    (0, russian_templating_1.makeSingularNoun)("avenue", "проспект", "m", false, ["hasloc", "at-place", "site"]),
    (0, russian_templating_1.makeSingularNoun)("Russia", "Россия", "f", false, ["in-place", "country", "geo-place"]),
    (0, russian_templating_1.makeSingularNoun)("language", "язык", "m", false, ["nonphysical", "regional"]),
    (0, russian_templating_1.makeSingularNoun)("trolleybus", "троллейбус", "m", false, ["hasloc", "vehicle"]),
    (0, russian_templating_1.makeSingularNoun)("street", "улица", "f", false, ["at-place", "hasloc", "site"]),
];
var ch4Verbs = [
    (0, russian_templating_1.makeIntransVerb)("speak", "говорить", ["agent"], ["about-topic"]),
    (0, russian_templating_1.makeIntransVerb)("go", "ехать", ["agent"], [], "by transport"),
    (0, russian_templating_1.makeIntransVerb)("live", "жить", ["agent"], ["within-place"]),
    (0, russian_templating_1.makeIntransVerb)("work", "работать", ["person"], ["within-place"]),
    (0, russian_templating_1.makeTransVerb)("smoke", "курить", ["person"], ["smokeable"], ["intrans", "within-place"]),
    (0, russian_templating_1.makeTransVerb)("understand", "понимать", ["agent"], ["nonphysical"], ["intrans"]),
    (0, russian_templating_1.makeTransVerb)("study", "изучать", ["person"], ["subject"], ["intrans"])
];
var ch4Tpls = [
    mktpl().add("n", "in-place").decl(0, russian_templating_1.casePRP).format("in/at {n0}", "в {n0}"),
    mktpl().add("n", "at-place").decl(0, russian_templating_1.casePRP).format("in/at {n0}", "на {n0}"),
    mktpl().add("n", "hasloc").add("n", "in-place").decl(1, russian_templating_1.casePRP)
        .format("{n0} is in/at {n1}", "{n0} в {n1}"),
    mktpl().add("n", "hasloc").add("n", "at-place").decl(1, russian_templating_1.casePRP)
        .format("{n0} is in/at {n1}", "{n0} на {n1}"),
    mktpl().add("v", "intrans").add("n", "", "v0:subj").conj(0, 1).agreeVN(0, 0)
        .format("{n0} {v0}", "{n0} {v0}"),
    mktpl().add("v", "intrans").rpron().conj(0, 1).agreeVN(0, 0)
        .format("{n0} {v0}", "{n0} {v0}")
];
// CHAPTER 5
var ch5Nouns = [
    (0, russian_templating_1.makeSingularNoun)("englishman", "англичанин", "m", true, ["agent", "person", "hasloc"]),
    (0, russian_templating_1.makeSingularNoun)("station", "вокзал", "m", false, ["at-place", "site"]),
    (0, russian_templating_1.makeSingularNoun)("institute", "институт", "m", false, ["in-place", "site"]),
    (0, russian_templating_1.makeSingularNoun)("Crimea", "Крым", "m", false, ["in-place", "region", "geo-place"]),
    (0, russian_templating_1.makeSingularNoun)("forest", "лес", "m", false, ["in-place", "site", "geo-feature"]),
    (0, russian_templating_1.makeSingularNoun)("sea", "море", "n", false, ["in-place", "body-water", "geo-feature"]),
    (0, russian_templating_1.makeSingularNoun)("museum", "музей", "m", false, ["in-place", "building"]),
    (0, russian_templating_1.makeSingularNoun)("number", "номер", "m", false, ["nonphysical"]),
    (0, russian_templating_1.makeSingularNoun)("letter", "письмо", "n", false, ["item", "hasloc", "topical"]),
    (0, russian_templating_1.makeSingularNoun)("town square", "площадь", "f", false, ["at-place", "site"]),
    (0, russian_templating_1.makeSingularNoun)("post office", "почта", "f", false, ["at-place", "building"]),
    (0, russian_templating_1.makeSingularNoun)("restaurant", "ресторан", "m", false, ["in-place", "building"]),
    (0, russian_templating_1.makeSingularNoun)("garden", "сад", "m", false, ["in-place", "site"]),
    (0, russian_templating_1.makeSingularNoun)("toilet", "туалет", "m", false, ["hasloc", "structure"]),
    (0, russian_templating_1.makeSingularNoun)("Ukraine", "Украина", "f", false, ["at-place", "country", "region", "geo-place"]),
    (0, russian_templating_1.makeSingularNoun)("university", "университет", "m", false, ["in-place", "site"]),
    (0, russian_templating_1.makeSingularNoun)("tsar", "царь", "m", true, ["agent", "person", "hasloc"])
];
var ch5Verbs = [
    (0, russian_templating_1.makeIntransVerb)("speak", "говорить", ["agent"], ["about-topic"]),
    (0, russian_templating_1.makeIntransVerb)("live", "жить", ["agent"], ["within-place"]),
    (0, russian_templating_1.makeIntransVerb)("work", "работать", ["person"], ["within-place"]),
    (0, russian_templating_1.makeTransVerb)("smoke", "курить", ["person"], ["smokeable"], ["intrans", "within-place"])
];
var ch5Tpls = [
    ch4Tpls[0], ch4Tpls[1], ch4Tpls[2], ch4Tpls[3],
    mktpl().add("v", "within-place,intrans").add("n", "", "v0:subj").add("n", "in-place")
        .conj(0, 1).agreeVN(0, 0).decl(1, russian_templating_1.casePRP)
        .format("{n0} {v0} in/at {n1}", "{n0} {v0} в {n1}"),
    mktpl().add("v", "within-place,intrans").add("n", "", "v0:subj").add("n", "at-place")
        .conj(0, 1).agreeVN(0, 0).decl(1, russian_templating_1.casePRP)
        .format("{n0} {v0} in/at {n1}", "{n0} {v0} на {n1}")
];
// CHAPTER 6
var ch6Nouns = [
    (0, russian_templating_1.makeSingularNoun)("wine", "вино", "n", false, ["drink", "item"]),
    (0, russian_templating_1.makeSingularNoun)("year", "год", "m", false, ["timerange"]),
    (0, russian_templating_1.makeSingularNoun)("grandfather", "дедушка", "m", true, ["person", "agent", "hasloc", "relative"]),
    (0, russian_templating_1.makeSingularNoun)("wife", "жена", "f", true, ["person", "agent", "hasloc", "relative"]),
    (0, russian_templating_1.makeSingularNoun)("husband", "муж", "m", true, ["person", "agent", "hasloc", "relative"]),
    (0, russian_templating_1.makeSingularNoun)("(first) name", "имя", "n", false, ["nonphysical"]),
    (0, russian_templating_1.makeSingularNoun)("shop", "магазин", "m", false, ["in-place", "building"]),
    (0, russian_templating_1.makeSingularNoun)("minute", "минута", "f", false, ["timerange"]),
    (0, russian_templating_1.makeSingularNoun)("music", "музыка", "f", false, ["nonphysical", "audible", "regional", "passion", "subject"]),
    (0, russian_templating_1.makeSingularNoun)("week", "неделя", "f", false, ["timerange"]),
    (0, russian_templating_1.makeSingularNoun)("father", "отец", "m", true, ["person", "agent", "hasloc", "relative"]),
    (0, russian_templating_1.makeSingularNoun)("patronymic", "отчество", "n", false, ["nonphysical"]),
    (0, russian_templating_1.makeSingularNoun)("work", "работа", "f", false, ["event", "at-place", "passion"]),
    (0, russian_templating_1.makeSingularNoun)("son", "сын", "m", true, ["person", "agent", "hasloc", "relative"]),
    (0, russian_templating_1.makeSingularNoun)("hour", "час", "m", false, ["timerange"]),
    (0, russian_templating_1.makeSingularNoun)("surname", "фамилия", "f", false, ["nonphysical", "regional"])
];
var ch6Verbs = [
    (0, russian_templating_1.makeTransVerb)("love", "любить", ["agent"], ["item", "person", "passion", "place"], []),
    (0, russian_templating_1.makeIntransVerb)("fare", "поживать", ["person"], [], "get along"),
];
var ch6Adjs = [
    (0, russian_templating_1.makeAdj)("my", "мой", ["item", "relative"], ["possessive"]),
    (0, russian_templating_1.makeAdj)("your", "твой", ["item", "relative"], ["possessive"]),
    (0, russian_templating_1.makeAdj)("our", "наш", ["item", "relative"], ["possessive"]),
    (0, russian_templating_1.makeAdj)("y'all's", "ваш", ["item", "relative"], ["possessive"]),
    (0, russian_templating_1.makeAdj)("his", "его", ["item", "relative"], ["possessive"]),
    (0, russian_templating_1.makeAdj)("her", "её", ["item", "relative"], ["possessive"]),
    (0, russian_templating_1.makeAdj)("their", "их", ["item", "relative"], ["possessive"]),
];
var ch6Tpls = [
    mktpl().add("a", "possessive").add("n", "", "a0:noun").agreeAN(0, 0)
        .format("{a0} {n0}", "{a0} {n0}"),
    mktpl().add("n", "item").decl(0, russian_templating_1.caseACC)
        .format("thanks for (the) {n0}", "спасибо за {n0}"),
    mktpl().add("n", "timerange").decl(0, russian_templating_1.caseACC)
        .format("in/within a {n0}", "через {n0}"),
    mktpl().add("v", "trans").add("n", "", "v0:subj").add("n", "", "v0:obj")
        .conj(0, 1).agreeVN(0, 0).decl(1, russian_templating_1.caseACC)
        .format("{n0} {v0} {n1}", "{n0} {v0} {n1}"),
    mktpl().add("v", "trans").add("n", "agent", "v0:subj").add("n", "", "v0:obj").rpron()
        .conj(0, 1).agreeVN(0, 2).decl(1, russian_templating_1.caseACC)
        .format("{n2} {v0} {n1}", "{n2} {v0} {n1}"),
    mktpl().add("n", "agent").add("v", "", "n0:<obj").add("n", "", "v0:subj").rpron()
        .conj(0, 1).agreeVN(0, 0).decl(2, russian_templating_1.caseACC)
        .format("{n0} {v0} {n2}", "{n0} {v0} {n2}")
    //    mktpl().add("n", "agent").add("v", "trans", "n0:<subj").add("n", "", "v0:obj").rpron()
    //        .conj(0, 1).agreeVN(0, 2).decl(1, caseACC)
    //        .format("{n2} {v0} {n1}", "{n2} {v0} {n1}")
];
// CHAPTER 7
var ch7Nouns = [
    (0, russian_templating_1.makeSingularNoun)("bathroom", "ванная", "f", false, ["in-place", "room"]),
    (0, russian_templating_1.makeSingularNoun)("city", "город", "m", false, ["in-place", "regional"]),
    (0, russian_templating_1.makeSingularNoun)("apartment", "квартира", "f", false, ["in-place"]),
    (0, russian_templating_1.makeSingularNoun)("book", "книга", "f", false, ["item", "hasloc", "topical", "orderable"]),
    //    makeSingularNoun("Kremlin", "Кремль", "m", false, ["in-place", "building"]),
    (0, russian_templating_1.makeSingularNoun)("kitchen", "кухня", "f", false, ["at-place", "room"]),
    (0, russian_templating_1.makeSingularNoun)("bridge", "мост", "m", false, ["at-place", "structure"]),
    (0, russian_templating_1.makeSingularNoun)("overcoat", "пальто", "n", false, ["item", "hasloc", "clothing"]),
    (0, russian_templating_1.makeSingularNoun)("street map", "план", "m", false, ["item", "hasloc"]),
    (0, russian_templating_1.makeSingularNoun)("weather", "погода", "f", false, ["nonphysical", "regional"]),
    (0, russian_templating_1.makeSingularNoun)("embassy", "посольство", "n", false, ["in-place", "building"]),
    (0, russian_templating_1.makeSingularNoun)("river", "река", "f", false, ["in-place", "geo-feature"]),
    (0, russian_templating_1.makeSingularNoun)("bedroom", "спальня", "f", false, ["in-place", "room"]),
    (0, russian_templating_1.makeSingularNoun)("theater", "театр", "m", false, ["in-place", "building"]),
    (0, russian_templating_1.makeSingularNoun)("school", "школа", "f", false, ["in-place", "building"]),
    (0, russian_templating_1.makeSingularNoun)("floor/story", "этаж", "m", false, ["orderable"])
];
var ch7Verbs = [
    (0, russian_templating_1.makeTransVerb)("show", "показывать", ["person"], ["item"], [])
];
var ch7Adjs = [
    (0, russian_templating_1.makeAdj)("american", "американский", ["person", "item", "regional"], ["national"]),
    (0, russian_templating_1.makeAdj)("british", "британский", ["person", "item", "regional"], ["national"]),
    (0, russian_templating_1.makeAdj)("canadian", "канадский", ["person", "item", "regional"], ["national"]),
    (0, russian_templating_1.makeAdj)("russian", "русский", ["person", "item", "regional"], ["national"]),
    (0, russian_templating_1.makeAdj)("western", "западный", ["person", "item", "regional"], ["regional"]),
    (0, russian_templating_1.makeAdj)("large", "большой", ["object", "structure"], []),
    (0, russian_templating_1.makeAdj)("small", "маленький", ["object", "structure"], []),
    (0, russian_templating_1.makeAdj)("morning", "утренний", ["event", "clothing"], []),
    (0, russian_templating_1.makeAdj)("evening", "вечерний", ["event", "clothing"], []),
    (0, russian_templating_1.makeAdj)("spring", "весенний", ["event", "clothing"], []),
    (0, russian_templating_1.makeAdj)("summer", "летний", ["event", "clothing"], []),
    (0, russian_templating_1.makeAdj)("autumn", "осенний", ["event", "clothing"], []),
    (0, russian_templating_1.makeAdj)("winter", "зимний", ["event", "clothing"], []),
    (0, russian_templating_1.makeAdj)("first", "первый", ["orderable"], ["ordinal"]),
    (0, russian_templating_1.makeAdj)("second", "второй", ["orderable"], ["ordinal"]),
    (0, russian_templating_1.makeAdj)("third", "третий", ["orderable"], ["ordinal"]),
    (0, russian_templating_1.makeAdj)("main", "главный", ["site", "career"], []),
    (0, russian_templating_1.makeAdj)("red", "красный", ["object"], ["color"]),
    (0, russian_templating_1.makeAdj)("beautiful", "красивый", ["object", "person"], ["visual"]),
    (0, russian_templating_1.makeAdj)("interesting", "интересный", ["topical", "person"], []),
    (0, russian_templating_1.makeAdj)("famous", "знаменитый", ["site", "person"], []),
    (0, russian_templating_1.makeAdj)("new", "новый", ["person", "structure", "object"], []),
    (0, russian_templating_1.makeAdj)("old", "старый", ["person", "site", "object"], []),
    (0, russian_templating_1.makeAdj)("last", "последний", ["orderable"], []),
    (0, russian_templating_1.makeAdj)("warm", "тёплый", ["room"], ["tactile"]),
    (0, russian_templating_1.makeAdj)("cold", "холодный", ["room"], ["tactile"]),
    (0, russian_templating_1.makeAdj)("stone", "каменный", ["object", "structure"], ["makeup"]),
];
var ch7Tpls = [
    mktpl().add("a", "").add("n", "", "a0:noun").agreeAN(0, 0)
        .format("{a0} {n0}", "{a0} {n0}"),
];
// Text substitutions in Russian answers needed for things like contraction / special forms
var penguinChapters = {
    "3": [ch3Nouns, [], [], ch3Tpls],
    "4": [ch4Nouns, ch4Verbs, [], ch4Tpls],
    "5": [ch5Nouns, ch5Verbs, [], ch5Tpls],
    "6": [ch6Nouns, ch6Verbs, ch6Adjs, ch6Tpls],
    "7": [ch7Nouns, ch7Verbs, ch7Adjs, ch7Tpls]
};
var penguinTpls = {};
for (var k in penguinChapters) {
    var tpls = penguinChapters[k][3];
    tpls.map((tpl) => penguinTpls[tpl.guid] = tpl);
}
var allNouns = Object.keys(penguinChapters).map((k) => penguinChapters[k][0]).flat();
var allVerbs = Object.keys(penguinChapters).map((k) => penguinChapters[k][1]).flat();
var allAdjs = Object.keys(penguinChapters).map((k) => penguinChapters[k][2]).flat();
var ruPenguinQuizzer = {
    ftemp: {
        generator: function (seed) {
            var res = penguinTpls[seed.tplGuid].gen(seed);
            return {
                params: seed,
                prompt: res[0],
                answers: [res[1]],
                hint: res[1],
                uuid: (0, lib_1.guidGenerator)()
            };
        }
    },
    state: {
        activeChapters: ["3"],
        stats: {
            nounStats: {}, // ensureKeys(allNouns.map((n) => n.guid), [0,0], {}),
            verbStats: {}, // ensureKeys(allVerbs.map((v) => v.guid), [0,0], {}),
            adjStats: {}, // ensureKeys(allAdjs.map((a) => a.guid), [0,0], {}),
            tplStats: {}
        }
    },
    seeder: function (st) {
        var selNouns = st.activeChapters.map((k) => penguinChapters[k][0]).flat();
        var selVerbs = st.activeChapters.map((k) => penguinChapters[k][1]).flat();
        var selAdjs = st.activeChapters.map((k) => penguinChapters[k][2]).flat();
        var selTpls = st.activeChapters.map((k) => penguinChapters[k][3]).flat();
        lib["n"] = selNouns;
        lib["v"] = selVerbs;
        lib["a"] = selAdjs;
        wc = new word_rel_1.WordRelChecker(lib);
        penguinGlobalSubtags.map((st) => wc.addSubtag(st[0], st[1], st[2]));
        for (var i = 0; i < 20; i++) {
            var tpl = selTpls[Math.floor(Math.random() * selTpls.length)];
            console.log(tpl.gen(tpl.next(wc)));
        }
        var tpl = selTpls[Math.floor(Math.random() * selTpls.length)];
        return tpl.next(wc);
    },
    updater: (correct, answer, card, st) => {
        var incVec = correct ? [1, 0] : [0, 1];
        for (var k in card.params.words["n"]) {
            var n = card.params.words["n"][k];
            if (!(n.guid in st.stats.nounStats))
                st.stats.nounStats[n.guid] = [0, 0];
            st.stats.nounStats[n.guid][0] += incVec[0];
            st.stats.nounStats[n.guid][1] += incVec[1];
        }
        for (var k in card.params.words["v"]) {
            var v = card.params.words["v"][k];
            if (!(v.guid in st.stats.verbStats))
                st.stats.verbStats[v.guid] = [0, 0];
            st.stats.verbStats[v.guid][0] += incVec[0];
            st.stats.verbStats[v.guid][1] += incVec[1];
        }
        for (var k in card.params.words["a"]) {
            var a = card.params.words["a"][k];
            if (!(a.guid in st.stats.adjStats))
                st.stats.adjStats[a.guid] = [0, 0];
            st.stats.adjStats[a.guid][0] += incVec[0];
            st.stats.adjStats[a.guid][1] += incVec[1];
        }
        if (!(card.params.tplGuid in st.stats.tplStats))
            st.stats.tplStats[card.params.tplGuid] = [0, 0];
        st.stats.tplStats[card.params.tplGuid][0] += incVec[0];
        st.stats.tplStats[card.params.tplGuid][1] += incVec[1];
        return st;
    },
    history: [],
    editor: makePengMenu
};
lib_1.defaultDecks["russian-penguin-deck"] = {
    name: "Penguin Russian Course quizzer",
    slug: "russian-penguin-deck",
    decktype: "russian-penguin-driller",
    resources: ["russian-verbs", "russian-nouns", "russian-adjs"],
    view: {
        color: "#ffddff"
    },
    state: ruPenguinQuizzer.state
};
lib_1.providedGenerators["russian-penguin-driller"] = ruPenguinQuizzer;
lib_1.indexedResources["russian-verbs"] = () => (0, russian_templating_1.ruDataPromise)("ru-verbs", "ruVerbs");
lib_1.indexedResources["russian-nouns"] = () => (0, russian_templating_1.ruDataPromise)("ru-nouns", "ruNouns");
lib_1.indexedResources["russian-adjs"] = () => (0, russian_templating_1.ruDataPromise)("ru-adjectives", "ruAdjectives");
