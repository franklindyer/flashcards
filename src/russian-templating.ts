import {
    IDictionary,
    guidGenerator
} from "./lib";
import {
    weightedRandom
} from "./weighted-rand";
import {
    WithTags,
    WordRelation,
    WordHole,
    WordRelChecker,
    WordPicker
} from "./word-rel";

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
    rels: IDictionary<string[]>,
    guid: string
}

type EnRuNounInflector = {
    case: RussianCase
}

export type EnRuVerb = {
    enForm: string,
    ruForm: string,
    tags: string[],
    // subjTags: string[],
    // objTags: string[],
    rels: IDictionary<string[]>,
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
    // nounTags: string[],
    rels: IDictionary<string[]>,
    hint: string,
    guid: string
}

type EnRuAdjectiveInflector = {
    gender: RussianGender,
    number: RussianNumber,
    case: RussianCase,
    animacy: RussianAnimacy
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
        rels: {},
        guid: getUuid(tr[1])
    };
}

function getPronounFor(n: EnRuNoun): EnRuNoun {
    return getPronoun(n.number, n.person, n.gender, n.animacy);
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
        rels: {},
        tags: tags,
        guid: getUuid(ruForm)
    }
}

export function makeIntransVerb(enForm: string, ruForm: string, subjTags: string[], tags: string[] = [], hint: string = "") 
    : EnRuVerb {
    tags.push("intrans");
    return {
        enForm: enForm,
        ruForm: ruForm,
        tags: tags,
        rels: {
            "subj": subjTags,
            "obj": []
        },
        hint: hint,
        guid: getUuid(ruForm)
    }
}

export function makeTransVerb(enForm: string, ruForm: string, subjTags: string[], objTags: string[], tags: string[] = [], hint: string = "")
    : EnRuVerb {
    tags.push("trans");
    return {
        enForm: enForm,
        ruForm: ruForm,
        tags: tags,
        rels: {
            "subj": subjTags,
            "obj": objTags
        },
        hint: hint,
        guid: getUuid(ruForm)
    }
}

export function makeAdj(enForm: string, ruForm: string, nounTags: string[], tags: string[] = [], hint: string = "")
    : EnRuAdjective {
    return {
        enForm: enForm,
        ruForm: ruForm,
        tags: tags,
        rels: {
            "noun": nounTags
        },
        hint: hint,
        guid: getUuid(ruForm)
    }
}

function defaultNounInflector() {
    return {
        case: caseNOM
    };
}

function defaultVerbInflector() {
    return {
        tense: RussianTense.TenseInfinitive,
        gender: RussianGender.GenderNeuter,
        number: RussianNumber.NumberSingular,
        person: RussianPerson.Person3rd
    };
}

function defaultAdjInflector() {
    return {
        gender: RussianGender.GenderMale,
        number: RussianNumber.NumberSingular,
        animacy: RussianAnimacy.AnimacyInanimate,
        case: caseNOM
    }
}

export enum EnRuPhraseAxnType {
    DupNoun,
    DupVerb,
    DupAdj,
    MakePronoun,
    RandomPronoun,
    DeclineNoun,
    ConjugateVerb,
    AgreeVerbWithSubj,
    AgreeAdjWithNoun
}

export type EnRuPhraseAxn = {
    type: EnRuPhraseAxnType,
    num1?: number,
    num2?: number,
    wd1?: number,
    wd2?: number
}

export type EnRuWordStacks = {
    words: IDictionary<WithTags[]>,
    inflectors: IDictionary<any[]>,
    tplGuid: string
}

export class EnRuPhraseTpl {
    guid: string;
    picker: WordPicker;
    actions: EnRuPhraseAxn[];    
    subs: [RegExp, string][];

    fmt: [string, string];

    constructor(wp: WordPicker) {
        this.guid = guidGenerator();
        this.picker = wp;
        this.actions = [];
        this.subs = [];
        this.fmt = ["", ""];
    }

    add(wdType: string, tags: string = "", selStrings: string = "") {
        var tagsList = (tags.length === 0) ? [] : tags.split(',');
        var selList = (selStrings.length === 0) ? [] : selStrings.split(',');
        this.picker.addR(wdType, tagsList, selList);
        return this;
    }

    dupV(id: number) {
        this.actions.push({
            type: EnRuPhraseAxnType.DupVerb,
            wd1: id 
        });
        return this;
    }

    dupN(id: number) {
        this.actions.push({
            type: EnRuPhraseAxnType.DupNoun,
            wd1: id
        });
        return this;
    }

    dupA(id: number) {
        this.actions.push({
            type: EnRuPhraseAxnType.DupAdj,
            wd1: id
        });
        return this;
    }

    pron(id: number) {
        this.actions.push({
            type: EnRuPhraseAxnType.MakePronoun,
            wd1: id
        });
        return this;
    }

    rpron() {
        this.actions.push({
            type: EnRuPhraseAxnType.RandomPronoun
        });
        return this;
    }

    decl(id: number, c: RussianCase) {
        this.actions.push({
            type: EnRuPhraseAxnType.DeclineNoun,
            wd1: id,
            num1: c
        });
        return this;
    }

    conj(id: number, c: RussianTense) {
        this.actions.push({
            type: EnRuPhraseAxnType.ConjugateVerb,
            wd1: id,
            num1: c
        });
        return this;
    }

    agreeVN(idV: number, idN: number) {
        this.actions.push({
            type: EnRuPhraseAxnType.AgreeVerbWithSubj,
            wd1: idV,
            wd2: idN
        });
        return this;
    }

