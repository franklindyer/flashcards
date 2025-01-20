import {
    IDictionary,
    guidGenerator
} from "./lib";
import {
    weightedRandom
} from "./weighted-rand";

const getUuid = require('uuid-by-string');
const papa = require("papaparse"); 
const EnglishPlural = require("pluralize-me");
const EnglishVerbs = require('english-verbs');
const EnglishVerbHelper = require('english-verbs-helper');

declare global {
    var ruAdjectives: any
    var ruNouns: any
    var ruVerbs: any
}

export var ruDataPromise = (filename: string, objname: string) =>
    fetch(`/data/${filename}.csv`).then((r) => r.text()).then((s) => { 
    var csvData = papa.parse(s, { header: true, dynamicTyping: true }).data;
    (<any>window)[objname] = (bareVerb: string) => { 
        var v = csvData.find((k: any) => k.bare === bareVerb);
        //     v = csvData.find((k: any) => k["pl_nom"].replace("'", "") === bareVerb);
        return v;
    }
});

function objCloner<a>(x: a) {
    return <a>JSON.parse(JSON.stringify(x));
}

enum RussianCase {
    CaseNominative = 0,
    CaseAccusative,
    CaseDative,
    CasePrepositional,
    CaseGenitive,
    CaseInstrumental
}

export const caseNOM = RussianCase.CaseNominative;
export const caseACC = RussianCase.CaseAccusative;
export const caseDAT = RussianCase.CaseDative;
export const casePRP = RussianCase.CasePrepositional;
export const caseGEN = RussianCase.CaseGenitive;
export const caseINS = RussianCase.CaseInstrumental;

enum RussianPerson {
    Person1st,
    Person2nd,
    Person3rd
}

enum RussianGender {
    GenderMale,
    GenderFemale,
    GenderNeuter
}

enum RussianNumber {
    NumberSingular,
    NumberPlural
}

enum RussianAnimacy {
    AnimacyAnimate,
    AnimacyInanimate
}

enum RussianTense {
    TenseInfinitive,
    TensePresent,
    TensePast
}

const enTenseStrings = ["PRESENT", "PRESENT", "PAST"];

export type EnRuNoun = {
    enForm: string,
    ruForm: string,
    gender: RussianGender,
    number: RussianNumber,
    person: RussianPerson,
    animacy: RussianAnimacy,
    tags: string[],
    guid: string
}

type EnRuNounInflector = {
    case: RussianCase
}

export type EnRuVerb = {
    enForm: string,
    ruForm: string,
    tags: string[],
    subjTag: string,
    objTag: string,
    hint: string,
    guid: string
}

type EnRuVerbInflector = {
    tense: RussianTense,
    gender: RussianGender,
    number: RussianNumber,
    person: RussianPerson
}

export type EnRuAdjective = {
    enForm: string,
    ruForm: string,
    tags: string[],
    nounTag: string,
    hint: string,
    guid: string
}

type EnRuAdjectiveInflector = {
    gender: RussianGender,
    number: RussianNumber,
    case: RussianCase,
    animacy: RussianAnimacy
}

export type EnRuPhraseTpl = {
    tpl: any, // These should be functions on WordRepos, but the type signature is a pain in the ass
    guid: string
}

export class EnRuWordLibrary {
    startingWeight: number;
    punishmentParam: number;

    nouns: EnRuNoun[];
    verbs: EnRuVerb[];
    adjs: EnRuAdjective[];
    tpls: EnRuPhraseTpl[]; 

    nounWeights: IDictionary<number>;
    verbWeights: IDictionary<number>;
    adjWeights: IDictionary<number>;    
    tplWeights: IDictionary<number>;

    tagWeights: IDictionary<number>;
    genderWeights: IDictionary<number>;
    numberWeights: IDictionary<number>;
    personWeights: IDictionary<number>;
    caseWeights: IDictionary<number>;

    constructor(nouns: EnRuNoun[], verbs: EnRuVerb[], adjs: EnRuAdjective[], tpls: EnRuPhraseTpl[]) {
        this.startingWeight = 10;
        this.punishmentParam = 1.5;

        this.nouns = nouns;
        this.verbs = verbs;
        this.adjs = adjs;
        this.tpls = tpls;

        this.nounWeights = {};
        this.verbWeights = {};
        this.adjWeights = {};
        this.tplWeights = {};

        this.tagWeights = {};
        this.genderWeights = {0: 1, 1: 1, 2: 1};
        this.numberWeights = {0: 1, 1: 1};
        this.personWeights = {0: 1, 1: 1, 2: 1};
        this.caseWeights = {0: 1, 1: 1, 2: 1, 3: 1, 4: 1, 5: 1};
    }

