"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lib_1 = require("./lib");
const russian_templating_1 = require("./russian-templating");
function buildLib() {
    // CHAPTER 3
    var ch3Nouns = [
        (0, russian_templating_1.makeSingularNoun)("englishwoman", "англичанка", ["agent", "person", "hasloc"]),
        (0, russian_templating_1.makeSingularNoun)("beetroot soup", "борщ", ["food", "drink", "hasloc", "item"]),
        (0, russian_templating_1.makeSingularNoun)("brother", "брат", ["agent", "person", "hasloc"]),
        //        makeSingularNoun("Vanya", "Ваня", ["agent", "person", "name", "hasloc"]),
        (0, russian_templating_1.makeSingularNoun)("wine", "вино", ["drink", "hasloc", "item"]),
        (0, russian_templating_1.makeSingularNoun)("vodka", "водка", ["drink", "hasloc", "item"]),
        //        makeSingularNoun("Volodya", "Володя", ["agent", "person", "name", "hasloc"]),
        (0, russian_templating_1.makeSingularNoun)("newspaper", "газета", ["hasloc", "item"]),
        (0, russian_templating_1.makeSingularNoun)("door", "дверь", ["hasloc", "openable"]),
        (0, russian_templating_1.makeSingularNoun)("day", "день", ["timeunit"]),
        (0, russian_templating_1.makeSingularNoun)("house", "дом", ["in-place", "hasloc"]),
        (0, russian_templating_1.makeSingularNoun)("uncle", "дядя", ["agent", "person", "hasloc"]),
        (0, russian_templating_1.makeSingularNoun)("mother", "мать", ["agent", "person", "hasloc"]),
        (0, russian_templating_1.makeSingularNoun)("menu", "меню", ["item", "hasloc"]),
        (0, russian_templating_1.makeSingularNoun)("Moscow", "Москва", ["in-place", "city", "hasloc"]),
        (0, russian_templating_1.makeSingularNoun)("window", "окно", ["hasloc", "openable"]),
        (0, russian_templating_1.makeSingularNoun)("dad", "папа", ["agent", "person", "hasloc"]),
        (0, russian_templating_1.makeSingularNoun)("rouble", "рубль", ["item"]),
        (0, russian_templating_1.makeSingularNoun)("Siberia", "Сибирь", ["in-place", "hasloc"]),
        (0, russian_templating_1.makeSingularNoun)("sour cream", "сметана", ["food", "item", "hasloc"]),
        (0, russian_templating_1.makeSingularNoun)("taxi", "такси", ["hasloc", "vehicle"]),
        (0, russian_templating_1.makeSingularNoun)("exercise", "упражнение", ["nonphysical"]),
        (0, russian_templating_1.makeSingularNoun)("morning", "утро", ["timerange"]),
        (0, russian_templating_1.makeSingularNoun)("tea", "чай", ["drink", "item", "hasloc"]),
        (0, russian_templating_1.makeSingularNoun)("chocolate", "шоколад", ["food", "item", "hasloc"])
    ];
    var ch3Verbs = [];
    var ch3Tpl = [
        (wr) => wr.pickN("object").format("this is {n0}", "это {n0}"),
        (wr) => wr.pickN("hasloc").format("where's (the) {n0}?", "где {n0}?"),
        (wr) => wr.pickN("hasloc").format("there's (the) {n0}", "вот {n0}")
    ];
    // CHAPTER 4
    var ch4Nouns = [
        (0, russian_templating_1.makeSingularNoun)("bus", "автобус", ["hasloc", "vehicle"]),
        (0, russian_templating_1.makeSingularNoun)("hotel", "гостиница", ["hasloc", "building", "in-place"]),
        (0, russian_templating_1.makeSingularNoun)("London", "Лондон", ["in-place", "hasloc", "city"]),
        (0, russian_templating_1.makeSingularNoun)("metro", "метро", ["in-place", "hasloc"]),
        (0, russian_templating_1.makeSingularNoun)("female friend", "подруга", ["agent", "person", "hasloc"]),
        (0, russian_templating_1.makeSingularNoun)("avenue", "проспект", ["hasloc", "at-place"]),
        (0, russian_templating_1.makeSingularNoun)("Russia", "Россия", ["in-place", "hasloc", "country"]),
        (0, russian_templating_1.makeSingularNoun)("language", "язык", ["nonphysical"]),
        (0, russian_templating_1.makeSingularNoun)("trolleybus", "троллейбус", ["hasloc", "vehicle"]),
        (0, russian_templating_1.makeSingularNoun)("street", "улица", ["at-place", "hasloc"])
    ];
    var ch4Verbs = [
        (0, russian_templating_1.makeIntransVerb)("speak", "говорить", "agent", []),
        (0, russian_templating_1.makeIntransVerb)("go", "ехать", "agent", [], "by transport"),
        (0, russian_templating_1.makeIntransVerb)("live", "жить", "agent", ["within-place"]),
        (0, russian_templating_1.makeIntransVerb)("work", "работать", "person", ["within-place"]),
        (0, russian_templating_1.makeTransVerb)("smoke", "курить", "person", "smokeable", ["intrans"]),
        (0, russian_templating_1.makeTransVerb)("understand", "понимать", "agent", "nonphysical", ["intrans"]),
        (0, russian_templating_1.makeTransVerb)("study", "изучать", "person", "subject", ["intrans"])
    ];
    var ch4Tpl = [
        (wr) => wr.pickPron(["person"]).pickAxn(0, "intrans").conjV(0, 0)
            .format("{n0} {v0}", "{n0} {v0}"),
        (wr) => wr.pickV(1, "intrans").pickSubj(0)
            .format("{n0} {v0}", "{n0} {v0}"),
        (wr) => wr.pickV(1, "intrans").pickSubj(0)
            .format("{n0} do/does not {v0}", "{n0} не {v0}"),
        (wr) => wr.pickN("in-place", russian_templating_1.casePRP)
            .format("in {n0}", "в {n0}")
    ];
    // ALL TOGETHER
    var allNouns = [ch3Nouns, ch4Nouns].flat();
    var allVerbs = [ch3Verbs, ch4Verbs].flat();
    var allTpls = [ch3Tpl, ch4Tpl].flat();
    return {
        lib: new russian_templating_1.EnRuWordLibrary(allNouns, allVerbs),
        tpl: allTpls
    };
}
var ruPenguinQuizzer = {
    ftemp: {
        generator: function (seed) {
            return {
                params: seed,
                prompt: seed[0],
                answers: [seed[1]],
                hint: seed[1],
                uuid: (0, lib_1.guidGenerator)()
            };
        }
    },
    state: null,
    seeder: function (st) {
        console.log("HIIIII");
        if (st === null) {
            ruPenguinQuizzer.state = buildLib();
            st = ruPenguinQuizzer.state;
        }
        var tpl = st.tpl[Math.floor(Math.random() * st.tpl.length)];
        var res = tpl(st.lib);
        console.log(res);
        return res;
    },
    updater: null,
    history: [],
    editor: null
};
lib_1.defaultDecks["russian-penguin-deck"] = {
    name: "Penguin Russian Course quizzer",
    slug: "russian-penguin-deck",
    decktype: "russian-penguin-driller",
    resources: ["russian-verbs", "russian-nouns"],
    view: {
        color: "#ffddff"
    },
    state: ruPenguinQuizzer.state
};
lib_1.providedGenerators["russian-penguin-driller"] = ruPenguinQuizzer;
lib_1.indexedResources["russian-verbs"] = () => (0, russian_templating_1.ruDataPromise)("ru-verbs", "ruVerbs");
lib_1.indexedResources["russian-nouns"] = () => (0, russian_templating_1.ruDataPromise)("ru-nouns", "ruNouns");
