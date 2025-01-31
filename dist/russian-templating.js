"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnRuPhraseTpl = exports.EnRuPhraseAxnType = exports.makeAdj = exports.makeTransVerb = exports.makeIntransVerb = exports.makePluralNoun = exports.makeSingularNoun = exports.getRussianGender = exports.caseINS = exports.caseGEN = exports.casePRP = exports.caseDAT = exports.caseACC = exports.caseNOM = exports.ruDataPromise = void 0;
const lib_1 = require("./lib");
const getUuid = require('uuid-by-string');
const papa = require("papaparse");
const EnglishPlural = require("pluralize-me");
const EnglishVerbs = require('english-verbs');
const EnglishVerbHelper = require('english-verbs-helper');
var ruDataPromise = (filename, objname) => fetch(`/data/${filename}.csv`).then((r) => r.text()).then((s) => {
    var csvData = papa.parse(s, { header: true, dynamicTyping: true }).data;
    window[objname] = (bare) => {
        var w = csvData.find((k) => k.bare === bare);
        if (w === undefined && objname === "ruNouns")
            w = csvData.find((k) => k.pl_nom.replace("'", "") === bare);
        if (w === undefined)
            console.warn(`Did not find russian word ${bare}`);
        return w;
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
        rels: {},
        guid: getUuid(tr[1])
    };
}
function getPronounFor(n) {
    return getPronoun(n.number, n.person, n.gender, n.animacy);
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
    var decls = ruRecord[col].split(',');
    var ruInfl = "";
    // Male accusative column contains a special animate declension
    if (col === "decl_m_acc") {
        if (inf.animacy === RussianAnimacy.AnimacyAnimate)
            ruInfl = decls.filter((s) => s.endsWith("го"));
        else
            ruInfl = decls.filter((s) => !s.endsWith("го"));
    }
    else {
        ruInfl = decls[0];
    }
    // This may not be correct in all cases, may need to be fixed later
    ruInfl = ruInfl.replace("'", "");
    return [a.enForm, ruInfl];
}
function makeSingularNoun(enForm, ruForm, gdr, animacy, tags = []) {
    // var gender = getRussianGender(ruForm);
    var gender = RussianGender.GenderNeuter;
    if (gdr === "m")
        gender = RussianGender.GenderMale;
    else if (gdr === "f")
        gender = RussianGender.GenderFemale;
    tags.push("singular");
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
    };
}
exports.makeSingularNoun = makeSingularNoun;
function makePluralNoun(enForm, ruForm, gdr, animacy, tags = []) {
    var gender = RussianGender.GenderNeuter;
    if (gdr === "m")
        gender = RussianGender.GenderMale;
    else if (gdr === "f")
        gender = RussianGender.GenderFemale;
    tags.push("plural");
    return {
        enForm: enForm,
        ruForm: ruForm,
        gender: gender,
        number: RussianNumber.NumberPlural,
        person: RussianPerson.Person3rd,
        animacy: animacy ? RussianAnimacy.AnimacyAnimate : RussianAnimacy.AnimacyInanimate,
        rels: {},
        tags: tags,
        guid: getUuid(ruForm)
    };
}
exports.makePluralNoun = makePluralNoun;
function makeIntransVerb(enForm, ruForm, subjTags, tags = [], hint = "") {
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
    };
}
exports.makeIntransVerb = makeIntransVerb;
function makeTransVerb(enForm, ruForm, subjTags, objTags, tags = [], hint = "") {
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
    };
}
exports.makeTransVerb = makeTransVerb;
function makeAdj(enForm, ruForm, nounTags, tags = [], hint = "") {
    return {
        enForm: enForm,
        ruForm: ruForm,
        tags: tags,
        rels: {
            "noun": nounTags
        },
        hint: hint,
        guid: getUuid(ruForm)
    };
}
exports.makeAdj = makeAdj;
function defaultNounInflector() {
    return {
        case: exports.caseNOM
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
        case: exports.caseNOM
    };
}
var EnRuPhraseAxnType;
(function (EnRuPhraseAxnType) {
    EnRuPhraseAxnType[EnRuPhraseAxnType["DupNoun"] = 0] = "DupNoun";
    EnRuPhraseAxnType[EnRuPhraseAxnType["DupVerb"] = 1] = "DupVerb";
    EnRuPhraseAxnType[EnRuPhraseAxnType["DupAdj"] = 2] = "DupAdj";
    EnRuPhraseAxnType[EnRuPhraseAxnType["MakePronoun"] = 3] = "MakePronoun";
    EnRuPhraseAxnType[EnRuPhraseAxnType["RandomPronoun"] = 4] = "RandomPronoun";
    EnRuPhraseAxnType[EnRuPhraseAxnType["DeclineNoun"] = 5] = "DeclineNoun";
    EnRuPhraseAxnType[EnRuPhraseAxnType["ConjugateVerb"] = 6] = "ConjugateVerb";
    EnRuPhraseAxnType[EnRuPhraseAxnType["AgreeVerbWithSubj"] = 7] = "AgreeVerbWithSubj";
    EnRuPhraseAxnType[EnRuPhraseAxnType["AgreeAdjWithNoun"] = 8] = "AgreeAdjWithNoun";
})(EnRuPhraseAxnType || (exports.EnRuPhraseAxnType = EnRuPhraseAxnType = {}));
class EnRuPhraseTpl {
    constructor(wp, subs = []) {
        this.guid = (0, lib_1.guidGenerator)();
        this.picker = wp;
        this.actions = [];
        this.subs = subs;
        this.fmt = ["", ""];
    }
    add(wdType, tags = "", selStrings = "") {
        var tagsList = (tags.length === 0) ? [] : tags.split(',');
        var selList = (selStrings.length === 0) ? [] : selStrings.split(',');
        this.picker.addR(wdType, tagsList, selList);
        return this;
    }
    dupV(id) {
        this.actions.push({
            type: EnRuPhraseAxnType.DupVerb,
            wd1: id
        });
        return this;
    }
    dupN(id) {
        this.actions.push({
            type: EnRuPhraseAxnType.DupNoun,
            wd1: id
        });
        return this;
    }
    dupA(id) {
        this.actions.push({
            type: EnRuPhraseAxnType.DupAdj,
            wd1: id
        });
        return this;
    }
    pron(id) {
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
    decl(id, c) {
        this.actions.push({
            type: EnRuPhraseAxnType.DeclineNoun,
            wd1: id,
            num1: c
        });
        return this;
    }
    conj(id, c) {
        this.actions.push({
            type: EnRuPhraseAxnType.ConjugateVerb,
            wd1: id,
            num1: c
        });
        return this;
    }
    agreeVN(idV, idN) {
        this.actions.push({
            type: EnRuPhraseAxnType.AgreeVerbWithSubj,
            wd1: idV,
            wd2: idN
        });
        return this;
    }
    agreeAN(idA, idN) {
        this.actions.push({
            type: EnRuPhraseAxnType.AgreeAdjWithNoun,
            wd1: idA,
            wd2: idN
        });
        return this;
    }
    format(fmt0, fmt1) {
        this.fmt = [fmt0, fmt1];
        return this;
    }
    runAction(stacks, axn) {
        if (axn.type === EnRuPhraseAxnType.DupNoun) {
            stacks.words["n"].push(stacks.words["n"][axn.wd1]);
            stacks.inflectors["n"].push(stacks.inflectors["n"][axn.wd1]);
            return stacks;
        }
        else if (axn.type === EnRuPhraseAxnType.DupVerb) {
            stacks.words["v"].push(stacks.words["n"][axn.wd1]);
            stacks.inflectors["v"].push(stacks.inflectors["n"][axn.wd1]);
            return stacks;
        }
        else if (axn.type === EnRuPhraseAxnType.DupAdj) {
            stacks.words["a"].push(stacks.words["n"][axn.wd1]);
            stacks.inflectors["a"].push(stacks.inflectors["n"][axn.wd1]);
            return stacks;
        }
        else if (axn.type === EnRuPhraseAxnType.MakePronoun) {
            stacks.words["n"].push(getPronounFor(stacks.words["n"][axn.wd1]));
            stacks.inflectors["n"].push(defaultNounInflector());
            return stacks;
        }
        else if (axn.type === EnRuPhraseAxnType.RandomPronoun) {
            var number = Math.floor(2 * Math.random());
            var person = Math.floor(3 * Math.random());
            var gender = (number === 0 && person == 2) ? Math.floor(3 * Math.random()) : 0;
            var pron = getPronoun(number, person, gender, RussianAnimacy.AnimacyAnimate);
            stacks.words["n"].push(pron);
            stacks.inflectors["n"].push(defaultNounInflector());
            return stacks;
        }
        else if (axn.type === EnRuPhraseAxnType.DeclineNoun) {
            stacks.inflectors["n"][axn.wd1].case = axn.num1;
            return stacks;
        }
        else if (axn.type === EnRuPhraseAxnType.ConjugateVerb) {
            stacks.inflectors["v"][axn.wd1].tense = axn.num1;
            return stacks;
        }
        else if (axn.type === EnRuPhraseAxnType.AgreeVerbWithSubj) {
            var n = stacks.words["n"][axn.wd2];
            var vInf = stacks.inflectors["v"][axn.wd1];
            vInf.number = n.number;
            vInf.person = n.person;
            vInf.gender = n.gender;
            return stacks;
        }
        else if (axn.type === EnRuPhraseAxnType.AgreeAdjWithNoun) {
            var n = stacks.words["n"][axn.wd2];
            var nInf = stacks.inflectors["n"][axn.wd2];
            var aInf = stacks.inflectors["a"][axn.wd1];
            aInf.number = n.number;
            aInf.gender = n.gender;
            aInf.animacy = n.animacy;
            aInf.case = nInf.case;
            return stacks;
        }
        return null;
    }
    next(wc) {
        this.picker.checker = wc;
        var words = this.picker.resolve();
        var stacks = {
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
    gen(stacks) {
        var res = [this.fmt[0].slice(), this.fmt[1].slice()];
        for (var i = 0; i < stacks.words["n"].length; i++) {
            var n = stacks.words["n"][i];
            var nInf = stacks.inflectors["n"][i];
            var nRes = inflectNoun(n, nInf);
            res[0] = res[0].replace(`{n${i}}`, nRes[0]);
            res[1] = res[1].replace(`{n${i}}`, nRes[1]);
        }
        for (var i = 0; i < stacks.words["v"].length; i++) {
            var v = stacks.words["v"][i];
            var vInf = stacks.inflectors["v"][i];
            var vRes = inflectVerb(v, vInf);
            res[0] = res[0].replace(`{v${i}}`, vRes[0]);
            res[1] = res[1].replace(`{v${i}}`, vRes[1]);
        }
        for (var i = 0; i < stacks.words["a"].length; i++) {
            var a = stacks.words["a"][i];
            var aInf = stacks.inflectors["a"][i];
            var aRes = inflectAdj(a, aInf);
            res[0] = res[0].replace(`{a${i}}`, aRes[0]);
            res[1] = res[1].replace(`{a${i}}`, aRes[1]);
        }
        for (var i = 0; i < this.subs.length; i++) { // Postprocessing with provided regexes
            // console.log(this.subs[i]);
            res[0] = res[0].replace(this.subs[i][0], this.subs[i][1]);
            res[1] = res[1].replace(this.subs[i][0], this.subs[i][1]);
        }
        return res;
    }
}
exports.EnRuPhraseTpl = EnRuPhraseTpl;