    makeWeights(stats: IDictionary<[number, number]>) {
        var weights: IDictionary<number> = {};
        for (var k in stats) {
            weights[k] = (Math.pow(stats[k][1],this.punishmentParam)+this.startingWeight)/(stats[k][0]+1);
        }
        return weights;
    }

    pickNoun(tag: string = "") {
        var options = (tag === "") ? this.nouns : this.nouns.filter((w) => w.tags.includes(tag));
        return weightedRandom(options, (n) => (n.guid in this.nounWeights) ? this.nounWeights[n.guid] : this.startingWeight, Math.random());
    }

    pickVerb(tag: string = "") {
        var options = (tag === "") ? this.verbs : this.verbs.filter((w) => w.tags.includes(tag));
        return weightedRandom(options, (v) => (v.guid in this.verbWeights) ? this.verbWeights[v.guid] : this.startingWeight, Math.random());
    }

    pickAdj(tags: string[] = []) {
        var options = this.adjs.filter((a) => tags.includes(a.nounTag));
        return weightedRandom(options, (a) => (a.guid in this.adjWeights) ? this.adjWeights[a.guid] : this.startingWeight, Math.random());
    }

    pickVerbWithAnySubjTag(tags: string[], tag: string = "") {
        var options = this.verbs.filter((v) => tags.includes(v.subjTag));
        options = (tag === "") ? options : options.filter((w) => w.tags.includes(tag));
        return weightedRandom(options, (v) => (v.guid in this.verbWeights) ? this.verbWeights[v.guid] : this.startingWeight, Math.random());
    }

    pickTpl() {
        return weightedRandom(this.tpls, (t) => (t.guid in this.tplWeights) ? this.tplWeights[t.guid] : this.startingWeight, Math.random());
    }

    pickGender(): RussianGender {
        return weightedRandom([0, 1, 2], (k) => this.genderWeights[k], Math.random());
    }
    pickNumber(): RussianNumber {
        return weightedRandom([0, 1], (k) => this.numberWeights[k], Math.random());
    }
    pickPerson(): RussianPerson {
        return weightedRandom([0, 1, 2], (k) => this.personWeights[k], Math.random());
    }
}

export function getRussianGender(ruNoun: string): RussianGender {
    var ruNounRow = window.ruNouns(ruNoun);
    if (ruNounRow["gender"] === "m")                return RussianGender.GenderMale;
    else if (ruNounRow["gender"] === "f")           return RussianGender.GenderFemale;
    else if (ruNounRow["gender"] === "n")           return RussianGender.GenderNeuter;
    else if (["а", "я"].includes(ruNoun.slice(-1))) return RussianGender.GenderFemale;
    else if (["о", "е"].includes(ruNoun.slice(-1))) return RussianGender.GenderNeuter;
    else                                            return RussianGender.GenderMale;
}

function getPronoun(num: RussianNumber, psn: RussianPerson, gdr: RussianGender, anm?: RussianAnimacy): EnRuNoun {
    var tr = ["", ""];
    if (num === RussianNumber.NumberSingular) {
        if (psn === RussianPerson.Person1st) tr = ["I", "я"];
        else if (psn === RussianPerson.Person2nd) tr = ["you", "ты"];
        else if (gdr === RussianGender.GenderMale) tr = ["he", "он"];
        else if (gdr === RussianGender.GenderFemale) tr = ["she", "она"];
        else if (gdr === RussianGender.GenderNeuter) tr = ["it", "оно"];
    } else {
        if (psn === RussianPerson.Person1st) tr = ["we", "мы"];
        else if (psn === RussianPerson.Person2nd) tr = ["y'all", "вы"];
        else if (psn === RussianPerson.Person3rd) tr = ["they", "они"];
    }
    if (anm === null) {
        if (psn === RussianPerson.Person3rd && gdr === RussianGender.GenderNeuter)
            anm = RussianAnimacy.AnimacyInanimate;
        else 
            anm = RussianAnimacy.AnimacyAnimate;
    }
    return {
        enForm: tr[0],
        ruForm: tr[1],
        number: num,
        person: psn,
        gender: gdr,
        animacy: anm!,
        tags: ["pronoun"],
        guid: getUuid(tr[1])
    };
}

