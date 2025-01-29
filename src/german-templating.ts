import {
    IDictionary,
    guidGenerator
} from "./lib";
import {
    WithTags,
    WordRelChecker,
    WordPicker
} from "./word-rel";
import {
    Genders,
    Numbers
} from "german-determiners";
import {
    Persons
} from "german-verbs";


const GermanVerbsLib = require('german-verbs');
const GermanVerbsDict = require('german-verbs-dict/dist/verbs.json');
const GermanDets = require('german-determiners');
const GermanWords = require('german-words');
const GermanWordsList = require('german-words-dict/dist/words.json');

const EnglishVerbs = require('english-verbs');
const EnglishVerbHelper = require('english-verbs-helper');

enum GermanCase {
    NOM,
    ACC,
    DAT,
    GEN
}

enum GermanGender {
    M,
    F,
    N
}

enum GermanNumber {
    S,
    P
}

enum GermanPerson {
    P1,
    P2,
    P3
}

enum GermanTense {
    INFINITIVE,
    PRESENT,
    PERFECT,
    PAST,
    PASTPERF,
    FUTURE,
    FUTUREPERF
}

enum GermanStrength {
    STRONG,
    WEAK,
    MIXED
}

enum GermanDeterminer {
    NULL,   // No determiner
    DEF,    // der
    INDEF,  // ein
    NEG,    // kein
    POSS,
    THIS,
    THAT,
    EVERY,
    MANY,
    SOME,
    SUCH
}

const enPronouns = [
    [
        ["I"], ["you"], ["he", "she", "it"], ["we"], ["y'all"], ["they"]
    ],
    [
        ["me"], ["you"], ["him", "her", "it"], ["us"], ["y'all"], ["them"]
    ],
    [
        ["me"], ["you"], ["him", "her", "it"], ["us"], ["y'all"], ["them"]
    ],
    [
        ["of mine"], ["of yours"], ["of his", "of hers", "of its"], ["of ours"], ["of y'all's"], ["of theirs"]
    ]
];

const dePronouns = [
    [
        ["ich"], ["du"], ["er", "sie", "es"], ["wir"], ["ihr"], ["sie"]
    ],
    [
        ["mich"], ["dich"], ["ihn", "sie", "es"], ["uns"], ["euch"], ["sie"]
    ],
    [
        ["mir"], ["dir"], ["ihm", "ihr", "ihm"], ["uns"], ["euch"], ["ihr"]
    ],
    [
        ["meiner"], ["deiner"], ["seiner", "ihrer", "seiner"], ["eurer"], ["ihrer"]
    ]
];

export type EnDeVerb = {
    enForm: string,
    deForm: string,
    tags: string[],
    rels: IDictionary<string[]>,
    hint: string,
    guid: string
}

export type EnDeVerbInflector = {
    number: GermanNumber,
    person: GermanPerson,
    tense: GermanTense
}

export type EnDeNoun = {
    enForm: string,
    deForm: string,
    tags: string[],
    rels: IDictionary<string[]>,
    hint: string,
    guid: string,
    gender: GermanGender,
    number: GermanNumber,
    person: GermanPerson
}

export type EnDeNounInflector = {
    case: GermanCase
}

export type EnDeDeterminer = {
    det: GermanDeterminer,
    tags: string[],
    rels: IDictionary<string[]>,
    guid: string
}

export type EnDeDeterminerInflector = {
    case: GermanCase,
    gender: GermanGender,
    number: GermanNumber,
    ownerGender?: GermanGender,
    ownerNumber?: GermanNumber,
    ownerPerson?: GermanPerson
}

export type EnDeAdjective = {
    enForm: string,
    deForm: string,
    tags: string[],
    rels: IDictionary<string[]>,
    hint: string,
    guid: string
}

export type EnDeAdjectiveInflector = {
    case: GermanCase,
    gender: GermanGender,
    number: GermanNumber,
    det: GermanDeterminer   // For distinction between strong, weak etc. endings
}

