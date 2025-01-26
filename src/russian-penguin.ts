import {
    IDictionary,
    guidGenerator,
    ensureKeys,
    Flashcard,
    FlashcardGenEditor,
    FlashcardGenerator,
    boolEditor,
    defaultDecks,
    providedGenerators,
    indexedResources
} from "./lib";
import {
    WithTags,
    WordRelChecker,
    WordPicker
} from "./word-rel";
import {
    ruDataPromise,
    EnRuNoun,
    EnRuVerb,
    EnRuAdjective,
    EnRuPhraseTpl,
    EnRuWordStacks,
    makeSingularNoun,
    makeTransVerb,
    makeIntransVerb,
    makeAdj,
    caseNOM,
    caseACC,
    casePRP
} from "./russian-templating";

type PengQuizzerStats = {
    nounStats: IDictionary<[number, number]>,
    verbStats: IDictionary<[number, number]>,
    adjStats: IDictionary<[number, number]>,
    tplStats: IDictionary<[number, number]>
}

type PengQuizzerState = {
    activeChapters: string[],
    stats: PengQuizzerStats
}

function makePengMenu(st: PengQuizzerState): FlashcardGenEditor<PengQuizzerState> {
    var chapters = Object.keys(penguinChapters);
    var contDiv = document.createElement("div");
    var chapterBoxes: IDictionary<FlashcardGenEditor<boolean>> = {};
    for (var i in chapters) {
        var ed = boolEditor(`Chapter ${chapters[i]}`, st.activeChapters.includes(chapters[i]));
        chapterBoxes[chapters[i]] = ed;
        contDiv.appendChild(ed.element);
    }
    return {
        element: contDiv,
        menuToState: () => { return {
            activeChapters: Object.keys(chapterBoxes).filter((k: string) => chapterBoxes[k].menuToState()),
            stats: st.stats
        }}
    }
}

var lib: IDictionary<WithTags[]> = {
    "n": [],
    "v": [],
    "a": []
}

var wc = new WordRelChecker(lib);
// var wp = new WordPicker(wc, (w) => 1.0);
var mktpl = () => new EnRuPhraseTpl(new WordPicker(wc, (w) => 1.0));

var penguinGlobalSubtags = [
    ["n", "item", "hasloc"],
    ["n", "relative", "person"],
    ["n", "person", "agent"],
    ["n", "person", "hasloc"],
    ["n", "country", "region"],
    ["n", "in-place", "place"],
    ["n", "at-place", "place"],
    ["n", "item", "object"],
    ["n", "person", "object"]
]

// CHAPTER 3

var ch3Nouns = [
    makeSingularNoun("englishwoman", "англичанка", "f", true, ["agent", "person", "hasloc"]),
    makeSingularNoun("beetroot soup", "борщ", "m", false, ["food", "drink", "hasloc", "item"]),
    makeSingularNoun("brother", "брат", "m", true, ["agent", "person", "hasloc", "relative"]),
//        makeSingularNoun("Vanya", "Ваня", true, "f", ["agent", "person", "name", "hasloc"]),
    makeSingularNoun("wine", "вино", "n", false, ["drink", "hasloc", "item"]),
    makeSingularNoun("vodka", "водка", "f", false, ["drink", "hasloc", "item"]),
//        makeSingularNoun("Volodya", "Володя", "f", true, ["agent", "person", "name", "hasloc"]),
    makeSingularNoun("newspaper", "газета", "f", false, ["hasloc", "item"]),
    makeSingularNoun("door", "дверь", "m", false, ["hasloc", "openable"]),
    makeSingularNoun("day", "день", "m", false, ["timeunit"]),
    makeSingularNoun("house", "дом", "m", false, ["in-place", "hasloc"]),
    makeSingularNoun("uncle", "дядя", "f", true, ["agent", "person", "hasloc", "relative"]),
    makeSingularNoun("mother", "мать", "f", true, ["agent", "person", "hasloc", "relative"]),
    makeSingularNoun("menu", "меню", "n", false, ["item", "hasloc"]),
    makeSingularNoun("Moscow", "Москва", "f", false, ["in-place", "city", "geo-place"]),
    makeSingularNoun("window", "окно", "n", false, ["hasloc", "openable"]),
    makeSingularNoun("dad", "папа", "m", true, ["agent", "person", "hasloc", "relative"]),
    makeSingularNoun("rouble", "рубль", "f", false, ["item"]),
    makeSingularNoun("Siberia", "Сибирь", "f", false, ["in-place", "region", "geo-place"]),
    makeSingularNoun("sour cream", "сметана", "f", false, ["food", "item", "hasloc"]),
    makeSingularNoun("taxi", "такси", "n", false, ["hasloc", "vehicle"]),
    makeSingularNoun("exercise", "упражнение", "n", false, ["nonphysical"]),
    makeSingularNoun("morning", "утро", "n", false, ["timerange"]),
    makeSingularNoun("tea", "чай", "m", false, ["drink", "item", "hasloc"]),
    makeSingularNoun("chocolate", "шоколад", "m", false, ["food", "item", "hasloc"])
];