const enProns: IDictionary<string[]> = {
    "I": ["I", "me", "me", "me", "me", "me"],
    "you": ["you", "you", "you", "you", "you", "you"],
    "he": ["he", "him", "him", "him", "him", "him"],
    "she": ["she", "her", "her", "her", "her", "her"],
    "it": ["it", "it", "it", "it", "it", "it"],
    "we": ["we", "us", "us", "us", "us", "us"],
    "y'all": ["y'all", "y'all", "y'all", "y'all", "y'all", "y'all"],
    "they": ["they", "them", "them", "them", "them", "them"]
};

const ruProns: IDictionary<string[]> = {
    "я": ["я", "меня", "мне", "меня", "мне", ""],
    "ты": ["ты", "тебя", "тебе", "тебя", "тебе", ""],
    "он": ["он", "его", "ему", "нём", "его", ""],
    "она": ["она", "её", "ей", "ней", "её", ""],
    "оно": ["оно", "его", "ему", "нём", "его", ""],
    "мы": ["мы", "нас", "нам", "нас", "нас", ""],
    "вы": ["вы", "вас", "вам", "вас", "вас", ""],
    "они": ["они", "их", "им", "них", "их", ""]
};

function inflectNoun(n: EnRuNoun, inf: EnRuNounInflector): [string, string] {
    if (n.tags.includes("pronoun"))
        return [enProns[n.enForm][inf.case], ruProns[n.ruForm][inf.case]];
    var ruRecord = window.ruNouns(n.ruForm);
    if (ruRecord["indeclinable"] === "1" || ruRecord["indeclinable"] == 1) {
        return [n.enForm, n.ruForm];
    }
    var numStr = (n.number === RussianNumber.NumberPlural) ? "pl" : "sg";
    var cStr = ["nom", "acc", "dat", "prep", "gen", "inst"][inf.case];
    var ruInfl = ruRecord[`${numStr}_${cStr}`].split(', ')[0]; // We may not always want the 1st one...
    ruInfl = ruInfl.replace("'", "");
    // return [`${n.enForm}(${inf.case})`, `${n.ruForm}(${inf.case})`];
    return [n.enForm, ruInfl];
}

function inflectVerb(v: EnRuVerb, inf: EnRuVerbInflector): [string, string] {
    var ruRecord = window.ruVerbs(v.ruForm);
    var key = "";
    switch(inf.tense) {
        case RussianTense.TensePresent:
            switch(inf.person) {
                case RussianPerson.Person1st:
                    key = (inf.number === RussianNumber.NumberSingular) ? "presfut_sg1" : "presfut_pl1";
                    break;
                case RussianPerson.Person2nd:
                    key = (inf.number === RussianNumber.NumberSingular) ? "presfut_sg2" : "presfut_pl2";
                    break;
                case RussianPerson.Person3rd:
                    key = (inf.number === RussianNumber.NumberSingular) ? "presfut_sg3" : "presfut_pl3";
                    break;
                default:
                    break;
            }
            break;
        case RussianTense.TensePast:
            if (inf.number === RussianNumber.NumberPlural) {
                key = "past_pl"; 
            } else {
                switch(inf.gender) {
                    case RussianGender.GenderMale:
                        key = "past_m";
                        break;
                    case RussianGender.GenderFemale:
                        key = "past_f";
                        break;
                    case RussianGender.GenderNeuter:
                        key = "past_n"; 
                        break;
                }
            }
            break;
        case RussianTense.TenseInfinitive:
            key = "bare";
            break;
    }
    var ruInfl = ruRecord[key];
    var enPersonInd = (inf.number === RussianNumber.NumberSingular ? 0 : 3) + inf.person;
    var enInfl = EnglishVerbHelper.getConjugation(null, v.enForm, enTenseStrings[inf.tense], enPersonInd);
    enInfl = (v.hint === "") ? enInfl : `(${v.hint}) ${enInfl}`;
    // var csStr = `${inf.tense},${inf.gender},${inf.number},${inf.person}`;
    ruInfl = ruInfl.replace("'", "");
    // return [`${v.enForm}(${csStr})`, `${v.ruForm}(${csStr})`];
    return [enInfl, ruInfl];
}

