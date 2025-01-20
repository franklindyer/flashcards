"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WordRepo = exports.makeAdj = exports.makeTransVerb = exports.makeIntransVerb = exports.makeSingularNoun = exports.getRussianGender = exports.EnRuWordLibrary = exports.caseINS = exports.caseGEN = exports.casePRP = exports.caseDAT = exports.caseACC = exports.caseNOM = exports.ruDataPromise = void 0;
const weighted_rand_1 = require("./weighted-rand");
const getUuid = require('uuid-by-string');
const papa = require("papaparse");
const EnglishPlural = require("pluralize-me");
const EnglishVerbs = require('english-verbs');
const EnglishVerbHelper = require('english-verbs-helper');
var ruDataPromise = (filename, objname) => fetch(`/data/${filename}.csv`).then((r) => r.text()).then((s) => {
    var csvData = papa.parse(s, { header: true, dynamicTyping: true }).data;
    window[objname] = (bareVerb) => {
        var v = csvData.find((k) => k.bare === bareVerb);
        //     v = csvData.find((k: any) => k["pl_nom"].replace("'", "") === bareVerb);
        return v;
    };
});
exports.ruDataPromise = ruDataPromise;
function objCloner(x) {
    return JSON.parse(JSON.stringify(x));
}
var RussianCase;
(function (RussianCase) {
    RussianCase[RussianCase["CaseNominative"] = 0] = "CaseNominative";
    RussianCase[RussianCase["CaseAccusative"] = 1] = "CaseAccusative";
    RussianCase[RussianCase["CaseDative"] = 2] = "CaseDative";
    RussianCase[RussianCase["CasePrepositional"] = 3] = "CasePrepositional";
    RussianCase[RussianCase["CaseGenitive"] = 4] = "CaseGenitive";
    RussianCase[RussianCase["CaseInstrumental"] = 5] = "CaseInstrumental";
})(RussianCase || (RussianCase = {}));
exports.caseNOM = RussianCase.CaseNominative;
exports.caseACC = RussianCase.CaseAccusative;
exports.caseDAT = RussianCase.CaseDative;
exports.casePRP = RussianCase.CasePrepositional;
exports.caseGEN = RussianCase.CaseGenitive;
exports.caseINS = RussianCase.CaseInstrumental;
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
var RussianAnimacy;
(function (RussianAnimacy) {
    RussianAnimacy[RussianAnimacy["AnimacyAnimate"] = 0] = "AnimacyAnimate";
    RussianAnimacy[RussianAnimacy["AnimacyInanimate"] = 1] = "AnimacyInanimate";
})(RussianAnimacy || (RussianAnimacy = {}));
var RussianTense;
(function (RussianTense) {
    RussianTense[RussianTense["TenseInfinitive"] = 0] = "TenseInfinitive";
    RussianTense[RussianTense["TensePresent"] = 1] = "TensePresent";
    RussianTense[RussianTense["TensePast"] = 2] = "TensePast";
})(RussianTense || (RussianTense = {}));
const enTenseStrings = ["PRESENT", "PRESENT", "PAST"];
class EnRuWordLibrary {
    constructor(nouns, verbs, adjs) {
        this.nouns = nouns;
        this.verbs = verbs;
        this.adjs = adjs;
        this.tagWeights = {};
        this.genderWeights = { 0: 1, 1: 1, 2: 1 };
        this.numberWeights = { 0: 1, 1: 1 };
        this.personWeights = { 0: 1, 1: 1, 2: 1 };
        this.caseWeights = { 0: 1, 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 };
    }
    pickNoun(tag = "") {
        var options = (tag === "") ? this.nouns : this.nouns.filter((w) => w.tags.includes(tag));
        return options[Math.floor(Math.random() * options.length)];
    }
    pickVerb(tag = "") {
        var options = (tag === "") ? this.verbs : this.verbs.filter((w) => w.tags.includes(tag));
        return options[Math.floor(Math.random() * options.length)];
    }
    pickAdj(tags = []) {
        var options = this.adjs.filter((a) => tags.includes(a.nounTag));
        return options[Math.floor(Math.random() * options.length)];
    }
    pickVerbWithAnySubjTag(tags, tag = "") {
        var options = this.verbs.filter((v) => tags.includes(v.subjTag));
        options = (tag === "") ? options : options.filter((w) => w.tags.includes(tag));
        return options[Math.floor(Math.random() * options.length)];
    }
    pickGender() {
        return (0, weighted_rand_1.weightedRandom)([0, 1, 2], (k) => this.genderWeights[k], Math.random());
    }
    pickNumber() {
        return (0, weighted_rand_1.weightedRandom)([0, 1], (k) => this.numberWeights[k], Math.random());
    }
    pickPerson() {
        return (0, weighted_rand_1.weightedRandom)([0, 1, 2], (k) => this.personWeights[k], Math.random());
    }
}
exports.EnRuWordLibrary = EnRuWordLibrary;
function getRussianGender(ruNoun) {
    var ruNounRow = window.ruNouns(ruNoun);
    if (ruNounRow["gender"] === "m")
        return RussianGender.GenderMale;
    else if (ruNounRow["gender"] === "f")
        return RussianGender.GenderFemale;
    else if (ruNounRow["gender"] === "n")
        return RussianGender.GenderNeuter;
    else if (["а", "я"].includes(ruNoun.slice(-1)))
        return RussianGender.GenderFemale;
    else if (["о", "е"].includes(ruNoun.slice(-1)))
        return RussianGender.GenderNeuter;
    else
        return RussianGender.GenderMale;
}
exports.getRussianGender = getRussianGender;
function getPronoun(num, psn, gdr, anm) {
    var tr = ["", ""];
    if (num === RussianNumber.NumberSingular) {
        if (psn === RussianPerson.Person1st)
            tr = ["I", "я"];
        else if (psn === RussianPerson.Person2nd)
            tr = ["you", "ты"];
        else if (gdr === RussianGender.GenderMale)
            tr = ["he", "он"];
        else if (gdr === RussianGender.GenderFemale)
            tr = ["she", "она"];
        else if (gdr === RussianGender.GenderNeuter)
            tr = ["it", "оно"];
    }
    else {
        if (psn === RussianPerson.Person1st)
            tr = ["we", "мы"];
        else if (psn === RussianPerson.Person2nd)
            tr = ["y'all", "вы"];
        else if (psn === RussianPerson.Person3rd)
            tr = ["they", "они"];
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
        animacy: anm,
        tags: ["pronoun"],
        guid: getUuid(tr[1])
    };
}
const enProns = {
    "I": ["I", "me", "me", "me", "me", "me"],
    "you": ["you", "you", "you", "you", "you", "you"],
    "he": ["he", "him", "him", "him", "him", "him"],
    "she": ["she", "her", "her", "her", "her", "her"],
    "it": ["it", "it", "it", "it", "it", "it"],
    "we": ["we", "us", "us", "us", "us", "us"],
    "y'all": ["y'all", "y'all", "y'all", "y'all", "y'all", "y'all"],
    "they": ["they", "them", "them", "them", "them", "them"]
};
const ruProns = {
    "я": ["я", "меня", "мне", "меня", "мне", ""],
    "ты": ["ты", "тебя", "тебе", "тебя", "тебе", ""],
    "он": ["он", "его", "ему", "нём", "его", ""],
    "она": ["она", "её", "ей", "ней", "её", ""],
    "оно": ["оно", "его", "ему", "нём", "его", ""],
    "мы": ["мы", "нас", "нам", "нас", "нас", ""],
    "вы": ["вы", "вас", "вам", "вас", "вас", ""],
    "они": ["они", "их", "им", "них", "их", ""]
};
function inflectNoun(n, inf) {
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
function inflectVerb(v, inf) {
    var ruRecord = window.ruVerbs(v.ruForm);
    var key = "";
    switch (inf.tense) {
        case RussianTense.TensePresent:
            switch (inf.person) {
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
            }
            else {
                switch (inf.gender) {
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
function inflectAdj(a, inf) {
    var ruRecord = window.ruAdjectives(a.ruForm);
    var gdrStr = "";
    if (inf.number === RussianNumber.NumberPlural)
        gdrStr = "pl";
    else if (inf.gender === RussianGender.GenderMale)
        gdrStr = "m";
    else if (inf.gender === RussianGender.GenderFemale)
        gdrStr = "f";
    else if (inf.gender === RussianGender.GenderNeuter)
        gdrStr = "n";
    var cStr = ["nom", "acc", "dat", "prep", "gen", "inst"][inf.case];
    var col = `decl_${gdrStr}_${cStr}`;
    console.log(a);
    console.log(col);
    var decls = ruRecord[col].split(',');
    // Male accusative column contains a special animate declension
    if (col === "decl_m_acc") {
        if (inf.animacy === RussianAnimacy.AnimacyAnimate)
            return [a.enForm, decls.filter((s) => s.endsWith("го"))];
        else
            return [a.enForm, decls.filter((s) => !s.endsWith("го"))];
    }
    // This may not be correct in all cases, may need to be fixed later
    return [a.enForm, decls[0]];
}
function makeSingularNoun(enForm, ruForm, gdr, animacy, tags = []) {
    // var gender = getRussianGender(ruForm);
    var gender = RussianGender.GenderNeuter;
    if (gdr === "m")
        gender = RussianGender.GenderMale;
    else if (gdr === "f")
        gender = RussianGender.GenderFemale;
    return {
        enForm: enForm,
        ruForm: ruForm,
        gender: gender,
        number: RussianNumber.NumberSingular,
        person: RussianPerson.Person3rd,
        animacy: animacy ? RussianAnimacy.AnimacyAnimate : RussianAnimacy.AnimacyInanimate,
        tags: tags,
        guid: getUuid(ruForm)
    };
}
exports.makeSingularNoun = makeSingularNoun;
function makeIntransVerb(enForm, ruForm, subjTag, tags = [], hint = "") {
    tags.push("intrans");
    return {
        enForm: enForm,
        ruForm: ruForm,
        tags: tags,
        subjTag: subjTag,
        objTag: "",
        hint: hint,
        guid: getUuid(ruForm)
    };
}
exports.makeIntransVerb = makeIntransVerb;
function makeTransVerb(enForm, ruForm, subjTag, objTag, tags = [], hint = "") {
    tags.push("trans");
    return {
        enForm: enForm,
        ruForm: ruForm,
        tags: tags,
        subjTag: subjTag,
        objTag: objTag,
        hint: hint,
        guid: getUuid(ruForm)
    };
}
exports.makeTransVerb = makeTransVerb;
function makeAdj(enForm, ruForm, nounTag, tags = [], hint = "") {
    return {
        enForm: enForm,
        ruForm: ruForm,
        tags: tags,
        nounTag: nounTag,
        hint: hint,
        guid: getUuid(ruForm)
    };
}
exports.makeAdj = makeAdj;
class WordRepo {
    constructor(lib) {
        this.nouns = [];
        this.verbs = [];
        this.adjs = [];
        this.substitutions = [];
        this.lib = lib;
        this.enFormat = "";
        this.ruFormat = "";
    }
    addV(v, tense = 0) {
        var vInf = {
            tense: tense,
            gender: RussianGender.GenderNeuter,
            number: RussianNumber.NumberSingular,
            person: RussianPerson.Person1st
        };
        this.verbs.push([v, vInf]);
        return this;
    }
    pickV(tense = 0, tag = "") {
        var v = this.lib.pickVerb(tag);
        this.addV(v, tense);
        return this;
    }
    dupV(vId, tense = 0) {
        // this.addV(objCloner(this.verbs[vId][0]), tense);
        this.addV(this.verbs[vId][0], tense);
        return this;
    }
    conjV(vId, nId, tense = 1) {
        var n = this.nouns[nId][0];
        var vInf = {
            tense: tense,
            gender: n.gender,
            number: n.number,
            person: n.person
        };
        this.verbs[vId][1] = vInf;
        return this;
    }
    addN(n, cs = exports.caseNOM) {
        var nInf = {
            case: cs
        };
        this.nouns.push([n, nInf]);
        return this;
    }
    pickN(tag = "", cs = exports.caseNOM) {
        var n = this.lib.pickNoun(tag);
        this.addN(n, cs);
        return this;
    }
    addA(a, nId) {
        var n = this.nouns[nId][0];
        var nInf = this.nouns[nId][1];
        var aInf = {
            gender: n.gender,
            number: n.number,
            animacy: n.animacy,
            case: nInf.case
        };
        this.adjs.push([a, aInf]);
        return this;
    }
    pickA(nId) {
        var n = this.nouns[nId][0];
        this.addA(this.lib.pickAdj(n.tags), nId);
        return this;
    }
    addPron(nId, cs = exports.caseNOM) {
        var n = this.nouns[nId][0];
        var pron = getPronoun(n.number, n.person, n.gender, n.animacy);
        this.addN(pron, cs);
        return this;
    }
    pickPron(tags = [], cs = exports.caseNOM) {
        var pron = getPronoun(this.lib.pickNumber(), this.lib.pickPerson(), this.lib.pickGender());
        pron.tags.push("agent");
        tags.map((t) => pron.tags.push(t));
        this.addN(pron, cs);
        return this;
    }
    addSubj(n, vId) {
        this.verbs[vId][1].gender = n.gender;
        this.verbs[vId][1].number = n.number;
        this.verbs[vId][1].person = n.person;
        this.addN(n, RussianCase.CaseNominative);
        return this;
    }
    pickSubj(vId, pronProb = 0.5) {
        var tag = this.verbs[vId][0].subjTag;
        var n;
        if ((tag === "agent" || tag === "person") && Math.random() < pronProb) {
            n = getPronoun(this.lib.pickNumber(), this.lib.pickPerson(), this.lib.pickGender());
        }
        else {
            n = this.lib.pickNoun(tag);
        }
        this.addSubj(n, vId);
        return this;
    }
    pickObj(vId, pronProb = 0.5) {
        var tag = this.verbs[vId][0].objTag;
        var n;
        if ((tag === "person") && Math.random() < pronProb) {
            n = getPronoun(this.lib.pickNumber(), this.lib.pickPerson(), this.lib.pickGender());
        }
        else {
            n = this.lib.pickNoun(tag);
        }
        this.addN(n, RussianCase.CaseAccusative);
        return this;
    }
    pickAxn(nId, tag = "", tense = 0) {
        var n = this.lib.nouns[nId];
        var v = this.lib.pickVerbWithAnySubjTag(n.tags, tag);
        this.addV(v, tense);
        return this;
    }
    resolve() {
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
    format(enTpl, ruTpl) {
        this.enFormat = enTpl;
        this.ruFormat = ruTpl;
        return this;
    }
    sub(source, target) {
        this.substitutions.push([source, target]);
    }
}
exports.WordRepo = WordRepo;