var ch3Tpls = [
    mktpl().add("n", "item").format("this is {n0}", "это {n0}"),
    mktpl().add("n", "hasloc").format("where is (the) {n0}?", "где {n0}?"),
    mktpl().add("n", "hasloc").format("there's (the) {n0}", "вот {n0}"),
]


// CHAPTER 4

var ch4Nouns = [
    makeSingularNoun("bus", "автобус", "m", false, ["hasloc", "vehicle", "at-place"]),
    makeSingularNoun("hotel", "гостиница", "f", false, ["hasloc", "building", "in-place"]),
    makeSingularNoun("London", "Лондон", "m", false, ["in-place", "city", "geo-place"]),
    makeSingularNoun("metro", "метро", "n", false, ["in-place", "hasloc"]),
    makeSingularNoun("female friend", "подруга", "f", true, ["agent", "person", "hasloc"]),
    makeSingularNoun("avenue", "проспект", "m", false, ["hasloc", "at-place"]),
    makeSingularNoun("Russia", "Россия", "f", false, ["in-place", "country", "geo-place"]),
    makeSingularNoun("language", "язык", "m", false, ["nonphysical"]),
    makeSingularNoun("trolleybus", "троллейбус", "m", false, ["hasloc", "vehicle"]),
    makeSingularNoun("street", "улица", "f", false, ["at-place", "hasloc"]),
];

var ch4Verbs = [
    makeIntransVerb("speak", "говорить", ["agent"], ["about-topic"]),
    makeIntransVerb("go", "ехать", ["agent"], [], "by transport"),
    makeIntransVerb("live", "жить", ["agent"], ["within-place"]),
    makeIntransVerb("work", "работать", ["person"], ["within-place"]),
    makeTransVerb("smoke", "курить", ["person"], ["smokeable"], ["intrans", "within-place"]),
    makeTransVerb("understand", "понимать", ["agent"], ["nonphysical"], ["intrans"]),
    makeTransVerb("study", "изучать", ["person"], ["subject"], ["intrans"])
];

var ch4Tpls = [
    mktpl().add("n", "in-place").decl(0, casePRP).format("in/at {n0}", "в {n0}"),
    mktpl().add("n", "at-place").decl(0, casePRP).format("in/at {n0}", "на {n0}"),
    mktpl().add("n", "hasloc").add("n", "in-place").decl(1, casePRP)
        .format("{n0} is in/at {n1}", "{n0} в {n1}"),
    mktpl().add("n", "hasloc").add("n", "at-place").decl(1, casePRP)
        .format("{n0} is in/at {n1}", "{n0} на {n1}"),
    mktpl().add("v", "intrans").add("n", "", "v0:subj").conj(0, 1).agreeVN(0, 0)
        .format("{n0} {v0}", "{n0} {v0}"),
    mktpl().add("v", "intrans").rpron().conj(0, 1).agreeVN(0, 0)
        .format("{n0} {v0}", "{n0} {v0}")
]

// CHAPTER 5