function inflectAdj(a: EnRuAdjective, inf: EnRuAdjectiveInflector): [string, string] {
    var ruRecord = window.ruAdjectives(a.ruForm);
    var gdrStr = "";
    if (inf.number === RussianNumber.NumberPlural) gdrStr = "pl";
    else if (inf.gender === RussianGender.GenderMale) gdrStr = "m";
    else if (inf.gender === RussianGender.GenderFemale) gdrStr = "f";
    else if (inf.gender === RussianGender.GenderNeuter) gdrStr = "n";
    var cStr = ["nom", "acc", "dat", "prep", "gen", "inst"][inf.case];
    var col = `decl_${gdrStr}_${cStr}`;
    var decls = ruRecord[col].split(',');
    var ruInfl = "";
    // Male accusative column contains a special animate declension
    if (col === "decl_m_acc") {
        if (inf.animacy === RussianAnimacy.AnimacyAnimate)
            ruInfl = decls.filter((s: string) => s.endsWith("го"));
        else
            ruInfl = decls.filter((s: string) => !s.endsWith("го"))
    } else {
        ruInfl = decls[0];
    }
    // This may not be correct in all cases, may need to be fixed later
    ruInfl = ruInfl.replace("'", "");
    return [a.enForm, ruInfl];
}

export function makeSingularNoun(enForm: string, ruForm: string, gdr: string, animacy: boolean, tags: string[] = []): EnRuNoun {
    // var gender = getRussianGender(ruForm);
    var gender = RussianGender.GenderNeuter;
    if (gdr === "m") gender = RussianGender.GenderMale;
    else if (gdr === "f") gender = RussianGender.GenderFemale;
    return {
        enForm: enForm,
        ruForm: ruForm,
        gender: gender,
        number: RussianNumber.NumberSingular,
        person: RussianPerson.Person3rd,
        animacy: animacy ? RussianAnimacy.AnimacyAnimate : RussianAnimacy.AnimacyInanimate,
        tags: tags,
        guid: getUuid(ruForm)
    }
}

export function makeIntransVerb(enForm: string, ruForm: string, subjTag: string, tags: string[] = [], hint: string = "") 
    : EnRuVerb {
    tags.push("intrans");
    return {
        enForm: enForm,
        ruForm: ruForm,
        tags: tags,
        subjTag: subjTag,
        objTag: "",
        hint: hint,
        guid: getUuid(ruForm)
    }
}

export function makeTransVerb(enForm: string, ruForm: string, subjTag: string, objTag: string, tags: string[] = [], hint: string = "")
    : EnRuVerb {
    tags.push("trans");
    return {
        enForm: enForm,
        ruForm: ruForm,
        tags: tags,
        subjTag: subjTag,
        objTag: objTag,
        hint: hint,
        guid: getUuid(ruForm)
    }
}

export function makeAdj(enForm: string, ruForm: string, nounTag: string, tags: string[] = [], hint: string = "")
    : EnRuAdjective {
    return {
        enForm: enForm,
        ruForm: ruForm,
        tags: tags,
        nounTag: nounTag,
        hint: hint,
        guid: getUuid(ruForm)
    }
}

export function makeTpl(tpl: any): EnRuPhraseTpl {
    return {
        tpl: tpl,
        guid: guidGenerator()
    }
}

export function applyTpl(tpl: EnRuPhraseTpl, wr: WordRepo) {
    wr.tplGuid = tpl.guid;
    return tpl.tpl(wr);
}

export class WordRepo {
    lib: EnRuWordLibrary;
    nouns: [EnRuNoun, EnRuNounInflector][];
    verbs: [EnRuVerb, EnRuVerbInflector][];
    adjs: [EnRuAdjective, EnRuAdjectiveInflector][];
    substitutions: [RegExp, string][];
    enFormat: string;
    ruFormat: string;
    tplGuid: string;

    constructor(lib: EnRuWordLibrary) {
        this.nouns = [];
        this.verbs = [];
        this.adjs = [];
        this.substitutions = [];
        this.lib = lib;
        this.enFormat = "";
        this.ruFormat = "";
        this.tplGuid = "";
    }

    addV(v: EnRuVerb, tense: RussianTense = 0) {
        var vInf: EnRuVerbInflector = {
            tense: tense,
            gender: RussianGender.GenderNeuter,
            number: RussianNumber.NumberSingular,
            person: RussianPerson.Person1st
        };
        this.verbs.push([v, vInf]);
        return this;
    }

    pickV(tense: RussianTense = 0, tag: string = "") {
        var v = this.lib.pickVerb(tag);
        this.addV(v, tense);
        return this; 
    }

    dupV(vId: number, tense: RussianTense = 0) {
        // this.addV(objCloner(this.verbs[vId][0]), tense);
        this.addV(this.verbs[vId][0], tense);
        return this;
    }

