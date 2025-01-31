"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnDePhraseTpl = exports.EnDePhraseAxnType = exports.makeIntransVerb = exports.makeSingNoun = void 0;
const lib_1 = require("./lib");
const getUuid = require('uuid-by-string');
const GermanVerbsLib = require('german-verbs');
const GermanVerbsDict = require('german-verbs-dict/dist/verbs.json');
const GermanDets = require('german-determiners');
const GermanWords = require('german-words');
const GermanWordsList = require('german-words-dict/dist/words.json');
const EnglishVerbs = require('english-verbs');
const EnglishVerbHelper = require('english-verbs-helper');
var GermanCase;
(function (GermanCase) {
    GermanCase[GermanCase["NOM"] = 0] = "NOM";
    GermanCase[GermanCase["ACC"] = 1] = "ACC";
    GermanCase[GermanCase["DAT"] = 2] = "DAT";
    GermanCase[GermanCase["GEN"] = 3] = "GEN";
})(GermanCase || (GermanCase = {}));
var GermanGender;
(function (GermanGender) {
    GermanGender[GermanGender["M"] = 0] = "M";
    GermanGender[GermanGender["F"] = 1] = "F";
    GermanGender[GermanGender["N"] = 2] = "N";
})(GermanGender || (GermanGender = {}));
var GermanNumber;
(function (GermanNumber) {
    GermanNumber[GermanNumber["S"] = 0] = "S";
    GermanNumber[GermanNumber["P"] = 1] = "P";
})(GermanNumber || (GermanNumber = {}));
var GermanPerson;
(function (GermanPerson) {
    GermanPerson[GermanPerson["P1"] = 0] = "P1";
    GermanPerson[GermanPerson["P2"] = 1] = "P2";
    GermanPerson[GermanPerson["P3"] = 2] = "P3";
})(GermanPerson || (GermanPerson = {}));
var GermanTense;
(function (GermanTense) {
    GermanTense[GermanTense["INFINITIVE"] = 0] = "INFINITIVE";
    GermanTense[GermanTense["PRESENT"] = 1] = "PRESENT";
    GermanTense[GermanTense["PERFECT"] = 2] = "PERFECT";
    GermanTense[GermanTense["PAST"] = 3] = "PAST";
    GermanTense[GermanTense["PASTPERF"] = 4] = "PASTPERF";
    GermanTense[GermanTense["FUTURE"] = 5] = "FUTURE";
    GermanTense[GermanTense["FUTUREPERF"] = 6] = "FUTUREPERF";
})(GermanTense || (GermanTense = {}));
var GermanStrength;
(function (GermanStrength) {
    GermanStrength[GermanStrength["STRONG"] = 0] = "STRONG";
    GermanStrength[GermanStrength["WEAK"] = 1] = "WEAK";
    GermanStrength[GermanStrength["MIXED"] = 2] = "MIXED";
})(GermanStrength || (GermanStrength = {}));
var GermanDeterminer;
(function (GermanDeterminer) {
    GermanDeterminer[GermanDeterminer["NULL"] = 0] = "NULL";
    GermanDeterminer[GermanDeterminer["DEF"] = 1] = "DEF";
    GermanDeterminer[GermanDeterminer["INDEF"] = 2] = "INDEF";
    GermanDeterminer[GermanDeterminer["NEG"] = 3] = "NEG";
    GermanDeterminer[GermanDeterminer["POSS"] = 4] = "POSS";
    GermanDeterminer[GermanDeterminer["THIS"] = 5] = "THIS";
    GermanDeterminer[GermanDeterminer["THAT"] = 6] = "THAT";
    GermanDeterminer[GermanDeterminer["EVERY"] = 7] = "EVERY";
    GermanDeterminer[GermanDeterminer["MANY"] = 8] = "MANY";
    GermanDeterminer[GermanDeterminer["SOME"] = 9] = "SOME";
    GermanDeterminer[GermanDeterminer["SUCH"] = 10] = "SUCH";
})(GermanDeterminer || (GermanDeterminer = {}));
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
function makeSingNoun(en, de, g, tags, hint = "") {
    tags.push("singular");
    return {
        enForm: en,
        deForm: de,
        tags: tags,
        hint: hint,
        rels: {},
        guid: getUuid(de),
        gender: g,
        number: GermanNumber.S,
        person: GermanPerson.P3
    };
}
exports.makeSingNoun = makeSingNoun;
function makeIntransVerb(en, de, tags, subjTags, hint = "") {
    tags.push("intrans");
    return {
        enForm: en,
        deForm: de,
        tags: tags,
        hint: hint,
        rels: {
            "subj": subjTags
        },
        guid: getUuid(de)
    };
}
exports.makeIntransVerb = makeIntransVerb;
function getRosaeNLGCaseString(c) {
    if (c === GermanCase.NOM)
        return "NOMINATIVE";
    else if (c === GermanCase.ACC)
        return "ACCUSATIVE";
    else if (c === GermanCase.DAT)
        return "DATIVE";
    else
        return "GENITIVE";
}
function getRosaeNLGNumberString(num) {
    if (num === GermanNumber.S)
        return "S";
    else
        return "P";
}
function getRosaeNLGDeterminerString(d) {
    if (d === GermanDeterminer.DEF)
        return 'DEFINITE';
    else if (d === GermanDeterminer.INDEF)
        return 'INDEFINITE';
    else if (d === GermanDeterminer.THIS)
        return 'DEMONSTRATIVE';
    else
        return 'POSSESSIVE';
}
function getEnglishDeterminer(d) {
    if (d === GermanDeterminer.DEF)
        return 'the';
    else if (d === GermanDeterminer.INDEF)
        return 'a';
    else if (d === GermanDeterminer.THIS)
        return 'this';
    else
        return "WAKAWAKA";
}
function getRosaeNLGGenderString(g) {
    if (g === GermanGender.M)
        return "M";
    else if (g === GermanGender.F)
        return "F";
    else
        return "N";
}
function getRosaeNLGTenseString(t) {
    if (t === GermanTense.PRESENT)
        return "PRASENS";
    else if (t === GermanTense.PAST)
        return "PRATERITUM";
    else if (t === GermanTense.PERFECT)
        return "PERFEKT";
    else if (t === GermanTense.PASTPERF)
        return "PLUSQUAMPERFEKT";
    else if (t === GermanTense.FUTURE)
        return "FUTUR1";
    else if (t === GermanTense.FUTUREPERF)
        return "FUTUR2";
    else
        return "";
}
function inflectVerb(v, infl) {
    if (infl.tense === GermanTense.INFINITIVE)
        return [v.enForm, [v.deForm]];
    var tenStr = getRosaeNLGTenseString(infl.tense);
    var psn = 1 + infl.person;
    var numStr = getRosaeNLGNumberString(infl.number);
    return [v.enForm, GermanVerbsLib.getConjugation(GermanVerbsDict, v.deForm, tenStr, psn, numStr)];
}
function getPronoun(p, n, g) {
    return {
        enForm: "PRONOUN",
        deForm: "PRONOUN",
        tags: ["pronoun", "agent"],
        hint: "",
        rels: {},
        guid: (0, lib_1.guidGenerator)(),
        person: p,
        number: n,
        gender: g
    };
}
function inflectNoun(n, infl) {
    if (n.enForm === "PRONOUN") { // Special logic for pronoun inflection
        var ind0 = infl.case;
        var ind1 = 3 * n.number + n.person;
        var ind2 = n.gender;
        return [enPronouns[ind0][ind1][ind2], dePronouns[ind0][ind1][ind2]];
    }
    var caseStr = getRosaeNLGCaseString(infl.case);
    var numStr = getRosaeNLGNumberString(n.number);
    return [n.enForm, GermanWords.getCaseGermanWord(null, GermanWordsList, n.deForm, caseStr, numStr)];
}
function inflectDet(d, infl) {
    var enForm = getEnglishDeterminer(d.det);
    var detStr = getRosaeNLGDeterminerString(d.det);
    var caseStr = getRosaeNLGCaseString(infl.case);
    var gdrStr = getRosaeNLGGenderString(infl.gender);
    var nbrStr = getRosaeNLGNumberString(infl.number);
    var ownGdrStr = (infl.ownerGender === undefined) ? null : getRosaeNLGGenderString(infl.ownerGender);
    var ownNbrStr = (infl.ownerNumber === undefined) ? null : getRosaeNLGNumberString(infl.ownerNumber);
    // 1st and 2nd person possessive determiners are not yet supported
    return [enForm, GermanDets.getDet(detStr, caseStr, ownGdrStr, ownNbrStr, gdrStr, nbrStr)];
}
function inflectAdj(a, infl) {
    return null;
}
function defaultNounInflector() {
    return {
        case: GermanCase.NOM
    };
}
function defaultVerbInflector() {
    return {
        number: GermanNumber.S,
        person: GermanPerson.P3,
        tense: GermanTense.PRESENT
    };
}
function defaultAdjInflector() {
    return null;
}
function defaultDetInflector() {
    return {
        case: GermanCase.NOM,
        gender: GermanGender.N,
        number: GermanNumber.S,
        ownerGender: GermanGender.N,
        ownerNumber: GermanNumber.S
    };
}
// NEED FUNCTIONS FOR MAKING NOUNS, VERBS, DETS and ADJS
var EnDePhraseAxnType;
(function (EnDePhraseAxnType) {
    EnDePhraseAxnType[EnDePhraseAxnType["DupNoun"] = 0] = "DupNoun";
    EnDePhraseAxnType[EnDePhraseAxnType["DupVerb"] = 1] = "DupVerb";
    EnDePhraseAxnType[EnDePhraseAxnType["DupAdj"] = 2] = "DupAdj";
    EnDePhraseAxnType[EnDePhraseAxnType["DupDet"] = 3] = "DupDet";
    EnDePhraseAxnType[EnDePhraseAxnType["MakePronoun"] = 4] = "MakePronoun";
    EnDePhraseAxnType[EnDePhraseAxnType["MakeDet"] = 5] = "MakeDet";
    EnDePhraseAxnType[EnDePhraseAxnType["RandomPronoun"] = 6] = "RandomPronoun";
    EnDePhraseAxnType[EnDePhraseAxnType["DeclineNoun"] = 7] = "DeclineNoun";
    EnDePhraseAxnType[EnDePhraseAxnType["DeclineDet"] = 8] = "DeclineDet";
    EnDePhraseAxnType[EnDePhraseAxnType["ConjugateVerb"] = 9] = "ConjugateVerb";
    EnDePhraseAxnType[EnDePhraseAxnType["AgreeVerbWithSubj"] = 10] = "AgreeVerbWithSubj";
    EnDePhraseAxnType[EnDePhraseAxnType["AgreeAdjWithNounDet"] = 11] = "AgreeAdjWithNounDet";
})(EnDePhraseAxnType || (exports.EnDePhraseAxnType = EnDePhraseAxnType = {}));
class EnDePhraseTpl {
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
            type: EnDePhraseAxnType.DupVerb,
            wd1: id
        });
        return this;
    }
    dupD(id) {
        this.actions.push({
            type: EnDePhraseAxnType.DupDet,
            wd1: id
        });
        return this;
    }
    dupN(id) {
        this.actions.push({
            type: EnDePhraseAxnType.DupNoun,
            wd1: id
        });
        return this;
    }
    dupA(id) {
        this.actions.push({
            type: EnDePhraseAxnType.DupAdj,
            wd1: id
        });
        return this;
    }
    pron(id) {
        this.actions.push({
            type: EnDePhraseAxnType.MakePronoun,
            wd1: id
        });
        return this;
    }
    det(id, dType, ownerId) {
        this.actions.push({
            type: EnDePhraseAxnType.MakeDet,
            wd1: id,
            wd2: ownerId,
            num1: dType
        });
        return this;
    }
    rpron(n) {
        this.actions.push({
            type: EnDePhraseAxnType.RandomPronoun,
            num1: n
        });
        return this;
    }
    declN(id, c) {
        this.actions.push({
            type: EnDePhraseAxnType.DeclineNoun,
            wd1: id,
            num1: c
        });
        return this;
    }
    declD(id, c) {
        this.actions.push({
            type: EnDePhraseAxnType.DeclineDet,
            wd1: id,
            num1: c
        });
        return this;
    }
    conj(id, t) {
        this.actions.push({
            type: EnDePhraseAxnType.ConjugateVerb,
            wd1: id,
            num1: t
        });
        return this;
    }
    agreeVN(idV, idN) {
        this.actions.push({
            type: EnDePhraseAxnType.AgreeVerbWithSubj,
            wd1: idV,
            wd2: idN
        });
        return this;
    }
    agreeAN(idV, idN, idD) {
        this.actions.push({
            type: EnDePhraseAxnType.AgreeVerbWithSubj,
            wd1: idV,
            wd2: idN,
            wd3: idD
        });
        return this;
    }
    format(fmt0, fmt1) {
        this.fmt = [fmt0, fmt1];
        return this;
    }
    runAction(stacks, axn) {
        if (axn.type === EnDePhraseAxnType.DupNoun) {
            stacks.words["n"].push(stacks.words["n"][axn.wd1]);
            stacks.inflectors["n"].push(stacks.inflectors["n"][axn.wd1]);
            return stacks;
        }
        else if (axn.type === EnDePhraseAxnType.DupVerb) {
            stacks.words["v"].push(stacks.words["v"][axn.wd1]);
            stacks.inflectors["v"].push(stacks.inflectors["v"][axn.wd1]);
            return stacks;
        }
        else if (axn.type === EnDePhraseAxnType.DupDet) {
            stacks.words["d"].push(stacks.words["d"][axn.wd1]);
            stacks.inflectors["d"].push(stacks.inflectors["d"][axn.wd1]);
            return stacks;
        }
        else if (axn.type === EnDePhraseAxnType.DupAdj) {
            stacks.words["a"].push(stacks.words["a"][axn.wd1]);
            stacks.inflectors["a"].push(stacks.inflectors["a"][axn.wd1]);
            return stacks;
        }
        else if (axn.type === EnDePhraseAxnType.MakePronoun) {
            var n = stacks.words["n"][axn.wd1];
            var pron = getPronoun(n.person, n.number, n.gender);
            stacks.words["n"].push(pron);
            stacks.inflectors["n"].push(defaultNounInflector());
            return stacks;
        }
        else if (axn.type === EnDePhraseAxnType.MakeDet) {
            var n = stacks.words["n"][axn.wd1];
            var nInfl = stacks.inflectors["n"][axn.wd1];
            var owner = (axn.wd2 === undefined) ? undefined : stacks.words["n"][axn.wd2];
            var gOwner = (owner === undefined) ? undefined : owner.gender;
            var pOwner = (owner === undefined) ? undefined : owner.person;
            var nOwner = (owner === undefined) ? undefined : owner.number;
            var d = {
                det: axn.num1,
                tags: [],
                rels: {},
                guid: (0, lib_1.guidGenerator)()
            };
            var dInfl = {
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
        }
        else if (axn.type === EnDePhraseAxnType.RandomPronoun) {
            var number = (axn.num1 === undefined) ? Math.floor(2 * Math.random()) : axn.num1;
            var person = Math.floor(3 * Math.random());
            var gender = (number === 0 && person === 2) ? Math.floor(3 * Math.random()) : 0;
            var pron = getPronoun(person, number, gender);
            stacks.words["n"].push(pron);
            stacks.inflectors["n"].push(defaultNounInflector());
            return stacks;
        }
        else if (axn.type === EnDePhraseAxnType.DeclineNoun) {
            stacks.inflectors["n"][axn.wd1].case = axn.num1;
            return stacks;
        }
        else if (axn.type === EnDePhraseAxnType.DeclineDet) {
            stacks.inflectors["d"][axn.wd1].case = axn.num1;
            return stacks;
        }
        else if (axn.type === EnDePhraseAxnType.ConjugateVerb) {
            stacks.inflectors["v"][axn.wd1].tense = axn.num1;
            return stacks;
        }
        else if (axn.type === EnDePhraseAxnType.AgreeVerbWithSubj) {
            var n = stacks.words["n"][axn.wd2];
            var vInf = stacks.inflectors["v"][axn.wd1];
            vInf.number = n.number;
            vInf.person = n.person;
            return stacks;
        }
        else if (axn.type === EnDePhraseAxnType.AgreeAdjWithNounDet) {
            // Will implement later!
            return null;
        }
        return stacks;
    }
    next(wc) {
        this.picker.checker = wc;
        var words = this.picker.resolve();
        var stacks = {
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
            for (var j = 0; j < vRes[1].length; j++) { // Verb conjugations in German can be multi-word
                res[1] = res[1].replace(`{v${i}.${j}}`, vRes[1][j]);
            }
        }
        for (var i = 0; i < stacks.words["a"].length; i++) {
            var a = stacks.words["a"][i];
            var aInf = stacks.inflectors["a"][i];
            var aRes = inflectAdj(a, aInf);
            res[0] = res[0].replace(`{a${i}}`, aRes[0]);
            res[1] = res[1].replace(`{a${i}}`, aRes[1]);
        }
        for (var i = 0; i < stacks.words["d"].length; i++) {
            var d = stacks.words["d"][i];
            var dInf = stacks.inflectors["d"][i];
            var dRes = inflectDet(d, dInf);
            res[0] = res[0].replace(`{d${i}}`, dRes[0]);
            res[1] = res[1].replace(`{d${i}}`, dRes[1]);
        }
        for (var i = 0; i < this.subs.length; i++) {
            res[0] = res[0].replace(this.subs[i][0], this.subs[i][1]);
            res[1] = res[1].replace(this.subs[i][1], this.subs[i][1]);
        }
        return res;
    }
}
exports.EnDePhraseTpl = EnDePhraseTpl;