    agreeAN(idA: number, idN: number) {
        this.actions.push({
            type: EnRuPhraseAxnType.AgreeAdjWithNoun,
            wd1: idA,
            wd2: idN
        });
        return this;
    }

    format(fmt0: string, fmt1: string) {
        this.fmt = [fmt0, fmt1];
        return this;
    }

    runAction(stacks: EnRuWordStacks, axn: EnRuPhraseAxn): EnRuWordStacks {
        if (axn.type === EnRuPhraseAxnType.DupNoun) {
            stacks.words["n"].push(stacks.words["n"][axn.wd1!]);  
            stacks.inflectors["n"].push(stacks.inflectors["n"][axn.wd1!]);
            return stacks;
        } else if (axn.type === EnRuPhraseAxnType.DupVerb) {
            stacks.words["v"].push(stacks.words["n"][axn.wd1!]);  
            stacks.inflectors["v"].push(stacks.inflectors["n"][axn.wd1!]);
            return stacks;
        } else if (axn.type === EnRuPhraseAxnType.DupAdj) {
            stacks.words["a"].push(stacks.words["n"][axn.wd1!]);  
            stacks.inflectors["a"].push(stacks.inflectors["n"][axn.wd1!]);
            return stacks;
        } else if (axn.type === EnRuPhraseAxnType.MakePronoun) {
            stacks.words["n"].push(getPronounFor(<EnRuNoun>stacks.words["n"][axn.wd1!]));
            stacks.inflectors["n"].push(defaultNounInflector());
            return stacks;
        } else if (axn.type === EnRuPhraseAxnType.RandomPronoun) {
            var number = Math.floor(2*Math.random());
            var person = Math.floor(3*Math.random());
            var gender = (number === 0 && person == 2) ? Math.floor(3*Math.random()) : 0;
            var pron = getPronoun(number, person, gender, RussianAnimacy.AnimacyAnimate);
            stacks.words["n"].push(pron);
            stacks.inflectors["n"].push(defaultNounInflector());
            return stacks;
        } else if (axn.type === EnRuPhraseAxnType.DeclineNoun) {
            stacks.inflectors["n"][axn.wd1!].case = axn.num1;
            return stacks;
        } else if (axn.type === EnRuPhraseAxnType.ConjugateVerb) {
            stacks.inflectors["v"][axn.wd1!].tense = axn.num1;
            return stacks;
        } else if (axn.type === EnRuPhraseAxnType.AgreeVerbWithSubj) {
            var n = <EnRuNoun>stacks.words["n"][axn.wd2!];
            var vInf = <EnRuVerbInflector>stacks.inflectors["v"][axn.wd1!];
            vInf.number = n.number;
            vInf.person = n.person;
            vInf.gender = n.gender;
            return stacks;
        } else if (axn.type === EnRuPhraseAxnType.AgreeAdjWithNoun) {
            var n = <EnRuNoun>stacks.words["n"][axn.wd2!];
            var nInf = <EnRuNounInflector>stacks.inflectors["n"][axn.wd2!];
            var aInf = <EnRuAdjectiveInflector>stacks.inflectors["a"][axn.wd1!];
            aInf.number = n.number;
            aInf.gender = n.gender;
            aInf.animacy = n.animacy;
            aInf.case = nInf.case;
            return stacks;
        }
        return null!
    }

    next(wc: WordRelChecker): EnRuWordStacks {
        this.picker.checker = wc;
        var words = this.picker.resolve();
        var stacks: EnRuWordStacks = {
            tplGuid: this.guid,
            words: words,
            inflectors: {
                "n": words["n"].map((_) => defaultNounInflector()),
                "v": words["v"].map((_) => defaultVerbInflector()),
                "a": words["a"].map((_) => defaultAdjInflector())
            }
        };

        for (var i = 0; i < this.actions.length; i++) {
            var axn = this.actions[i];
            stacks = this.runAction(stacks, axn);
        }

        return stacks;
    }

    gen(stacks: EnRuWordStacks): [string, string] {
        var res = [this.fmt[0].slice(), this.fmt[1].slice()];
        for (var i = 0; i < stacks.words["n"].length; i++) {
            var n = <EnRuNoun>stacks.words["n"][i];
            var nInf = <EnRuNounInflector>stacks.inflectors["n"][i];
            var nRes = inflectNoun(n, nInf); 
            res[0] = res[0].replace(`{n${i}}`, nRes[0]);
            res[1] = res[1].replace(`{n${i}}`, nRes[1]);
        }
        for (var i = 0; i < stacks.words["v"].length; i++) {
            var v = <EnRuVerb>stacks.words["v"][i];
            var vInf = <EnRuVerbInflector>stacks.inflectors["v"][i];
            var vRes = inflectVerb(v, vInf); 
            res[0] = res[0].replace(`{v${i}}`, vRes[0]);
            res[1] = res[1].replace(`{v${i}}`, vRes[1]);
        }
        for (var i = 0; i < stacks.words["a"].length; i++) {
            var a = <EnRuAdjective>stacks.words["a"][i];
            var aInf = <EnRuAdjectiveInflector>stacks.inflectors["a"][i];
            var aRes = inflectAdj(a, aInf); 
            res[0] = res[0].replace(`{a${i}}`, aRes[0]);
            res[1] = res[1].replace(`{a${i}}`, aRes[1]);
        }
        for (var i = 0; i < this.subs.length; i++) {
            res[0] = res[0].replace(this.subs[i][0], this.subs[i][1]);
            res[1] = res[1].replace(this.subs[i][0], this.subs[i][1]);
        } 
        return <[string, string]>res;
    }
}
