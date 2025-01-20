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
    ruDataPromise,
    EnRuNoun,
    EnRuVerb,
    EnRuAdjective,
    EnRuPhraseTpl,
    EnRuWordLibrary,
    WordRepo,
    makeSingularNoun,
    makeTransVerb,
    makeIntransVerb,
    makeAdj,
    makeTpl,
    applyTpl,
    caseNOM,
    caseACC,
    casePRP
} from "./russian-templating";

type PengQuizzerStats = {
    nounStats: IDictionary<[number, number]>,
    verbStats: IDictionary<[number, number]>,
    adjStats: IDictionary<[number, number]>,
    tplStats: IDictionary<[number, number]>,
    genderStats: number[],
    numberStats: number[],
    personStats: number[]
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

// The templates need to NOT be serialized into the state object!
// Instead, they should be globally stored and referenced by some kind of ID based on their group.

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

var ch3Tpl = [
    makeTpl((wr: any) => wr.pickN("item").format("this is {n0}", "это {n0}")),
    makeTpl((wr: any) => wr.pickN("hasloc").format("where's (the) {n0}?", "где {n0}?")),
    makeTpl((wr: any) => wr.pickN("hasloc").format("there's (the) {n0}", "вот {n0}"))
];

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
    makeSingularNoun("street", "улица", "f", false, ["at-place", "hasloc"])
];

var ch4Verbs = [
    makeIntransVerb("speak", "говорить", "agent", ["about-topic"]),
    makeIntransVerb("go", "ехать", "agent", [], "by transport"),
    makeIntransVerb("live", "жить", "agent", ["within-place"]),
    makeIntransVerb("work", "работать", "person", ["within-place"]),
    makeTransVerb("smoke", "курить", "person", "smokeable", ["intrans", "within-place"]),
    makeTransVerb("understand", "понимать", "agent", "nonphysical", ["intrans"]),
    makeTransVerb("study", "изучать", "person", "subject", ["intrans"])
];

var ch4Tpl = [
//    makeTpl((wr: any) => wr.pickPron(["person"]).pickAxn(0, "intrans").conjV(0, 0)
//                    .format("{n0} {v0}", "{n0} {v0}")),
    makeTpl((wr: any) => wr.pickV(1, "intrans").pickSubj(0)
                    .format("{n0} {v0}", "{n0} {v0}")),
    makeTpl((wr: any) => wr.pickV(1, "intrans").pickSubj(0)
                    .format("{n0} do/does not {v0}", "{n0} не {v0}")),
    makeTpl((wr: any) => wr.pickPron(["person"]).pickAxn(0, "intrans").conjV(0, 0)
                    .format("{n0} do/does not {v0}", "{n0} не {v0}")),
    makeTpl((wr: any) => wr.pickN("in-place", casePRP)
                    .format("in/at {n0}", "в {n0}"))
];

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
    makeSingularNoun("bathroom", "туалет", "m", false, ["in-place", "hasloc"]),
    makeSingularNoun("Ukraine", "Украина", "f", false, ["at-place", "country", "region", "geo-place"]),
    makeSingularNoun("university", "университет", "m", false, ["in-place", "hasloc"]),
    makeSingularNoun("tsar", "царь", "m", true, ["agent", "person", "hasloc"])
];

var ch5Verbs = [
    makeIntransVerb("speak", "говорить", "agent", ["about-topic"]),
    makeIntransVerb("live", "жить", "agent", ["within-place"]),
    makeIntransVerb("work", "работать", "person", ["within-place"]),
    makeTransVerb("smoke", "курить", "person", "smokeable", ["intrans", "within-place"])
]

var ch5Tpl = [
    makeTpl((wr: any) => wr.pickN("in-place", casePRP)
                    .format("in/at {n0}", "в {n0}")),
    makeTpl((wr: any) => wr.pickN("at-place", casePRP)
                    .format("in/at {n0}", "на {n0}")),
    makeTpl((wr: any) => wr.pickN("hasloc").pickN("in-place", casePRP)
                    .format("{n0} is in/at {n1}", "{n0} в {n1}")),
    makeTpl((wr: any) => wr.pickN("hasloc").pickN("at-place", casePRP)
                    .format("{n0} is in/at {n1}", "{n0} на {n1}")),
    makeTpl((wr: any) => wr.pickV(1, "within-place").pickSubj(0).pickN("in-place", casePRP)
                    .format("{n0} {v0} in/at {n1}", "{n0} {v0} в {n1}")),
    makeTpl((wr: any) => wr.pickV(1, "within-place").pickSubj(0).pickN("at-place", casePRP)
                    .format("{n0} {v0} in/at {n1}", "{n0} {v0} на {n1}")),
]

// CHAPTER 6

var ch6Nouns = [
    makeSingularNoun("wine", "вино", "n", false, ["drink", "item"]),
    makeSingularNoun("year", "год", "m", false, ["timerange"]),
    makeSingularNoun("grandfather", "дедушка", "m", true, ["person", "agent", "hasloc", "relative"]),
    makeSingularNoun("wife", "жена", "f", true, ["person", "agent", "hasloc", "relative"]),
    makeSingularNoun("husband", "муж", "m", true, ["person", "agent", "hasloc", "relative"])
];

