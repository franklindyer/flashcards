import {
    IDictionary,
    guidGenerator
} from "./lib";
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
    var tenStr = getRosaeNLGTenseString(infl.tense);
    var psn = 1+infl.person;
    var numStr = getRosaeNLGNumberString(infl.number);
    return GermanVerbsLib.getConjugation(GermanVerbsDict, v.deForm, tenStr, psn, numStr);
}

function inflectNoun(n: EnDeNoun, infl: EnDeNounInflector): [string, string] {
    var caseStr = getRosaeNLGCaseString(infl.case);
    var numStr = getRosaeNLGNumberString(n.number);
    return [n.enForm, GermanWords.getCaseGermanWord(null, GermanWordsList, n.deForm, caseStr, numStr)];
}

function inflectDet(d: EnDeDeterminer, infl: EnDeDeterminerInflector): [string, string] {
    var detStr = getRosaeNLGDeterminerString(d.det);
    var caseStr = getRosaeNLGCaseString(infl.case);
    var gdrStr = getRosaeNLGGenderString(infl.gender);
    var nbrStr = getRosaeNLGNumberString(infl.number);
    var ownGdrStr = (infl.ownerGender === undefined) ? null : getRosaeNLGGenderString(infl.ownerGender);
    var ownNbrStr = (infl.ownerNumber === undefined) ? null : getRosaeNLGNumberString(infl.ownerNumber);
    // 1st and 2nd person possessive determiners are not yet supported
    return GermanDets.getDet(detStr, caseStr, ownGdrStr, ownNbrStr, gdrStr, nbrStr);
}

function inflectAdj(a: EnDeAdjective, infl: EnDeAdjectiveInflector): [string, string] {
    return null!;
}
