"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lib_1 = require("./lib");
const progression_1 = require("./progression");
const papa = require("papaparse");
const GermanVerbsLib = require('german-verbs');
const GermanVerbsDict = require('german-verbs-dict/dist/verbs.json');
const GermanDets = require('german-determiners');
const GermanWords = require('german-words');
const GermanWordsList = require('german-words-dict/dist/words.json');
const EnglishVerbs = require('english-verbs');
const EnglishVerbHelper = require('english-verbs-helper');
const EnglishPlurals = require('english-plurals');
const EnglishPluralsIrregular = require('english-plurals-list/dist/plurals.json');
const EnglishPlural = require("pluralize-me");
const sampleGermanSVOState = {
    settings: {
        subjPronProb: 0.3,
        objPronProb: 0.1,
        pluralProb: 0.4
    },
    verbs: [
        {
            en: "love",
            de: "lieben",
            hint: "",
            tags: []
        },
        {
            en: "kill",
            de: "töten",
            hint: "",
            tags: []
        }
    ],
    nouns: [
        {
            en: "man",
            de: "Mann",
            hint: "",
            tags: [],
            canBeSubj: true,
            canBeObj: true
        },
        {
            en: "woman",
            de: "Frau",
            hint: "",
            tags: [],
            canBeSubj: true,
            canBeObj: true
        },
        {
            en: "dog",
            de: "Hund",
            hint: "",
            tags: [],
            canBeSubj: true,
            canBeObj: true
        }
    ]
};
function germanSubjPronoun(gen, num, per) {
    switch (per) {
        case 1:
            return num == 'S' ? "ich" : "wir";
        case 2:
            return num == 'S' ? "du" : "ihr";
        case 3:
            if (num == 'P')
                return "sie";
            else {
                switch (gen) {
                    case 'M':
                        return "er";
                    case 'F':
                        return "sie";
                    case 'N':
                        return "es";
                }
            }
    }
}
function germanObjPronoun(gen, num, per) {
    switch (per) {
        case 1:
            return num == 'S' ? "mich" : "uns";
        case 2:
            return num == 'S' ? "dich" : "euch";
        case 3:
            if (num == 'P')
                return "sie";
            else {
                switch (gen) {
                    case 'M':
                        return "ihn";
                    case 'F':
                        return "sie";
                    case 'N':
                        return "es";
                }
            }
    }
}
function englishSubjPronoun(gen, num, per) {
    switch (per) {
        case 1:
            return num == 'S' ? "I" : "we";
        case 2:
            return num == 'S' ? "you" : "y'all";
        case 3:
            if (num == 'P')
                return "they";
            else {
                switch (gen) {
                    case 'M':
                        return "he";
                    case 'F':
                        return "she";
                    case 'N':
                        return "it";
                }
            }
    }
}
function englishObjPronoun(gen, num, per) {
    switch (per) {
        case 1:
            return num == 'S' ? "me" : "us";
        case 2:
            return num == 'S' ? "you" : "y'all";
        case 3:
            if (num == 'P')
                return "them";
            else {
                switch (gen) {
                    case 'M':
                        return "him";
                    case 'F':
                        return "her";
                    case 'N':
                        return "it";
                }
            }
    }
}
function englishMakePlural(noun) {
    return EnglishPlural.plural(noun);
}
function generateSVOPhrase(st) {
    var subjGender, objGender;
    var subjNumber, objNumber;
    var subjPerson, objPerson;
    var subjPhraseEn, subjPhraseDe;
    var verbPhraseEn, verbPhraseDe;
    var objPhraseEn, objPhraseDe;
    var sentenceEn, sentenceDe;
    var subjNouns = st.nouns.filter((noun) => noun.canBeSubj);
    subjNumber = (Math.random() < st.settings.pluralProb ? 'P' : 'S');
    objNumber = (Math.random() < st.settings.pluralProb ? 'P' : 'S');
    if (subjNouns.length == 0 || Math.random() < st.settings.subjPronProb) {
        subjGender = ['M', 'F', 'N'][Math.floor(Math.random() * 3)];
        subjPerson = [1, 2, 3][Math.floor(Math.random() * 3)];
        subjPhraseEn = englishSubjPronoun(subjGender, subjNumber, subjPerson);
        subjPhraseDe = germanSubjPronoun(subjGender, subjNumber, subjPerson);
    }
    else {
        var subjNoun = subjNouns[Math.floor(Math.random() * subjNouns.length)];
        subjPerson = 3;
        subjGender = GermanWords.getGenderGermanWord(null, GermanWordsList, subjNoun.de);
        var subjDet = GermanDets.getDet('DEFINITE', 'NOMINATIVE', null, null, subjGender, subjNumber);
        var subjNounEn = subjNumber == 'S' ? subjNoun.en : englishMakePlural(subjNoun.en);
        var subjNounDe = GermanWords.getCaseGermanWord(null, GermanWordsList, subjNoun.de, 'NOMINATIVE', subjNumber);
        subjPhraseEn = `the ${subjNounEn}`;
        subjPhraseDe = `${subjDet} ${subjNounDe}`;
    }
    var chosenVerb = st.verbs[Math.floor(Math.random() * st.verbs.length)];
    var personIndEn = (subjNumber == 'S' ? 0 : 3) + subjPerson - 1;
    verbPhraseEn = EnglishVerbHelper.getConjugation(null, chosenVerb.en, 'PRESENT', personIndEn);
    var verbConjDe = GermanVerbsLib.getConjugation(GermanVerbsDict, chosenVerb.de, 'PRASENS', subjPerson, subjNumber);
    var objNouns = st.nouns.filter((noun) => noun.canBeObj);
    if (objNouns.length == 0 || Math.random() < st.settings.objPronProb) {
        objGender = ['M', 'F', 'N'][Math.floor(Math.random() * 3)];
        objPerson = [1, 2, 3][Math.floor(Math.random() * 3)];
        objPhraseEn = englishObjPronoun(objGender, objNumber, objPerson);
        objPhraseDe = germanObjPronoun(objGender, objNumber, objPerson);
    }
    else {
        var objNoun = objNouns[Math.floor(Math.random() * objNouns.length)];
        objPerson = 3;
        objGender = GermanWords.getGenderGermanWord(null, GermanWordsList, objNoun.de);
        var objDet = GermanDets.getDet('DEFINITE', 'ACCUSATIVE', null, null, objGender, objNumber);
        var objNounEn = objNumber == 'S' ? objNoun.en : englishMakePlural(objNoun.en);
        var objNounDe = GermanWords.getCaseGermanWord(null, GermanWordsList, objNoun.de, 'ACCUSATIVE', objNumber);
        objPhraseEn = `the ${objNounEn}`;
        objPhraseDe = `${objDet} ${objNounDe}`;
    }
    sentenceEn = `${subjPhraseEn} ${verbPhraseEn} ${objPhraseEn}`;
    sentenceDe = `${subjPhraseDe} ${verbConjDe[0]} ${objPhraseDe}${verbConjDe.length > 1 ? ` ${verbConjDe[1]}` : ""}`;
    return [sentenceEn, sentenceDe];
}
function makeNounEditor(noun) {
    var englishVerbField = (0, lib_1.validatedTextFieldEditor)(noun.en, (wd) => true);
    var germanVerbField = (0, lib_1.validatedTextFieldEditor)(noun.de, (wd) => wd in GermanWordsList);
    var subjField = (0, lib_1.boolEditor)("Subject?", noun.canBeSubj);
    subjField.element.style.display = "inline-block";
    var objField = (0, lib_1.boolEditor)("Object?", noun.canBeObj);
    objField.element.style.display = "inline-block";
    var contDiv = document.createElement("div");
    [englishVerbField, germanVerbField, subjField, objField].map((el) => contDiv.appendChild(el.element));
    return {
        element: contDiv,
        menuToState: () => {
            return {
                en: englishVerbField.menuToState(),
                de: germanVerbField.menuToState(),
                hint: "",
                tags: [],
                canBeSubj: subjField.menuToState(),
                canBeObj: objField.menuToState()
            };
        }
    };
}
function makeNounsEditor(nouns) {
    return (0, lib_1.multipleEditors)(nouns, {
        en: "",
        de: "",
        hint: "",
        tags: [],
        canBeSubj: false,
        canBeObj: true
    }, makeNounEditor, true, (s, cd) => cd.en.includes(s) || cd.de.includes(s));
}
var deSVOQuizzer = {
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
    state: sampleGermanSVOState,
    seeder: function (st) {
        return generateSVOPhrase(st);
    },
    updater: (correct, answer, card, st) => st,
    history: [],
    editor: (st) => {
        var validateVerbDe = (deStr) => deStr in GermanVerbsDict;
        var validateNounDe = (deStr) => deStr in GermanWordsList;
        var conf = st.settings;
        var sliderSubjPron = (0, lib_1.floatEditor)("Probability of subject pronouns", conf.subjPronProb, 0, 1);
        var sliderObjPron = (0, lib_1.floatEditor)("Probability of object pronouns", conf.objPronProb, 0, 1);
        var sliderPlural = (0, lib_1.floatEditor)("Probability of plurals", conf.pluralProb, 0, 1);
        var editNouns = makeNounsEditor(st.nouns);
        var editVerbs = (0, lib_1.makeTranslationEditor)(st.verbs.map((vb) => [vb.en, vb.de]), validateVerbDe);
        var contDiv = document.createElement("div");
        var nounTitle = document.createElement("h3");
        var verbTitle = document.createElement("h3");
        nounTitle.textContent = "Nouns";
        verbTitle.textContent = "Verbs";
        var components = [
            sliderSubjPron.element,
            sliderObjPron.element,
            sliderPlural.element,
            nounTitle,
            editNouns.element,
            verbTitle,
            editVerbs.element
        ];
        components.map((el) => contDiv.appendChild(el));
        return {
            element: contDiv,
            menuToState: () => {
                var nouns = editNouns.menuToState();
                var verbs = editVerbs.menuToState().map((wd) => {
                    return {
                        en: wd[0],
                        de: wd[1],
                        hint: "",
                        tags: []
                    };
                });
                return {
                    settings: {
                        subjPronProb: sliderSubjPron.menuToState(),
                        objPronProb: sliderObjPron.menuToState(),
                        pluralProb: sliderPlural.menuToState()
                    },
                    nouns: nouns,
                    verbs: verbs
                };
            }
        };
    }
};
var deVerbsRes = () => fetch("/data/de-verbs.csv").then((r) => r.text()).then((s) => {
    var csvData = papa.parse(s, { header: true, dynamicTyping: true }).data;
    window.deVerbs = (bareVerb) => {
        var v = csvData.find((k) => k.Infinitive === bareVerb);
        return v;
    };
});
var deFreqlistRes = () => fetch("/data/de-freqlist.csv").then((r) => r.text()).then((s) => {
    var csvData = papa.parse(s, { header: false, delimiter: '|', dynamicTyping: true }).data;
    window.deFreqlist = (n) => {
        return csvData[n];
    };
});
const enNomPron = ["I", "you", "he", "she", "it"];
const deNomPron = ["ich", "du", "er", "sie", "es"];
const subjPresentCols = [
    "Präsens_ich",
    "Präsens_du",
    "Präsens_er, sie, es",
    "Präsens_er, sie, es",
    "Präsens_er, sie, es"
];
var deVerbQuizzer = {
    ftemp: {
        generator: function (seed) {
            var answer = `${deNomPron[seed[0]]} ${window.deVerbs(seed[2])[subjPresentCols[seed[0]]]}`;
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
        ["jump", "springen"]
    ],
    seeder: function (vbs) {
        var pronInd = Math.floor(Math.random() * deNomPron.length);
        var vb = vbs[Math.floor(Math.random() * vbs.length)];
        return [pronInd, vb[0], vb[1]];
    },
    updater: (correct, answer, card, st) => st,
    history: [],
    editor: (vbs) => {
        var validator = (deStr) => window.deVerbs(deStr) !== undefined;
        var editor = (0, lib_1.multipleEditors)(vbs, ["", ""], (vb) => (0, lib_1.combineEditors)(vb, (s) => (0, lib_1.singleTextFieldEditor)(s), (s) => (0, lib_1.validatedTextFieldEditor)(s, validator)), true, (s, cd) => cd[0].includes(s) || cd[1].includes(s));
        return {
            element: editor.element,
            menuToState: () => editor.menuToState().filter((c) => validator(c[1]))
        };
    }
};
var deFreqQuizzer = (0, progression_1.geometricProgressFGen)((n) => {
    var record = window.deFreqlist(n);
    return [record[1], record[0], record[3]];
}, 1000);
lib_1.defaultDecks["german-verb-deck"] = {
    name: "German present-tense verb conjugations",
    slug: "german-verb-deck",
    decktype: "german-verb-driller",
    resources: ["german-verbs"],
    view: {
        color: "#ffffdd"
    },
    state: deVerbQuizzer.state
};
lib_1.defaultDecks["german-svo-deck"] = {
    name: "German SVO sentences",
    slug: "german-svo-deck",
    decktype: "german-svo-driller",
    resources: [],
    view: {
        color: "#ffffdd"
    },
    state: deSVOQuizzer.state
};
lib_1.defaultDecks["german-freqlist-deck"] = {
    name: "German 1000 frequent words",
    slug: "german-freqlist-deck",
    decktype: "german-freq-driller",
    resources: ["german-freqlist"],
    view: {
        color: "#ffffdd"
    },
    state: deFreqQuizzer.state
};
lib_1.providedGenerators["german-svo-driller"] = deSVOQuizzer;
lib_1.providedGenerators["german-verb-driller"] = deVerbQuizzer;
lib_1.providedGenerators["german-freq-driller"] = deFreqQuizzer;
lib_1.indexedResources["german-verbs"] = deVerbsRes;
lib_1.indexedResources["german-freqlist"] = deFreqlistRes;
