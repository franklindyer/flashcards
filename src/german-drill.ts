import {
    guidGenerator,
    FlashcardGenerator,
    FlashcardGenEditor,
    boolEditor,
    floatEditor,
    singleTextFieldEditor,
    validatedTextFieldEditor,
    makeTranslationEditor,
    doubleTextFieldEditor,
    combineEditors,
    multipleEditors,
    evilFGen, 
    runFlashcardController,
    defaultDecks,
    providedGenerators,
    indexedResources
    } from "./lib";
import {
    geometricProgressFGen
    } from "./progression";
import {
    Genders,
    Numbers
    } from "german-determiners"
import {
    Persons
    } from "german-verbs"
const papa = require("papaparse");

const GermanVerbsLib = require('german-verbs');
const GermanVerbsDict = require('german-verbs-dict/dist/verbs.json');
const GermanDets = require('german-determiners');
const GermanWords = require('german-words');
const GermanWordsList = require('german-words-dict/dist/words.json');

const EnglishVerbs = require('english-verbs');
const EnglishVerbHelper = require('english-verbs-helper');
const EnglishPlurals = require('english-plurals')
const EnglishPluralsIrregular = require('english-plurals-list/dist/plurals.json');
const EnglishPlural = require("pluralize-me");

type GermanSVOSettings = {
    subjPronProb: number,
    objPronProb: number,
    pluralProb: number
}

type GermanVerb = {
    en: string,
    de: string,
    hint: string,
    tags: string[]
}

type GermanNoun = {
    en: string,
    de: string,
    hint: string,
    tags: string[],
    canBeSubj: boolean,
    canBeObj: boolean
}

type GermanSVOState = {
    settings: GermanSVOSettings,
    verbs: GermanVerb[],
    nouns: GermanNoun[]
}

const sampleGermanSVOState: GermanSVOState = {
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
}