var ch5Nouns = [
    makeSingularNoun("englishman", "англичанин", "m", true, ["agent", "person", "hasloc"]),
    makeSingularNoun("station", "вокзал", "m", false, ["at-place", "hasloc"]),
    makeSingularNoun("institute", "институт", "m", false, ["in-place", "hasloc"]),
    makeSingularNoun("Crimea", "Крым", "m", false, ["in-place", "region", "geo-place"]),
    makeSingularNoun("forest", "лес", "m", false, ["in-place", "hasloc"]),
    makeSingularNoun("sea", "море", "n", false, ["in-place", "hasloc", "body-water"]),
    makeSingularNoun("museum", "музей", "m", false, ["in-place", "hasloc", "building"]),
    makeSingularNoun("number", "номер", "m", false, ["nonphysical"]),
    makeSingularNoun("letter", "письмо", "n", false, ["item", "hasloc", "topical"]),
    makeSingularNoun("town square", "площадь", "f", false, ["at-place", "hasloc"]),
    makeSingularNoun("post office", "почта", "f", false, ["at-place", "hasloc", "building"]),
    makeSingularNoun("restaurant", "ресторан", "m", false, ["in-place", "building", "hasloc"]),
    makeSingularNoun("garden", "сад", "m", false, ["in-place", "hasloc"]),
    makeSingularNoun("toilet", "туалет", "m", false, ["hasloc"]),
    makeSingularNoun("Ukraine", "Украина", "f", false, ["at-place", "country", "region", "geo-place"]),
    makeSingularNoun("university", "университет", "m", false, ["in-place", "hasloc"]),
    makeSingularNoun("tsar", "царь", "m", true, ["agent", "person", "hasloc"])
];

var ch5Verbs = [
    makeIntransVerb("speak", "говорить", ["agent"], ["about-topic"]),
    makeIntransVerb("live", "жить", ["agent"], ["within-place"]),
    makeIntransVerb("work", "работать", ["person"], ["within-place"]),
    makeTransVerb("smoke", "курить", ["person"], ["smokeable"], ["intrans", "within-place"])
]

var ch5Tpls = [
    ch4Tpls[0], ch4Tpls[1], ch4Tpls[2], ch4Tpls[3],
    mktpl().add("v", "within-place,intrans").add("n", "", "v0:subj").add("n", "in-place")
        .conj(0, 1).agreeVN(0, 0).decl(1, casePRP)
        .format("{n0} {v0} in/at {n1}", "{n0} {v0} в {n1}"),
    mktpl().add("v", "within-place,intrans").add("n", "", "v0:subj").add("n", "at-place")
        .conj(0, 1).agreeVN(0, 0).decl(1, casePRP)
        .format("{n0} {v0} in/at {n1}", "{n0} {v0} на {n1}")
]

// CHAPTER 6

var ch6Nouns = [
    makeSingularNoun("wine", "вино", "n", false, ["drink", "item"]),
    makeSingularNoun("year", "год", "m", false, ["timerange"]),
    makeSingularNoun("grandfather", "дедушка", "m", true, ["person", "agent", "hasloc", "relative"]),
    makeSingularNoun("wife", "жена", "f", true, ["person", "agent", "hasloc", "relative"]),
    makeSingularNoun("husband", "муж", "m", true, ["person", "agent", "hasloc", "relative"]),
    makeSingularNoun("(first) name", "имя", "n", false, ["nonphysical"]),
    makeSingularNoun("shop", "магазин", "m", false, ["in-place", "hasloc", "building"]),
    makeSingularNoun("minute", "минута", "f", false, ["timerange"]),
    makeSingularNoun("music", "музыка", "f", false, ["nonphysical", "audible"]),
    makeSingularNoun("week", "неделя", "f", false, ["timerange"]),
    makeSingularNoun("father", "отец", "m", true, ["person", "agent", "hasloc", "relative"]),
    makeSingularNoun("patronymic", "отчество", "n", false, ["nonphysical"]),
    makeSingularNoun("work", "работа", "f", false, ["event", "at-place"]),
    makeSingularNoun("son", "сын", "m", true, ["person", "agent", "hasloc", "relative"]),
    makeSingularNoun("hour", "час", "m", false, ["timerange"]),
    makeSingularNoun("surname", "фамилия", "f", false, ["nonphysical"])
];