var ch6Verbs = [
    makeTransVerb("love", "любить", "agent", "", [])
];

var ch6Adjs = [
    makeAdj("my", "мой", "item", ["possessive"]),
    makeAdj("my", "мой", "relative", ["possessive"]),
    makeAdj("your", "твой", "item", ["possessive"]),
    makeAdj("your", "твой", "relative", ["possessive"]),
    makeAdj("our", "наш", "item", ["possessive"]),
    makeAdj("our", "наш", "relative", ["possessive"]),
    makeAdj("y'all's", "ваш", "item", ["possessive"]),
    makeAdj("y'all's", "ваш", "relative", ["possessive"]),
    makeAdj("his", "его", "item", ["possessive"]),
    makeAdj("his", "его", "relative", ["possessive"]),
    makeAdj("her", "её", "item", ["possessive"]),
    makeAdj("her", "её", "relative", ["possessive"]),
    makeAdj("their", "их", "item", ["possessive"]),
    makeAdj("their", "их", "relative", ["possessive"])
];

var ch6Tpl = [
    makeTpl((wr: any) => wr.pickN("item").pickA(0)
                    .format("{a0} {n0}", "{a0} {n0}")),
    makeTpl((wr: any) => wr.pickN("relative").pickA(0)
                    .format("{a0} {n0}", "{a0} {n0}")),
    makeTpl((wr: any) => wr.pickN("item", caseACC)
                    .format("thanks for (the) {n0}", "спасибо за {n0}"))
];

// Text substitutions in Russian answers needed for things like contraction / special forms

var penguinGlobalSubs: [RegExp, string][] = [
    [/(\s|^)в лесе/, "$1в лесу"],
    [/(\s|^)в саде/, "$1в саду"],
    [/(\s|^)в Крыме/, "$1в Крыму"],
    [/(\s|^)о ([аоэуиАОЭУИ])/, "$1об $2"],
    [/(\s|^) мне/, "обо мне"]
];

var penguinChapters: IDictionary<[EnRuNoun[], EnRuVerb[], EnRuAdjective[], EnRuPhraseTpl[]]> = {
    "3": [ch3Nouns, [], [], ch3Tpl],
    "4": [ch4Nouns, ch4Verbs, [], ch4Tpl],
    "5": [ch5Nouns, ch5Verbs, [], ch5Tpl],
    "6": [ch6Nouns, ch6Verbs, ch6Adjs, ch6Tpl]
};

var allNouns = Object.keys(penguinChapters).map((k) => penguinChapters[k][0]).flat();
var allVerbs = Object.keys(penguinChapters).map((k) => penguinChapters[k][1]).flat();
var allAdjs = Object.keys(penguinChapters).map((k) => penguinChapters[k][2]).flat();

var ruPenguinQuizzer: FlashcardGenerator<WordRepo, PengQuizzerState> = {
    ftemp: {
        generator: function(seed: WordRepo): Flashcard<WordRepo> {
        for (var i in [...Array(100).keys()]) {
            console.log(ruPenguinQuizzer.seeder(ruPenguinQuizzer.state).resolve());
        }
            var res = seed.resolve();
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
            tplStats: {},
            genderStats: [],
            numberStats: [],
            personStats: []
        }
    },
    seeder: function(st: PengQuizzerState) {
        var selNouns = st.activeChapters.map((k) => penguinChapters[k][0]).flat();
        var selVerbs = st.activeChapters.map((k) => penguinChapters[k][1]).flat();
        var selAdjs = st.activeChapters.map((k) => penguinChapters[k][2]).flat();
        var selTpls = st.activeChapters.map((k) => penguinChapters[k][3]).flat();
        var selLib = new EnRuWordLibrary(selNouns, selVerbs, selAdjs, selTpls);
        
        selLib.nounWeights = selLib.makeWeights(st.stats.nounStats);
        selLib.verbWeights = selLib.makeWeights(st.stats.verbStats);
        selLib.adjWeights = selLib.makeWeights(st.stats.adjStats);
        selLib.tplWeights = selLib.makeWeights(st.stats.tplStats);

        var tpl = selLib.pickTpl(); 
        var repo = new WordRepo(selLib);
        repo.substitutions = penguinGlobalSubs;
        var res = applyTpl(tpl, repo);
        return res;
    },
    updater: (correct, answer, card, st) => {
        var incVec = correct ? [1, 0] : [0, 1];
        for (var k in card.params.nouns) {
            var n = card.params.nouns[k][0];
            if (!(n.guid in st.stats.nounStats)) st.stats.nounStats[n.guid] = [0, 0];
            st.stats.nounStats[n.guid][0] += incVec[0];
            st.stats.nounStats[n.guid][1] += incVec[1];
        }
        for (var k in card.params.verbs) {
            var v = card.params.verbs[k][0];
            if (!(v.guid in st.stats.verbStats)) st.stats.verbStats[v.guid] = [0, 0];
            st.stats.verbStats[v.guid][0] += incVec[0];
            st.stats.verbStats[v.guid][1] += incVec[1];
        }
        for (var k in card.params.adjs) {
            var a = card.params.adjs[k][0];
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