function getRosaeNLGCaseString(c: GermanCase): string {
    if (c === GermanCase.NOM) return "NOMINATIVE";
    else if (c === GermanCase.ACC) return "ACCUSATIVE";
    else if (c === GermanCase.DAT) return "DATIVE";
    else return "GENITIVE";
}

function getRosaeNLGNumberString(num: GermanNumber): string {
    if (num === GermanNumber.S) return "S";
    else return "P";
}

function getRosaeNLGDeterminerString(d: GermanDeterminer): string {
    if (d === GermanDeterminer.DEF) return 'DEFINITE';
    else if (d === GermanDeterminer.INDEF) return 'INDEFINITE';
    else if (d === GermanDeterminer.THIS) return 'DEMONSTRATIVE';
    else return 'POSSESSIVE';
}

function getEnglishDeterminer(d: GermanDeterminer): string {
    if (d === GermanDeterminer.DEF) return 'the';
    else if (d === GermanDeterminer.INDEF) return 'a';
    else if (d === GermanDeterminer.THIS) return 'this';
    else return "WAKAWAKA";
}

function getRosaeNLGGenderString(g: GermanGender): string {
    if (g === GermanGender.M) return "M";
    else if (g === GermanGender.F) return "F";
    else return "N";
}

function getRosaeNLGTenseString(t: GermanTense): string {
    if (t === GermanTense.PRESENT) return "PRASENS";
    else if (t === GermanTense.PAST) return "PRATERITUM";
    else if (t === GermanTense.PERFECT) return "PERFEKT";    
    else if (t === GermanTense.PASTPERF) return "PLUSQUAMPERFEKT";
    else if (t === GermanTense.FUTURE) return "FUTUR1";
    else if (t === GermanTense.FUTUREPERF) return "FUTUR2";
    else return "";
}

function inflectVerb(v: EnDeVerb, infl: EnDeVerbInflector): [string, string[]] {
    if (infl.tense === GermanTense.INFINITIVE)
        return [v.enForm, [v.deForm]];
    var tenStr = getRosaeNLGTenseString(infl.tense);
    var psn = 1+infl.person;
    var numStr = getRosaeNLGNumberString(infl.number);
    return [v.enForm, GermanVerbsLib.getConjugation(GermanVerbsDict, v.deForm, tenStr, psn, numStr)];
}

function getPronoun(p: GermanPerson, n: GermanNumber, g: GermanGender): EnDeNoun {
    return {
        enForm: "PRONOUN",
        deForm: "PRONOUN",
        tags: ["pronoun", "agent"],
        hint: "",
        rels: {},
        guid: guidGenerator(),
        person: p,
        number: n,
        gender: g
    }
}

function inflectNoun(n: EnDeNoun, infl: EnDeNounInflector): [string, string] {
    if (n.enForm === "PRONOUN") { // Special logic for pronoun inflection
        var ind0 = infl.case;
        var ind1 = 3*n.number + n.person;
        var ind2 = n.gender;
        return [enPronouns[ind0][ind1][ind2], dePronouns[ind0][ind1][ind2]];
    }
    var caseStr = getRosaeNLGCaseString(infl.case);
    var numStr = getRosaeNLGNumberString(n.number);
    return [n.enForm, GermanWords.getCaseGermanWord(null, GermanWordsList, n.deForm, caseStr, numStr)];
}

