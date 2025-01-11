"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lib_1 = require("./lib");
const progression_1 = require("./progression");
const papa = require("papaparse");
const EnglishPlural = require("pluralize-me");
var ruDataPromise = (filename, objname) => fetch(`/data/${filename}.csv`).then((r) => r.text()).then((s) => {
    var csvData = papa.parse(s, { header: true, dynamicTyping: true }).data;
    window[objname] = (bareVerb) => {
        var v = csvData.find((k) => k.bare === bareVerb);
        return v;
    };
});
var ruFreqlistPromise = () => fetch("/data/ru-freqlist.csv").then((r) => r.text()).then((s) => {
    var csvData = papa.parse(s, { header: false }).data;
    window["ruFreqlist"] = (n) => {
        return csvData[n];
    };
});
var RussianCase;
(function (RussianCase) {
    RussianCase[RussianCase["CaseNominative"] = 0] = "CaseNominative";
    RussianCase[RussianCase["CaseAccusative"] = 1] = "CaseAccusative";
    RussianCase[RussianCase["CaseDative"] = 2] = "CaseDative";
    RussianCase[RussianCase["CasePrepositional"] = 3] = "CasePrepositional";
    RussianCase[RussianCase["CaseInstrumental"] = 4] = "CaseInstrumental";
    RussianCase[RussianCase["CaseGenitive"] = 5] = "CaseGenitive";
})(RussianCase || (RussianCase = {}));
var RussianPerson;
(function (RussianPerson) {
    RussianPerson[RussianPerson["Person1st"] = 0] = "Person1st";
    RussianPerson[RussianPerson["Person2nd"] = 1] = "Person2nd";
    RussianPerson[RussianPerson["Person3rd"] = 2] = "Person3rd";
})(RussianPerson || (RussianPerson = {}));
var RussianGender;
(function (RussianGender) {
    RussianGender[RussianGender["GenderMale"] = 0] = "GenderMale";
    RussianGender[RussianGender["GenderFemale"] = 1] = "GenderFemale";
    RussianGender[RussianGender["GenderNeuter"] = 2] = "GenderNeuter";
})(RussianGender || (RussianGender = {}));
var RussianNumber;
(function (RussianNumber) {
    RussianNumber[RussianNumber["NumberSingular"] = 0] = "NumberSingular";
    RussianNumber[RussianNumber["NumberPlural"] = 1] = "NumberPlural";
})(RussianNumber || (RussianNumber = {}));
var RussianTense;
(function (RussianTense) {
    RussianTense[RussianTense["TensePresent"] = 0] = "TensePresent";
    RussianTense[RussianTense["TenseFuture"] = 1] = "TenseFuture";
    RussianTense[RussianTense["TensePast"] = 2] = "TensePast";
})(RussianTense || (RussianTense = {}));
function ruConjVerb(vb, tense, gdr, psn, nbr) {
    var record = window.ruVerbs(vb);
    var key = "";
    switch (tense) {
        case RussianTense.TensePresent:
            switch (psn) {
                case RussianPerson.Person1st:
                    key = (nbr === RussianNumber.NumberSingular) ? "presfut_sg1" : "presfut_pl1";
                    break;
                case RussianPerson.Person2nd:
                    key = (nbr === RussianNumber.NumberSingular) ? "presfut_sg2" : "presfut_pl2";
                    break;
                case RussianPerson.Person3rd:
                    key = (nbr === RussianNumber.NumberSingular) ? "presfut_sg3" : "presfut_pl3";
                    break;
                default:
                    break;
            }
            break;
        case RussianTense.TensePast:
            if (nbr === RussianNumber.NumberPlural) {
                key = "past_pl";
            }
            else {
                switch (gdr) {
                    case RussianGender.GenderMale:
                        key = "past_m";
                        break;
                    case RussianGender.GenderFemale:
                        key = "past_f";
                        break;
                    case RussianGender.GenderNeuter:
                        key = "past_n";
                        break;
                    default:
                        break;
                }
            }
            break;
        case RussianTense.TenseFuture:
            key = "";
            break;
    }
    return record[key];
}
function ruDeclineAdj(adj, cs, gdr, nbr, isAnimate = false) {
    var record = window.ruAdjectives(adj);
    var gdrStr = "";
    if (nbr === RussianNumber.NumberPlural)
        gdrStr = "pl";
    else if (gdr === RussianGender.GenderMale)
        gdrStr = "m";
    else if (gdr === RussianGender.GenderFemale)
        gdrStr = "f";
    else if (gdr === RussianGender.GenderNeuter)
        gdrStr = "n";
    var cStr = ["nom", "acc", "dat", "prep", "inst", "gen"][cs];
    var col = `decl_${gdrStr}_${cStr}`;
    var decls = record[col].split(',');
    // There is a problem - sometimes the CSV file contains a special "animate" declination
    if (col === "decl_m_acc") {
        if (isAnimate)
            decls = decls.filter((s) => s.endsWith("го"));
        else
            decls = decls.filter((s) => !s.endsWith("го"));
    }
    return decls[0];
}
function ruDeclineNoun(nn, cs, nbr, which = 0) {
    var record = window.ruNouns(nn);
    var numStr = (nbr === RussianNumber.NumberPlural) ? "pl" : "sg";
    var cStr = ["nom", "acc", "dat", "prep", "inst", "gen"][cs];
    return record[`${numStr}_${cStr}`].split(', ')[which];
}
function ruGetGender(nn) {
    var record = window.ruNouns(nn);
    if (record["gender"] == "m")
        return RussianGender.GenderMale;
    if (record["gender"] == "f")
        return RussianGender.GenderFemale;
    return RussianGender.GenderNeuter;
}
function ruIsAnimate(nn) {
    var record = window.ruNouns(nn);
    if (record["animate"] === "1")
        return true;
    return false;
}
const enNomPron = ["I", "you", "he", "we", "y'all", "they"];
const ruNomPron = ["я", "ты", "он", "мы", "вы", "они"];
const subjPresentCols = [
    "presfut_sg1",
    "presfut_sg2",
    "presfut_sg3",
    "presfut_pl1",
    "presfut_pl2",
    "presfut_pl3"
];
var ruVerbQuizzer = {
    ftemp: {
        generator: function (seed) {
            var answer = `${ruNomPron[seed[0]]} ${window.ruVerbs(seed[2])[subjPresentCols[seed[0]]]}`;
            answer = answer.replace("'", "");
            return {
                params: seed,
                prompt: `${enNomPron[seed[0]]} ${seed[1]}`,
                answers: [answer],
                hint: answer,
                uuid: (0, lib_1.guidGenerator)()
            };
        }
    },
    state: [
        ["speak", "говорить"]
    ],
    seeder: function (vbs) {
        var pronInd = Math.floor(Math.random() * ruNomPron.length);
        var vb = vbs[Math.floor(Math.random() * vbs.length)];
        return [pronInd, vb[0], vb[1]];
    },
    updater: (correct, answer, card, st) => st,
    history: [],
    editor: (vbs) => {
        var validator = (ruStr) => window.ruVerbs(ruStr) !== undefined;
        var editor = (0, lib_1.makeTranslationEditor)(vbs, validator);
        return {
            element: editor.element,
            menuToState: () => editor.menuToState().filter((c) => validator(c[1]))
        };
    }
};
var ruFreqQuizzer = (0, progression_1.geometricProgressFGen)((n) => {
    var record = window.ruFreqlist(n);
    return [record[1], record[0].split(" ")[0].split("/")[0], `"${record[2].split('|')[1]}"`];
}, 1000);
function stpl(templ) {
    return (y) => templ.replace("{}", y);
}
var sampleRuAdjCaseState = {
    nouns: [
        ["wine", "вино"],
        ["vodka", "водка"],
        ["water", "вода"],
        ["juice", "сок"],
        ["milk", "молоко"]
    ],
    adjs: [
        ["good", "хороший"],
        ["Russian", "русский"],
        ["Canadian", "канадский"],
        ["bad", "плохой"],
        ["tasty", "вкусный"]
    ],
    enabledCases: [
        [true, true, false, true, false, true],
        [true, true, false, true, false, true]
    ],
    pluralProb: 0.5
};
var ruAdjTemplates = [
    [stpl("{}"), stpl("the {}"), RussianCase.CaseNominative],
    [stpl("есть {}"), stpl("there is {}"), RussianCase.CaseNominative],
    [stpl("в {}"), stpl("in the {}"), RussianCase.CasePrepositional],
    [stpl("около {}"), stpl("near the {}"), RussianCase.CaseGenitive],
    [stpl("у {}"), stpl("by the {}"), RussianCase.CaseGenitive],
    [stpl("без {}"), stpl("without the {}"), RussianCase.CaseGenitive],
    [stpl("нет {}"), stpl("there's no {}"), RussianCase.CaseGenitive],
    [stpl("дайте {}"), stpl("gimme the {}"), RussianCase.CaseAccusative]
];
var ruAdjCaseQuizzer = {
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
    state: sampleRuAdjCaseState,
    seeder: function (st) {
        console.log(ruDeclineNoun("водка", RussianCase.CaseNominative, RussianNumber.NumberPlural));
        console.log(st.enabledCases);
        var allowedCases = [0, 1, 2, 3, 4, 5].filter((i) => st.enabledCases[0][i] || st.enabledCases[1][i]);
        console.log(allowedCases);
        var chosenCase = allowedCases[Math.floor(Math.random() * allowedCases.length)];
        var canBePlural = st.enabledCases[1][chosenCase];
        var tplChoices = ruAdjTemplates.filter((tpl) => tpl[2] == chosenCase);
        var tpl = tplChoices[Math.floor(Math.random() * tplChoices.length)];
        var chosenAdj = st.adjs[Math.floor(Math.random() * st.adjs.length)];
        var chosenNoun = st.nouns[Math.floor(Math.random() * st.nouns.length)];
        var chosenNumber = (window.ruNouns(chosenNoun[1])["sg_only"] !== 1 && canBePlural && Math.random() < st.pluralProb)
            ? RussianNumber.NumberPlural : RussianNumber.NumberSingular;
        var inflNoun = ruDeclineNoun(chosenNoun[1], chosenCase, chosenNumber);
        var inflAdj = ruDeclineAdj(chosenAdj[1], chosenCase, ruGetGender(chosenNoun[1]), chosenNumber, ruIsAnimate(chosenNoun[1]));
        chosenNoun[0] = (chosenNumber == RussianNumber.NumberPlural) ? EnglishPlural.plural(chosenNoun[0]) : chosenNoun[0];
        var enPhrase = `${chosenAdj[0]} ${chosenNoun[0]}`;
        var ruPhrase = `${inflAdj} ${inflNoun}`.replace(/'/g, "");
        return [tpl[1](enPhrase), tpl[0](ruPhrase)];
    },
    updater: (correct, answer, card, st) => st,
    history: [],
    editor: (st) => {
        var contDiv = document.createElement("div");
        var sliderPlural = (0, lib_1.floatEditor)("Probability of plurals", st.pluralProb, 0, 1);
        var nounsHdr = document.createElement("h3");
        nounsHdr.textContent = "Nouns";
        var editNouns = (0, lib_1.makeTranslationEditor)(st.nouns, (nn) => window.ruNouns(nn) !== undefined);
        var adjsHdr = document.createElement("h3");
        adjsHdr.textContent = "Adjectives";
        var editAdjs = (0, lib_1.makeTranslationEditor)(st.adjs, (adj) => window.ruAdjectives(adj) !== undefined);
        var selectCombos = (0, lib_1.tableEditor)(st.enabledCases, ["Singular", "Plural"], ["Nom", "Acc", "Dat", "Prep", "Inst", "Gen"], (b) => (0, lib_1.boolEditor)("", b));
        var combosHdr = document.createElement("h3");
        combosHdr.textContent = "Enabled cases and numbers";
        [sliderPlural.element,
            combosHdr,
            selectCombos.element,
            nounsHdr,
            editNouns.element,
            adjsHdr,
            editAdjs.element].map((el) => contDiv.appendChild(el));
        return {
            element: contDiv,
            menuToState: () => {
                return {
                    nouns: editNouns.menuToState(),
                    adjs: editAdjs.menuToState(),
                    enabledCases: selectCombos.menuToState(),
                    pluralProb: sliderPlural.menuToState()
                };
            }
        };
    }
};
lib_1.defaultDecks["russian-verb-deck"] = {
    name: "Russian present-tense verb conjugations",
    slug: "russian-verb-deck",
    decktype: "russian-verb-driller",
    resources: ["russian-verbs"],
    view: {
        color: "#eee0ff"
    },
    state: ruVerbQuizzer.state
};
lib_1.defaultDecks["russian-adj-case-deck"] = {
    name: "Russian adjective declinaitions in various cases",
    slug: "russian-adj-case-deck",
    decktype: "russian-adj-case-driller",
    resources: ["russian-nouns", "russian-adjectives"],
    view: {
        color: "#eee0ff"
    },
    state: ruAdjCaseQuizzer.state
};
lib_1.defaultDecks["russian-freq-deck"] = {
    name: "Russian 1000 most common words",
    slug: "russian-freq-deck",
    decktype: "russian-freq-driller",
    resources: ["russian-freqlist"],
    view: {
        color: "#eee0ff"
    },
    state: ruFreqQuizzer.state
};
lib_1.providedGenerators["russian-verb-driller"] = ruVerbQuizzer;
lib_1.providedGenerators["russian-adj-case-driller"] = ruAdjCaseQuizzer;
lib_1.providedGenerators["russian-freq-driller"] = ruFreqQuizzer;
lib_1.indexedResources["russian-verbs"] = () => ruDataPromise("ru-verbs", "ruVerbs");
lib_1.indexedResources["russian-nouns"] = () => ruDataPromise("ru-nouns", "ruNouns");
lib_1.indexedResources["russian-adjectives"] = () => ruDataPromise("ru-adjectives", "ruAdjectives");
lib_1.indexedResources["russian-freqlist"] = () => ruFreqlistPromise();