function germanSubjPronoun(gen: Genders, num: Numbers, per: Persons): string {
    switch(per) {
        case 1:
            return num == 'S' ? "ich" : "wir"; 
        case 2:
            return num == 'S' ? "du" : "ihr";
        case 3:
            if (num == 'P') return "sie";
            else {
                switch(gen) {
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

function germanObjPronoun(gen: Genders, num: Numbers, per: Persons): string {
    switch(per) {
        case 1:
            return num == 'S' ? "mich" : "uns"; 
        case 2:
            return num == 'S' ? "dich" : "euch";
        case 3:
            if (num == 'P') return "sie";
            else {
                switch(gen) {
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

function englishSubjPronoun(gen: Genders, num: Numbers, per: Persons): string {
    switch(per) {
        case 1:
            return num == 'S' ? "I" : "we"; 
        case 2:
            return num == 'S' ? "you" : "y'all";
        case 3:
            if (num == 'P') return "they";
            else {
                switch(gen) {
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

function englishObjPronoun(gen: Genders, num: Numbers, per: Persons): string {
    switch(per) {
        case 1:
            return num == 'S' ? "me" : "us"; 
        case 2:
            return num == 'S' ? "you" : "y'all";
        case 3:
            if (num == 'P') return "them";
            else {
                switch(gen) {
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

function englishMakePlural(noun: string): string {
    return EnglishPlural.plural(noun);
}

function generateSVOPhrase(st: GermanSVOState): [string, string] {
    var subjGender, objGender: Genders;
    var subjNumber, objNumber: Numbers;
    var subjPerson, objPerson: Persons;
    var subjPhraseEn, subjPhraseDe: string;
    var verbPhraseEn, verbPhraseDe: string;
    var objPhraseEn, objPhraseDe: string;
    var sentenceEn, sentenceDe: string;

    var subjNouns = st.nouns.filter((noun) => noun.canBeSubj);
    subjNumber = <Numbers>(Math.random() < st.settings.pluralProb ? 'P' : 'S'); 
    objNumber = <Numbers>(Math.random() < st.settings.pluralProb ? 'P' : 'S'); 
    if (subjNouns.length == 0 || Math.random() < st.settings.subjPronProb) {
        subjGender = <Genders>['M', 'F', 'N'][Math.floor(Math.random() * 3)];
        subjPerson = <Persons>[1, 2, 3][Math.floor(Math.random() * 3)];
        subjPhraseEn = englishSubjPronoun(subjGender, subjNumber, subjPerson);
        subjPhraseDe = germanSubjPronoun(subjGender, subjNumber, subjPerson);
    } else {
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
        objGender = <Genders>['M', 'F', 'N'][Math.floor(Math.random() * 3)];
        objPerson = <Persons>[1, 2, 3][Math.floor(Math.random() * 3)];
        objPhraseEn = englishObjPronoun(objGender, objNumber, objPerson);
        objPhraseDe = germanObjPronoun(objGender, objNumber, objPerson);
    } else {
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

function makeNounEditor(noun: GermanNoun):
    FlashcardGenEditor<GermanNoun> {
    var englishVerbField = validatedTextFieldEditor(noun.en, (wd) => true);
    var germanVerbField = validatedTextFieldEditor(noun.de, (wd) => wd in GermanWordsList);
    var subjField = boolEditor("Subject?", noun.canBeSubj);
    subjField.element.style.display = "inline-block";
    var objField = boolEditor("Object?", noun.canBeObj);
    objField.element.style.display = "inline-block";
    var contDiv = document.createElement("div");
    [englishVerbField, germanVerbField, subjField, objField].map((el) => contDiv.appendChild(el.element));
    return {
        element: contDiv,
        menuToState: () => { return {
            en: englishVerbField.menuToState(),
            de: germanVerbField.menuToState(),
            hint: "",
            tags: [],
            canBeSubj: subjField.menuToState(),
            canBeObj: objField.menuToState()
        }}
    }
}

function makeNounsEditor(nouns: GermanNoun[]):
    FlashcardGenEditor<GermanNoun[]> {
    return multipleEditors(
        nouns,
        {
            en: "",
            de: "",
            hint: "",
            tags: [],
            canBeSubj: false,
            canBeObj: true
        },
        makeNounEditor
    )
}

var deSVOQuizzer: FlashcardGenerator<[string, string], GermanSVOState> = {
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
    state: sampleGermanSVOState,
    seeder: function(st: GermanSVOState) {
        return generateSVOPhrase(st);
    },
    updater: (correct, answer, card, st) => st,
    history: [],
    editor: (st: GermanSVOState) => {
        var validateVerbDe = (deStr: string) => deStr in GermanVerbsDict;
        var validateNounDe = (deStr: string) => deStr in GermanWordsList;
        var conf = st.settings;
        var sliderSubjPron = floatEditor("Probability of subject pronouns", conf.subjPronProb, 0, 1);
        var sliderObjPron = floatEditor("Probability of object pronouns", conf.objPronProb, 0, 1);
        var sliderPlural = floatEditor("Probability of plurals", conf.pluralProb, 0, 1);
        var editNouns = makeNounsEditor(st.nouns);
        var editVerbs = makeTranslationEditor(st.verbs.map((vb) => [vb.en, vb.de]), validateVerbDe);
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
                var nouns: GermanNoun[] = editNouns.menuToState();
                var verbs: GermanVerb[] = editVerbs.menuToState().map((wd) => { return {
                    en: wd[0],
                    de: wd[1],
                    hint: "",
                    tags: []
                }});
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
        }
    }
}

declare global {
    var deVerbs: any
    var deFreqlist: any
}

var deVerbsRes = () => fetch("/data/de-verbs.csv").then((r) => r.text()).then((s) => {
    var csvData = papa.parse(s, { header: true, dynamicTyping: true }).data;
    window.deVerbs = (bareVerb: string) => {
        var v = csvData.find((k: any) => k.Infinitive === bareVerb);
        return v; 
    }
});

var deFreqlistRes = () => fetch("/data/de-freqlist.csv").then((r) => r.text()).then((s) => {
    var csvData = papa.parse(s, { header: false, delimiter: '|', dynamicTyping: true }).data;
     window.deFreqlist = (n: number) => {
        return csvData[n];
    }
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

var deVerbQuizzer: FlashcardGenerator<[number, string, string], [string, string][]> = {
    ftemp: {
        generator: function(seed: [number, string, string]) {
            var answer = `${deNomPron[seed[0]]} ${window.deVerbs(seed[2])[subjPresentCols[seed[0]]]}`;
            answer = answer.replace("'", "");
            return {
                params: seed,
                prompt: `${enNomPron[seed[0]]} ${seed[1]}`,
                answers: [answer],
                hint: answer,
                uuid: guidGenerator() 
            }
        }
    },
    state: [
        ["jump", "springen"]
    ],
    seeder: function(vbs: [string, string][]) {
        var pronInd = Math.floor(Math.random() * deNomPron.length);
        var vb = vbs[Math.floor(Math.random() * vbs.length)];
        return [pronInd, vb[0], vb[1]];
    },
    updater: (correct, answer, card, st) => st,
    history: [],
    editor: (vbs: [string, string][]) => {
        var validator = (deStr: string) => window.deVerbs(deStr) !== undefined;
        var editor: FlashcardGenEditor<[string, string][]> = multipleEditors(
            vbs,
            ["", ""],
            (vb) => combineEditors(
                vb,
                (s: string) => singleTextFieldEditor(s),
                (s: string) => validatedTextFieldEditor(s, validator) 
            )
        );
        return {
            element: editor.element,
            menuToState: () => editor.menuToState().filter((c) => validator(c[1])) 
        };
    }
}

var deFreqQuizzer = geometricProgressFGen((n: number) => {
    var record = window.deFreqlist(n);
    return <[string, string, string]>[record[1], record[0], record[3]];
}, 1000);

defaultDecks["german-verb-deck"] = {
    name: "German present-tense verb conjugations",
    slug: "german-verb-deck",
    decktype: "german-verb-driller",
    resources: ["german-verbs"],
    view: {
        color: "#ffffdd"
    },
    state: deVerbQuizzer.state
};
defaultDecks["german-svo-deck"] = {
    name: "German SVO sentences",
    slug: "german-svo-deck",
    decktype: "german-svo-driller",
    resources: [],
    view: {
        color: "#ffffdd"
    },
    state: deSVOQuizzer.state
};
defaultDecks["german-freqlist-deck"] = {
    name: "German 1000 frequent words",
    slug: "german-freqlist-deck",
    decktype: "german-freq-driller",
    resources: ["german-freqlist"],
    view: {
        color: "#ffffdd"
    },
    state: deFreqQuizzer.state
}
providedGenerators["german-svo-driller"] = deSVOQuizzer;
providedGenerators["german-verb-driller"] = deVerbQuizzer;
providedGenerators["german-freq-driller"] = deFreqQuizzer;
indexedResources["german-verbs"] = deVerbsRes;
indexedResources["german-freqlist"] = deFreqlistRes;
