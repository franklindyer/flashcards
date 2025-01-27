import {
    IDictionary,
    guidGenerator
} from "./lib";

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

enum GermanArticle {
    DEF,    // der
    INDEF,  // ein
    NEG,    // kein
    MEIN,
    DEIN,
    SEIN,
    IHR,
    UNSER,
    EUER,
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

export type EnDeArticle = {
    article: GermanArticle,
    tags: string[],
    rels: IDictionary<string[]>,
    guid: string
}

export type EnDeArticleInflector = {
    case: GermanCase,
    gender: GermanGender,
    number: GermanNumber
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
    strength: GermanStrength
}

function inflectVerb(v: EnDeVerb, infl: EnDeVerbInflector): [string, string[]] {
    return null!
}

function inflectNoun(n: EnDeNoun, infl: EnDeNounInflector): [string, string] {
    return null!
}

function inflectArticle(a: EnDeArticle, infl: EnDeArticleInflector): [string, string] {
    return null!;
}

function inflectAdj(a: EnDeAdjective, infl: EnDeAdjectiveInflector): [string, string] {
    return null!;
}