var ch6Verbs = [
    makeTransVerb("love", "любить", ["agent"], [], []),
    makeIntransVerb("fare", "поживать", ["person"], [], "get along"),
];

var ch6Adjs = [
    makeAdj("my", "мой", ["item", "relative"], ["possessive"]),
    makeAdj("your", "твой", ["item", "relative"], ["possessive"]),
    makeAdj("our", "наш", ["item", "relative"], ["possessive"]),
    makeAdj("y'all's", "ваш", ["item", "relative"], ["possessive"]),
    makeAdj("his", "его", ["item", "relative"], ["possessive"]),
    makeAdj("her", "её", ["item", "relative"], ["possessive"]),
    makeAdj("their", "их", ["item", "relative"], ["possessive"]),
];

/*
var ch6Tpl = [
    makeTpl((wr: any) => wr.pickN(["item", "relative"]).pickA(0, "possessive")
                    .format("{a0} {n0}", "{a0} {n0}")),
    makeTpl((wr: any) => wr.pickN(["item"], caseACC)
                    .format("thanks for (the) {n0}", "спасибо за {n0}")),
    makeTpl((wr: any) => wr.pickN(["timerange"], caseACC)
                    .format("in/within a {n0}", "через {n0}")),
];

// CHAPTER 7

var ch7Nouns = [
    makeSingularNoun("bathroom", "ванная", "f", false, ["in-place", "hasloc", "room"]),
    makeSingularNoun("city", "город", "m", false, ["in-place", "hasloc"]),
    makeSingularNoun("apartment", "квартира", "f", false, ["in-place", "hasloc"]),
    makeSingularNoun("book", "книга", "f", false, ["item", "hasloc", "topical", "in-sequence"]),
    makeSingularNoun("Kremlin", "Кремль", "m", false, ["in-place", "building"]),
    makeSingularNoun("kitchen", "кухня", "f", false, ["at-place", "hasloc", "room"]),
    makeSingularNoun("bridge", "мост", "m", false, ["at-place", "hasloc"]),
    makeSingularNoun("overcoat", "пальто", "n", false, ["item", "hasloc", "clothing"]),
    makeSingularNoun("street map", "план", "m", false, ["item", "hasloc"]),
    makeSingularNoun("weather", "погода", "f", false, ["nonphysical"]),
    makeSingularNoun("embassy", "посольство", "n", false, ["in-place", "building", "hasloc"]),
    makeSingularNoun("river", "река", "f", false, ["in-place", "body-water"]),
    makeSingularNoun("bedroom", "спальня", "f", false, ["in-place", "hasloc", "room"]),
    makeSingularNoun("theater", "театр", "m", false, ["in-place", "hasloc", "building"]),
    makeSingularNoun("school", "школа", "f", false, ["in-place", "hasloc", "building"]),
    makeSingularNoun("floor/story", "этаж", "m", false, ["in-sequence"])
];

var ch7Verbs = [
    makeTransVerb("show", "показывать", ["person"], ["item"], [])
];

var ch7Adjs = [

];

// Text substitutions in Russian answers needed for things like contraction / special forms
*/

var penguinGlobalSubs: [RegExp, string][] = [
    [/(\s|^)a ([aeiou])/, "$1an $2"],
    [/(\s|^)в лесе/, "$1в лесу"],
    [/(\s|^)в саде/, "$1в саду"],
    [/(\s|^)в Крыме/, "$1в Крыму"],
    [/(\s|^)о ([аоэуиАОЭУИ])/, "$1об $2"],
    [/(\s|^) мне/, "обо мне"]
];

var penguinChapters: IDictionary<[EnRuNoun[], EnRuVerb[], EnRuAdjective[], EnRuPhraseTpl[]]> = {
    "3": [ch3Nouns, [], [], ch3Tpls],
    "4": [ch4Nouns, ch4Verbs, [], ch4Tpls],
    "5": [ch5Nouns, ch5Verbs, [], ch5Tpls],
//    "6": [ch6Nouns, ch6Verbs, ch6Adjs, ch6Tpl]
};