function inflectDet(d: EnDeDeterminer, infl: EnDeDeterminerInflector): [string, string] {
    var enForm = getEnglishDeterminer(d.det);
    var detStr = getRosaeNLGDeterminerString(d.det);
    var caseStr = getRosaeNLGCaseString(infl.case);
    var gdrStr = getRosaeNLGGenderString(infl.gender);
    var nbrStr = getRosaeNLGNumberString(infl.number);
    var ownGdrStr = (infl.ownerGender === undefined) ? null : getRosaeNLGGenderString(infl.ownerGender);
    var ownNbrStr = (infl.ownerNumber === undefined) ? null : getRosaeNLGNumberString(infl.ownerNumber);
    // 1st and 2nd person possessive determiners are not yet supported
    return <[string, string]>[enForm, GermanDets.getDet(detStr, caseStr, ownGdrStr, ownNbrStr, gdrStr, nbrStr)];
}

function inflectAdj(a: EnDeAdjective, infl: EnDeAdjectiveInflector): [string, string] {
    return null!;
}

function defaultNounInflector(): EnDeNounInflector {
    return {
        case: GermanCase.NOM
    };
}

function defaultVerbInflector(): EnDeVerbInflector {
    return {
        number: GermanNumber.S,
        person: GermanPerson.P3,
        tense: GermanTense.PRESENT
    }
}

function defaultAdjInflector(): EnDeAdjectiveInflector {
    return null!
}

function defaultDetInflector(): EnDeDeterminerInflector {
    return {
        case: GermanCase.NOM,
        gender: GermanGender.N,
        number: GermanNumber.S,
        ownerGender: GermanGender.N,
        ownerNumber: GermanNumber.S
    };
}

// NEED FUNCTIONS FOR MAKING NOUNS, VERBS, DETS and ADJS

export enum EnDePhraseAxnType {
    DupNoun,
    DupVerb,
    DupAdj,
    DupDet,
    MakePronoun,
    MakeDet,
    RandomPronoun,
    DeclineNoun,
    DeclineDet,
    ConjugateVerb,
    AgreeVerbWithSubj,
    AgreeAdjWithNounDet
}

export type EnDePhraseAxn = {
    type: EnDePhraseAxnType,
    num1?: number,
    num2?: number,
    wd1?: number,
    wd2?: number,
    wd3?: number
}

export type EnDeWordStacks = {
    words: IDictionary<WithTags[]>,
    inflectors: IDictionary<any[]>,
    tplGuid: string
}

export class EnDePhraseTpl {
    guid: string;
    picker: WordPicker;
    actions: EnDePhraseAxn[];
    subs: [RegExp, string][];

    fmt: [string, string];

