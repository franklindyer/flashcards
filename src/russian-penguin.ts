import {
    guidGenerator,
    FlashcardGenerator,
    defaultDecks,
    providedGenerators,
    indexedResources
} from "./lib";
import {
    ruDataPromise,
    EnRuNoun,
    EnRuVerb,
    EnRuWordLibrary,
    WordRepo,
    makeSingularNoun,
    makeTransVerb,
    makeIntransVerb,
    casePRP
} from "./russian-templating";

type PengQuizzerState = {
    x: number
}

// The templates need to NOT be serialized into the state object!
// Instead, they should be globally stored and referenced by some kind of ID based on their group.

// CHAPTER 3

var ch3Nouns = [
    makeSingularNoun("englishwoman", "англичанка", "f", ["agent", "person", "hasloc"]),
    makeSingularNoun("beetroot soup", "борщ", "m", ["food", "drink", "hasloc", "item"]),
    makeSingularNoun("brother", "брат", "m", ["agent", "person", "hasloc"]),
//        makeSingularNoun("Vanya", "Ваня", "f", ["agent", "person", "name", "hasloc"]),
    makeSingularNoun("wine", "вино", "n", ["drink", "hasloc", "item"]),
    makeSingularNoun("vodka", "водка", "f", ["drink", "hasloc", "item"]),
//        makeSingularNoun("Volodya", "Володя", "f", ["agent", "person", "name", "hasloc"]),
    makeSingularNoun("newspaper", "газета", "f", ["hasloc", "item"]),
    makeSingularNoun("door", "дверь", "m", ["hasloc", "openable"]),
    makeSingularNoun("day", "день", "m", ["timeunit"]),
    makeSingularNoun("house", "дом", "m", ["in-place", "hasloc"]),
    makeSingularNoun("uncle", "дядя", "f", ["agent", "person", "hasloc"]),
    makeSingularNoun("mother", "мать", "f", ["agent", "person", "hasloc"]),
    makeSingularNoun("menu", "меню", "n", ["item", "hasloc"]),
    makeSingularNoun("Moscow", "Москва", "f", ["in-place", "city", "hasloc"]),
    makeSingularNoun("window", "окно", "n", ["hasloc", "openable"]),
    makeSingularNoun("dad", "папа", "m", ["agent", "person", "hasloc"]),
    makeSingularNoun("rouble", "рубль", "f", ["item"]),
    makeSingularNoun("Siberia", "Сибирь", "f", ["in-place", "hasloc"]),
    makeSingularNoun("sour cream", "сметана", "f", ["food", "item", "hasloc"]),
    makeSingularNoun("taxi", "такси", "n", ["hasloc", "vehicle"]),
    makeSingularNoun("exercise", "упражнение", "n", ["nonphysical"]),
    makeSingularNoun("morning", "утро", "n", ["timerange"]),
    makeSingularNoun("tea", "чай", "m", ["drink", "item", "hasloc"]),
    makeSingularNoun("chocolate", "шоколад", "m", ["food", "item", "hasloc"])
];

var ch3Verbs: EnRuVerb[] = [];

var ch3Tpl = [
    (wr: any) => wr.pickN("item").format("this is {n0}", "это {n0}"),
    (wr: any) => wr.pickN("hasloc").format("where's (the) {n0}?", "где {n0}?"),
    (wr: any) => wr.pickN("hasloc").format("there's (the) {n0}", "вот {n0}")
];

// CHAPTER 4

var ch4Nouns = [
    makeSingularNoun("bus", "автобус", "m", ["hasloc", "vehicle"]),
    makeSingularNoun("hotel", "гостиница", "f", ["hasloc", "building", "in-place"]),
    makeSingularNoun("London", "Лондон", "m", ["in-place", "hasloc", "city"]),
    makeSingularNoun("metro", "метро", "n", ["in-place", "hasloc"]),
    makeSingularNoun("female friend", "подруга", "f", ["agent", "person", "hasloc"]),
    makeSingularNoun("avenue", "проспект", "m", ["hasloc", "at-place"]),
    makeSingularNoun("Russia", "Россия", "f", ["in-place", "hasloc", "country"]),
    makeSingularNoun("language", "язык", "m", ["nonphysical"]),
    makeSingularNoun("trolleybus", "троллейбус", "m", ["hasloc", "vehicle"]),
    makeSingularNoun("street", "улица", "f", ["at-place", "hasloc"])
];

var ch4Verbs = [
    makeIntransVerb("speak", "говорить", "agent", []),
    makeIntransVerb("go", "ехать", "agent", [], "by transport"),
    makeIntransVerb("live", "жить", "agent", ["within-place"]),
    makeIntransVerb("work", "работать", "person", ["within-place"]),
    makeTransVerb("smoke", "курить", "person", "smokeable", ["intrans"]),
    makeTransVerb("understand", "понимать", "agent", "nonphysical", ["intrans"]),
    makeTransVerb("study", "изучать", "person", "subject", ["intrans"])
];

var ch4Tpl = [
    (wr: any) => wr.pickPron(["person"]).pickAxn(0, "intrans").conjV(0, 0)
                    .format("{n0} {v0}", "{n0} {v0}"),
    (wr: any) => wr.pickV(1, "intrans").pickSubj(0)
                    .format("{n0} {v0}", "{n0} {v0}"),
    (wr: any) => wr.pickV(1, "intrans").pickSubj(0)
                    .format("{n0} do/does not {v0}", "{n0} не {v0}"),
    (wr: any) => wr.pickN("in-place", casePRP)
                    .format("in {n0}", "в {n0}")
];

var allNouns = [ch3Nouns, ch4Nouns].flat();
var allVerbs = [ch3Verbs, ch4Verbs].flat();
var allTpls = [ch3Tpl, ch4Tpl].flat();

var lib = new EnRuWordLibrary(allNouns, allVerbs);

var ruPenguinQuizzer: FlashcardGenerator<[string, string], PengQuizzerState> = {
    ftemp: {
        generator: function(seed: [string, string]) {
            return {
                params: seed,
                prompt: seed[0],
                answers: [seed[1]],
                hint: seed[1],
                uuid: guidGenerator()
            }
        }
    },
    state: null!,
    seeder: function(st: PengQuizzerState) {
        var tpl = allTpls[Math.floor(Math.random() * allTpls.length)];
        var repo = new WordRepo(lib);
        var res = tpl(repo);
        console.log(res);
        return res;
    },
    updater: (correct, answer, card, st) => st,
    history: [],
    editor: null!
}

defaultDecks["russian-penguin-deck"] = {
    name: "Penguin Russian Course quizzer",
    slug: "russian-penguin-deck",
    decktype: "russian-penguin-driller",
    resources: ["russian-verbs", "russian-nouns"],
    view: {
        color: "#ffddff"
    },
    state: ruPenguinQuizzer.state
}

providedGenerators["russian-penguin-driller"] = ruPenguinQuizzer;
indexedResources["russian-verbs"] = () => ruDataPromise("ru-verbs", "ruVerbs");
indexedResources["russian-nouns"] = () => ruDataPromise("ru-nouns", "ruNouns");
