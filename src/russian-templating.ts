const papa = require("papaparse"); 
const EnglishPlural = require("pluralize-me");
const EnglishVerbs = require('english-verbs');
const EnglishVerbHelper = require('english-verbs-helper');

declare global {
    var ruAdjectives: any
    var ruNouns: any
    var ruVerbs: any
}

var ruDataPromise = (filename: string, objname: string) =>
    fetch(`/data/${filename}.csv`).then((r) => r.text()).then((s) => { 
    var csvData = papa.parse(s, { header: true, dynamicTyping: true }).data;
    (<any>window)[objname] = (bareVerb: string) => { 
        var v = csvData.find((k: any) => k.bare === bareVerb);
        if (v === undefined)
            v = csvData.find((k: any) => k.pl_nom.replace("'", "") === bareVerb);
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

const caseNOM = RussianCase.CaseNominative;
const caseACC = RussianCase.CaseAccusative;
const caseDAT = RussianCase.CaseDative;
const casePRP = RussianCase.CasePrepositional;
const caseGEN = RussianCase.CaseGenitive;
const caseINS = RussianCase.CaseInstrumental;

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

enum RussianTense {
    TenseInfinitive,
    TensePresent,
    TensePast
}

const enTenseStrings = ["PRESENT", "PRESENT", "PAST"];

type EnRuNoun = {
    enForm: string,
    ruForm: string,
    gender: RussianGender,
    number: RussianNumber,
    person: RussianPerson,
    tags: string[]
}

type EnRuNounInflector = {
    case: RussianCase
}

type EnRuVerb = {
    enForm: string,
    ruForm: string,
    tags: string[],
    subjTag: string,
    objTag: string,
    hint: string
}

type EnRuVerbInflector = {
    tense: RussianTense,
    gender: RussianGender,
    number: RussianNumber,
    person: RussianPerson
}

type EnRuWordLibrary = {
    nouns: EnRuNoun[],
    verbs: EnRuVerb[]
}

function pickNoun(lib: EnRuWordLibrary, tag: string) {
    var options = (tag === "") ? lib.nouns : lib.nouns.filter((w) => w.tags.includes(tag));
    return options[Math.floor(Math.random() * options.length)];
}

function pickVerb(lib: EnRuWordLibrary, tag: string) {
    var options = (tag === "") ? lib.verbs : lib.verbs.filter((w) => w.tags.includes(tag));
    return options[Math.floor(Math.random() * options.length)];
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

function inflectNoun(n: EnRuNoun, inf: EnRuNounInflector): [string, string] {
    var ruRecord = window.ruNouns(n.ruForm);
    var numStr = (n.number === RussianNumber.NumberPlural) ? "pl" : "sg";
    var cStr = ["nom", "acc", "dat", "prep", "gen", "inst"][inf.case];
    var ruInfl = ruRecord[`${numStr}_${cStr}`].split(', ')[0]; // We may not always want the 1st one...
    ruInfl = ruInfl.replace("'", "");
    // TODO: In English, we actually need to do some inflecting if it is a pronoun!
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

export function makeSingularNoun(enForm: string, ruForm: string, tags: string[] = []): EnRuNoun {
    var ruNoun = window.ruNouns(ruForm);
    var gender = getRussianGender(ruForm);
    return {
        enForm: enForm,
        ruForm: ruForm,
        gender: gender,
        number: RussianNumber.NumberSingular,
        person: RussianPerson.Person3rd,
        tags: tags
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
        hint: hint
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
        hint: hint
    }
}

class WordRepo {
    lib: EnRuWordLibrary;
    nouns: [EnRuNoun, EnRuNounInflector][];
    verbs: [EnRuVerb, EnRuVerbInflector][];

    constructor(lib: EnRuWordLibrary) {
        this.nouns = [];
        this.verbs = [];
        this.lib = lib;
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
        var v = pickVerb(this.lib, tag);
        this.addV(v, tense);
        return this; 
    }

    dupV(vId: number, tense: RussianTense = 0) {
        // this.addV(objCloner(this.verbs[vId][0]), tense);
        this.addV(this.verbs[vId][0], tense);
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
        var n = pickNoun(this.lib, tag);
        this.addN(n, cs);
        return this;
    }

    addSubj(n: EnRuNoun, vId: number) {
        this.verbs[vId][1].gender = n.gender;
        this.verbs[vId][1].number = n.number;
        this.verbs[vId][1].person = n.person;
        this.addN(n, RussianCase.CaseNominative);
        return this;
    }

    pickSubj(vId: number) {
        var tag = this.verbs[vId][0].subjTag;
        var n = pickNoun(this.lib, tag);
        this.addSubj(n, vId);
        return this;
    }

    pickObj(vId: number) {
        var tag = this.verbs[vId][0].objTag;
        var n = pickNoun(this.lib, tag);
        this.addN(n, RussianCase.CaseAccusative);
        return this;
    }

    format(enTpl: string, ruTpl: string): [string, string] {
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
        return [enTpl, ruTpl];
    } 
}

function makeLib() {
    var nounLibrary = [
        makeSingularNoun("girl", "девушка", ["agent", "inhab", "hasloc"]),
        makeSingularNoun("dog", "собака", ["agent", "animal", "inhab", "hasloc"]),
        makeSingularNoun("car", "машина", ["object", "inhab", "openable", "hasloc"]),
        makeSingularNoun("door", "дверь", ["object", "openable", "hasloc"]),
        makeSingularNoun("window", "окно", ["object", "openable", "hasloc"]),
        makeSingularNoun("house", "дом", ["buildable", "in-place", "object", "hasloc"]),
        makeSingularNoun("street", "улица", ["on-place", "hasloc"]),
        makeSingularNoun("apartment", "квартира", ["in-place", "hasloc"]),
        makeSingularNoun("bathroom", "туалет", ["hasloc", "in-place"]),
        makeSingularNoun("kitchen", "кухня", ["hasloc", "in-place"]),
        makeSingularNoun("bridge", "мост", ["buildable", "at-place", "hasloc"]),
        makeSingularNoun("Russia", "Россия", ["in-place", "country"]),
        makeSingularNoun("Ukraine", "Украина", ["at-place", "country"]),
    ]

    var verbLibrary: EnRuVerb[] = [
        makeIntransVerb("speak", "говорить", "agent", []),
        makeIntransVerb("go", "ехать", "agent", [], "by transport"),
        makeIntransVerb("go", "идти", "agent", [], "by foot"),
        makeIntransVerb("open", "открываться", "openable", []),
        makeIntransVerb("close", "закрываться", "openable", []),
        makeTransVerb("open", "открывать", "agent", "openable", []),
        makeTransVerb("build", "строить", "agent", "buildable", []),
        makeTransVerb("love", "любить", "agent", "", ["of-verb"]),
        makeIntransVerb("start", "начинать", "agent", ["of-verb"]),
    ]

    var lib: EnRuWordLibrary = {
        nouns: nounLibrary,
        verbs: verbLibrary
    }

    return lib;
}

var tpls = [
    (wr: any) => wr.pickN("inhab").format("where's (the) {n0}?", "где {n0}?"),
    (wr: any) => wr.pickV(1, "intrans").pickSubj(0).format("{n0} {v0}", "{n0} {v0}"),
    (wr: any) => wr.pickV(1, "intrans").dupV(0).pickSubj(0).format("{n0} do/does not {v1}", "{n0} не {v0}"),
    (wr: any) => wr.pickN("inhab").pickN("in-place", casePRP).format("{n0} is in {n1}", "{n0} в {n1}"),
    (wr: any) => wr.pickN("inhab").pickN("on-place", casePRP).format("{n0} is in {n1}", "{n0} на {n1}"),
    (wr: any) => wr.pickV(1, "trans").pickSubj(0).pickObj(0).format("{n0} {v0} {n1}", "{n0} {v0} {n1}"),
    (wr: any) => wr.pickV(1, "of-verb").pickV(0, "intrans").pickSubj(0).format("{n0} {v0} to {v1}", "{n0} {v0} {v1}")
]

ruDataPromise("ru-nouns", "ruNouns").then((_) => { ruDataPromise("ru-verbs", "ruVerbs").then((_) => {
    var lib = makeLib();

    for (var i in [...Array(40).keys()]) {
        var tpl = tpls[Math.floor(Math.random() * tpls.length)];
        var repo = new WordRepo(lib);
        var res = tpl(repo); 
        console.log(res);
    }
})})