    constructor(wp: WordPicker, subs: [RegExp, string][] = []) {
        this.guid = guidGenerator();
        this.picker = wp;
        this.actions = [];
        this.subs = subs;
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
            type: EnDePhraseAxnType.DupVerb,
            wd1: id
        });
        return this;
    }

    dupD(id: number) {
        this.actions.push({
            type: EnDePhraseAxnType.DupDet,
            wd1: id
        });
        return this;
    }

    dupN(id: number) {
        this.actions.push({
            type: EnDePhraseAxnType.DupNoun,
            wd1: id
        });
        return this;
    }

    dupA(id: number) {
        this.actions.push({
            type: EnDePhraseAxnType.DupAdj,
            wd1: id
        });
        return this;
    }

    pron(id: number) {
        this.actions.push({
            type: EnDePhraseAxnType.MakePronoun,
            wd1: id
        });
        return this;
    }

    det(id: number, dType: number, ownerId?: number) {
        this.actions.push({
            type: EnDePhraseAxnType.MakeDet,
            wd1: id,
            wd2: ownerId,
            num1: dType
        });
        return this;
    }
    
    rpron() {
        this.actions.push({
            type: EnDePhraseAxnType.RandomPronoun,
        });
        return this;
    }

    declN(id: number, c: GermanCase) {
        this.actions.push({
            type: EnDePhraseAxnType.DeclineNoun,
            wd1: id,
            num1: c
        });
        return this;
    }
    
    declD(id: number, c: GermanCase) {
        this.actions.push({
            type: EnDePhraseAxnType.DeclineDet,
            wd1: id,
            num1: c
        });
        return this;
    }

    conj(id: number, t: GermanTense) {
        this.actions.push({
            type: EnDePhraseAxnType.ConjugateVerb,
            wd1: id,
            num1: t
        });
        return this;
    }

    agreeVN(idV: number, idN: number) {
        this.actions.push({
            type: EnDePhraseAxnType.AgreeVerbWithSubj,
            wd1: idV,
            wd2: idN
        });
        return this;
    }
    
    agreeAN(idV: number, idN: number, idD: number) {
        this.actions.push({
            type: EnDePhraseAxnType.AgreeVerbWithSubj,
            wd1: idV,
            wd2: idN,
            wd3: idD
        });
        return this;
    }

    format(fmt0: string, fmt1: string) {
        this.fmt = [fmt0, fmt1];
        return this;
    }

    runAction(stacks: EnDeWordStacks, axn: EnDePhraseAxn): EnDeWordStacks {
        if (axn.type === EnDePhraseAxnType.DupNoun) {
            stacks.words["n"].push(stacks.words["n"][axn.wd1!]);
            stacks.inflectors["n"].push(stacks.inflectors["n"][axn.wd1!]);
            return stacks;
        } else if (axn.type === EnDePhraseAxnType.DupVerb) {
            stacks.words["v"].push(stacks.words["v"][axn.wd1!]);
            stacks.inflectors["v"].push(stacks.inflectors["v"][axn.wd1!]);
            return stacks;
        } else if (axn.type === EnDePhraseAxnType.DupDet) {
            stacks.words["d"].push(stacks.words["d"][axn.wd1!]);
            stacks.inflectors["d"].push(stacks.inflectors["d"][axn.wd1!]);
            return stacks;
        } else if (axn.type === EnDePhraseAxnType.DupAdj) {
            stacks.words["a"].push(stacks.words["a"][axn.wd1!]);
            stacks.inflectors["a"].push(stacks.inflectors["a"][axn.wd1!]);
            return stacks;
        } else if (axn.type === EnDePhraseAxnType.MakePronoun) {
            var n = <EnDeNoun>stacks.words["n"][axn.wd1!];
            var pron = getPronoun(n.person, n.number, n.gender);
            stacks.words["n"].push(pron);
            stacks.inflectors["n"].push(defaultNounInflector());
            return stacks;
        } else if (axn.type === EnDePhraseAxnType.MakeDet) {
            var n = <EnDeNoun>stacks.words["n"][axn.wd1!];
            var nInfl = <EnDeNounInflector>stacks.inflectors["n"][axn.wd1!];
            var owner = (axn.wd2 === undefined) ? undefined : <EnDeNoun>stacks.words["n"][axn.wd2!];
            var gOwner = (owner === undefined) ? undefined : owner.gender;
            var pOwner = (owner === undefined) ? undefined : owner.person;
            var nOwner = (owner === undefined) ? undefined : owner.number;
            var d: EnDeDeterminer = {
                det: axn.num1!,
                tags: [],
                rels: {},
                guid: guidGenerator() 
            };
            var dInfl: EnDeDeterminerInflector = {
                case: nInfl.case,
                gender: n.gender,
                number: n.number,
                ownerGender: gOwner,
                ownerPerson: pOwner,
                ownerNumber: nOwner
            };
            stacks.words["d"].push(d);
            stacks.inflectors["d"].push(dInfl);
            return stacks;
        } else if (axn.type === EnDePhraseAxnType.RandomPronoun) {
            var number = Math.floor(2*Math.random());
            var person = Math.floor(3*Math.random());
            var gender = (number === 0 && person === 2) ? Math.floor(3*Math.random()) : 0;
            var pron = getPronoun(person, number, gender);
            stacks.words["n"].push(pron);
            stacks.inflectors["n"].push(defaultNounInflector());
            return stacks;
        } else if (axn.type === EnDePhraseAxnType.DeclineNoun) {
            stacks.inflectors["n"][axn.wd1!].case = axn.num1;
            return stacks;
        } else if (axn.type === EnDePhraseAxnType.DeclineDet) {
            stacks.inflectors["d"][axn.wd1!].case = axn.num1;
            return stacks;
        } else if (axn.type === EnDePhraseAxnType.ConjugateVerb) {
            stacks.inflectors["v"][axn.wd1!].tense = axn.num1;
            return stacks;
        } else if (axn.type === EnDePhraseAxnType.AgreeVerbWithSubj) {
            var n = <EnDeNoun>stacks.words["n"][axn.wd2!];
            var vInf = <EnDeVerbInflector>stacks.inflectors["v"][axn.wd1!];
            vInf.number = n.number;
            vInf.person = n.person;
            return stacks;
        } else if (axn.type === EnDePhraseAxnType.AgreeAdjWithNounDet) {
            // Will implement later!
            return null!;
        }
        return stacks;
    }

    next(wc: WordRelChecker): EnDeWordStacks {
        this.picker.checker = wc;
        var words = this.picker.resolve();
        var stacks: EnDeWordStacks = {
            tplGuid: this.guid,
            words: words,
            inflectors: {
                "n": words["n"].map((_) => defaultNounInflector()),
                "a": words["a"].map((_) => defaultAdjInflector()),
                "v": words["v"].map((_) => defaultVerbInflector()),
                "d": words["d"].map((_) => defaultDetInflector())
            }
        };

        for (var i = 0; i < this.actions.length; i++) {
            var axn = this.actions[i];
            stacks = this.runAction(stacks, axn);
        }

        return stacks;
    }

    gen(stacks: EnDeWordStacks): [string, string] {
        var res = [this.fmt[0].slice(), this.fmt[1].slice()];
        for (var i = 0; i < stacks.words["n"].length; i++) {
            var n = <EnDeNoun>stacks.words["n"][i];
            var nInf = <EnDeNounInflector>stacks.inflectors["n"][i];
            var nRes = inflectNoun(n, nInf);
            res[0] = res[0].replace(`{n${i}}`, nRes[0]);
            res[1] = res[1].replace(`{n${i}}`, nRes[1]);
        }
        for (var i = 0; i < stacks.words["v"].length; i++) {
            var v = <EnDeVerb>stacks.words["v"][i];
            var vInf = <EnDeVerbInflector>stacks.inflectors["v"][i];
            var vRes = inflectVerb(v, vInf);
            res[0] = res[0].replace(`{v${i}}`, vRes[0]);
            for (var j = 0; j < vRes[1].length; j++) {   // Verb conjugations in German can be multi-word
                res[1] = res[1].replace(`{v${i}.${j}}`, vRes[1][j]);
            }
        }
        for (var i = 0; i < stacks.words["a"].length; i++) {
            var a = <EnDeAdjective>stacks.words["a"][i];
            var aInf = <EnDeAdjectiveInflector>stacks.inflectors["a"][i];
            var aRes = inflectAdj(a, aInf);
            res[0] = res[0].replace(`{a${i}}`, aRes[0]);
            res[1] = res[1].replace(`{a${i}}`, aRes[1]);
        }
        for (var i = 0; i < stacks.words["d"].length; i++) {
            var d = <EnDeDeterminer>stacks.words["d"][i];
            var dInf = <EnDeDeterminerInflector>stacks.inflectors["d"][i];
            var dRes = inflectDet(d, dInf);
            res[0] = res[0].replace(`{d${i}}`, dRes[0]);
            res[1] = res[1].replace(`{d${i}}`, dRes[1]);
        }
        for (var i = 0; i < this.subs.length; i++) {
            res[0] = res[0].replace(this.subs[i][0], this.subs[i][1]);
            res[1] = res[1].replace(this.subs[i][1], this.subs[i][1]);
        }
        return <[string, string]>res;
    }
}