    conjV(vId: number, nId: number, tense: RussianTense = 1) {
        var n = this.nouns[nId][0];
        var vInf: EnRuVerbInflector = {
            tense: tense,
            gender: n.gender,
            number: n.number,
            person: n.person
        };
        this.verbs[vId][1] = vInf;
        return this;
    }

    addN(n: EnRuNoun, cs: RussianCase = caseNOM) {
        var nInf: EnRuNounInflector = {
            case: cs
        };
        this.nouns.push([n, nInf]);
        return this;
    }

    pickN(tag: string = "", cs: RussianCase = caseNOM) {
        var n = this.lib.pickNoun(tag);
        this.addN(n, cs);
        return this;
    }

    addA(a: EnRuAdjective, nId: number) {
        var n = this.nouns[nId][0];
        var nInf = this.nouns[nId][1];
        var aInf: EnRuAdjectiveInflector = {
            gender: n.gender,
            number: n.number,
            animacy: n.animacy,
            case: nInf.case
        };
        this.adjs.push([a, aInf]);
        return this;
    }

    pickA(nId: number) {
        var n = this.nouns[nId][0];
        this.addA(this.lib.pickAdj(n.tags), nId);
        return this;
    }

    addPron(nId: number, cs: RussianCase = caseNOM) {
        var n = this.nouns[nId][0];
        var pron = getPronoun(n.number, n.person, n.gender, n.animacy);
        this.addN(pron, cs);
        return this;
    }

    pickPron(tags: string[] = [], cs: RussianCase = caseNOM) {
        var pron = getPronoun(this.lib.pickNumber(), this.lib.pickPerson(), this.lib.pickGender());
        pron.tags.push("agent");
        tags.map((t) => pron.tags.push(t));
        this.addN(pron, cs);
        return this;
    }

    addSubj(n: EnRuNoun, vId: number) {
        this.verbs[vId][1].gender = n.gender;
        this.verbs[vId][1].number = n.number;
        this.verbs[vId][1].person = n.person;
        this.addN(n, RussianCase.CaseNominative);
        return this;
    }

    pickSubj(vId: number, pronProb: number = 0.5) {
        var tag = this.verbs[vId][0].subjTag;
        var n;
        if ((tag === "agent" || tag === "person") && Math.random() < pronProb) {
            n = getPronoun(this.lib.pickNumber(), this.lib.pickPerson(), this.lib.pickGender());
        } else {
            n = this.lib.pickNoun(tag);
        }
        this.addSubj(n, vId);
        return this;
    }

    pickObj(vId: number, pronProb: number = 0.5) {
        var tag = this.verbs[vId][0].objTag;
        var n;
        if ((tag === "person") && Math.random() < pronProb) {
            n = getPronoun(this.lib.pickNumber(), this.lib.pickPerson(), this.lib.pickGender());
        } else {
            n = this.lib.pickNoun(tag);
        }
        this.addN(n, RussianCase.CaseAccusative);
        return this;
    }

    pickAxn(nId: number, tag: string = "", tense: RussianTense = 0) {
        var n = this.nouns[nId][0];
        var v = this.lib.pickVerbWithAnySubjTag(n.tags, tag);
        this.addV(v, tense);
        return this;
    }

    resolve(): [string, string] {
        var enTpl = this.enFormat;
        var ruTpl = this.ruFormat;
        for (var i in this.nouns) {
            var infl = inflectNoun(this.nouns[i][0], this.nouns[i][1]);
            enTpl = enTpl.replace(`{n${i}}`, infl[0]);
            ruTpl = ruTpl.replace(`{n${i}}`, infl[1]);
        }
        for (var i in this.verbs) {
            var infl = inflectVerb(this.verbs[i][0], this.verbs[i][1]);
            enTpl = enTpl.replace(`{v${i}}`, infl[0]);
            ruTpl = ruTpl.replace(`{v${i}}`, infl[1]);
        }
        for (var i in this.adjs) {
            var infl = inflectAdj(this.adjs[i][0], this.adjs[i][1]);
            enTpl = enTpl.replace(`{a${i}}`, infl[0]);
            ruTpl = ruTpl.replace(`{a${i}}`, infl[1]);
        }
        for (var i in this.substitutions) {
            var s = this.substitutions[i];
            enTpl = enTpl.replace(s[0], s[1]);
            ruTpl = ruTpl.replace(s[0], s[1]);
        }
        return [enTpl, ruTpl];
    }

    format(enTpl: string, ruTpl: string) {
        this.enFormat = enTpl;
        this.ruFormat = ruTpl;
        return this;
    }

    sub(source: RegExp, target: string) {
        this.substitutions.push([source, target]);
    }
}
