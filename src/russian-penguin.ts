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
    lib: EnRuWordLibrary,
    tpl: any[]
}

function buildLib(): PengQuizzerState {

    // CHAPTER 3

    var ch3Nouns = [
        makeSingularNoun("englishwoman", "англичанка", ["agent", "person", "hasloc"]),
        makeSingularNoun("beetroot soup", "борщ", ["food", "drink", "hasloc", "item"]),
        makeSingularNoun("brother", "брат", ["agent", "person", "hasloc"]),
//        makeSingularNoun("Vanya", "Ваня", ["agent", "person", "name", "hasloc"]),
        makeSingularNoun("wine", "вино", ["drink", "hasloc", "item"]),
        makeSingularNoun("vodka", "водка", ["drink", "hasloc", "item"]),
//        makeSingularNoun("Volodya", "Володя", ["agent", "person", "name", "hasloc"]),
        makeSingularNoun("newspaper", "газета", ["hasloc", "item"]),
        makeSingularNoun("door", "дверь", ["hasloc", "openable"]),
        makeSingularNoun("day", "день", ["timeunit"]),
        makeSingularNoun("house", "дом", ["in-place", "hasloc"]),
        makeSingularNoun("uncle", "дядя", ["agent", "person", "hasloc"]),
        makeSingularNoun("mother", "мать", ["agent", "person", "hasloc"]),
        makeSingularNoun("menu", "меню", ["item", "hasloc"]),
        makeSingularNoun("Moscow", "Москва", ["in-place", "city", "hasloc"]),
        makeSingularNoun("window", "окно", ["hasloc", "openable"]),
        makeSingularNoun("dad", "папа", ["agent", "person", "hasloc"]),
        makeSingularNoun("rouble", "рубль", ["item"]),
        makeSingularNoun("Siberia", "Сибирь", ["in-place", "hasloc"]),
        makeSingularNoun("sour cream", "сметана", ["food", "item", "hasloc"]),
        makeSingularNoun("taxi", "такси", ["hasloc", "vehicle"]),
        makeSingularNoun("exercise", "упражнение", ["nonphysical"]),
        makeSingularNoun("morning", "утро", ["timerange"]),
        makeSingularNoun("tea", "чай", ["drink", "item", "hasloc"]),
        makeSingularNoun("chocolate", "шоколад", ["food", "item", "hasloc"])
    ];

    var ch3Verbs: EnRuVerb[] = [];

    var ch3Tpl = [
        (wr: any) => wr.pickN("object").format("this is {n0}", "это {n0}"),
        (wr: any) => wr.pickN("hasloc").format("where's (the) {n0}?", "где {n0}?"),
        (wr: any) => wr.pickN("hasloc").format("there's (the) {n0}", "вот {n0}")
    ];

    // CHAPTER 4

    var ch4Nouns = [
        makeSingularNoun("bus", "автобус", ["hasloc", "vehicle"]),
        makeSingularNoun("hotel", "гостиница", ["hasloc", "building", "in-place"]),
        makeSingularNoun("London", "Лондон", ["in-place", "hasloc", "city"]),
        makeSingularNoun("metro", "метро", ["in-place", "hasloc"]),
        makeSingularNoun("female friend", "подруга", ["agent", "person", "hasloc"]),
        makeSingularNoun("avenue", "проспект", ["hasloc", "at-place"]),
        makeSingularNoun("Russia", "Россия", ["in-place", "hasloc", "country"]),
        makeSingularNoun("language", "язык", ["nonphysical"]),
        makeSingularNoun("trolleybus", "троллейбус", ["hasloc", "vehicle"]),
        makeSingularNoun("street", "улица", ["at-place", "hasloc"])
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

    // ALL TOGETHER
    var allNouns = [ch3Nouns, ch4Nouns].flat();
    var allVerbs = [ch3Verbs, ch4Verbs].flat();
    var allTpls = [ch3Tpl, ch4Tpl].flat();

    return {
        lib: new EnRuWordLibrary(allNouns, allVerbs),
        tpl: allTpls
    }
}

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
        console.log("HIIIII");
        if (st === null) {
            ruPenguinQuizzer.state = buildLib();
            st = ruPenguinQuizzer.state;
        }
        var tpl = st.tpl[Math.floor(Math.random() * st.tpl.length)];
        var repo = new WordRepo(st.lib);
        var res = tpl(repo);
        console.log(res);
        return res;
    },
    updater: null!,
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