var penguinTpls: IDictionary<EnRuPhraseTpl> = {};
for (var k in penguinChapters) {
    var tpls = penguinChapters[k][3];
    tpls.map((tpl) => penguinTpls[tpl.guid] = tpl);
}

var allNouns = Object.keys(penguinChapters).map((k) => penguinChapters[k][0]).flat();
var allVerbs = Object.keys(penguinChapters).map((k) => penguinChapters[k][1]).flat();
var allAdjs = Object.keys(penguinChapters).map((k) => penguinChapters[k][2]).flat();

var ruPenguinQuizzer: FlashcardGenerator<EnRuWordStacks, PengQuizzerState> = {
    ftemp: {
        generator: function(seed: EnRuWordStacks): Flashcard<EnRuWordStacks> {
            var res = penguinTpls[seed.tplGuid].gen(seed);
            return {
                params: seed,
                prompt: res[0],
                answers: [res[1]],
                hint: res[1],
                uuid: guidGenerator()
            }
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
    seeder: function(st: PengQuizzerState) {
        var selNouns = st.activeChapters.map((k) => penguinChapters[k][0]).flat();
        var selVerbs = st.activeChapters.map((k) => penguinChapters[k][1]).flat();
        var selAdjs = st.activeChapters.map((k) => penguinChapters[k][2]).flat();
        var selTpls = st.activeChapters.map((k) => penguinChapters[k][3]).flat();

        lib["n"] = selNouns;
        lib["v"] = selVerbs;
        lib["a"] = selAdjs;
        wc = new WordRelChecker(lib);
       
        for (var i = 0; i < 20; i++) {
            var tpl = selTpls[Math.floor(Math.random() * selTpls.length)];
            console.log(tpl.gen(tpl.next(wc)));
        }
 
        var tpl = selTpls[Math.floor(Math.random() * selTpls.length)];
        tpl.subs = penguinGlobalSubs;
        return tpl.next(wc);
    },
    updater: (correct, answer, card, st) => {
        var incVec = correct ? [1, 0] : [0, 1];
        for (var k in card.params.words["n"]) {
            var n = card.params.words["n"][k];
            if (!(n.guid in st.stats.nounStats)) st.stats.nounStats[n.guid] = [0, 0];
            st.stats.nounStats[n.guid][0] += incVec[0];
            st.stats.nounStats[n.guid][1] += incVec[1];
        }
        for (var k in card.params.words["v"]) {
            var v = card.params.words["v"][k];
            if (!(v.guid in st.stats.verbStats)) st.stats.verbStats[v.guid] = [0, 0];
            st.stats.verbStats[v.guid][0] += incVec[0];
            st.stats.verbStats[v.guid][1] += incVec[1];
        }
        for (var k in card.params.words["a"]) {
            var a = card.params.words["a"][k];
            if (!(a.guid in st.stats.adjStats)) st.stats.adjStats[a.guid] = [0, 0];
            st.stats.adjStats[a.guid][0] += incVec[0];
            st.stats.adjStats[a.guid][1] += incVec[1];
        }
        if (!(card.params.tplGuid in st.stats.tplStats)) st.stats.tplStats[card.params.tplGuid] = [0, 0];
        st.stats.tplStats[card.params.tplGuid][0] += incVec[0];
        st.stats.tplStats[card.params.tplGuid][1] += incVec[1];
        return st;
    },
    history: [],
    editor: makePengMenu
}

defaultDecks["russian-penguin-deck"] = {
    name: "Penguin Russian Course quizzer",
    slug: "russian-penguin-deck",
    decktype: "russian-penguin-driller",
    resources: ["russian-verbs", "russian-nouns", "russian-adjs"],
    view: {
        color: "#ffddff"
    },
    state: ruPenguinQuizzer.state
}

providedGenerators["russian-penguin-driller"] = ruPenguinQuizzer;
indexedResources["russian-verbs"] = () => ruDataPromise("ru-verbs", "ruVerbs");
indexedResources["russian-nouns"] = () => ruDataPromise("ru-nouns", "ruNouns");
indexedResources["russian-adjs"] = () => ruDataPromise("ru-adjectives", "ruAdjectives");
