"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiSidedCardType = exports.MultiSidedCardQStyle = exports.ClozeCardType = exports.SimpleCardType = exports.FlashcardType = exports.gCardTypeRegistry = void 0;
exports.registerFlashcardType = registerFlashcardType;
const utils_1 = require("utils/utils");
const random_templating_1 = require("utils/random-templating");
const generic_preloader_1 = require("utils/generic-preloader");
const speech_1 = require("utils/speech");
const flashcard_1 = require("core/flashcard");
const nunjucks_1 = require("nunjucks");
const nj_templates_1 = require("utils/nj-templates");
exports.gCardTypeRegistry = {};
class FlashcardType {
    getTypeName() {
        throw new Error("getTypeName not implemented!");
    }
    getUserFriendlyName() {
        throw new Error("getUserFriendlyName not implemented!");
    }
    getMaybeSetting(key, settings) {
        if (key in settings) {
            return settings[key];
        }
        else {
            return null;
        }
    }
    speakCard(data, settings, resolve) {
        var ss = this.getMaybeSetting("speechSettings", settings);
        if (ss == null) {
            console.log("SPEECH SETTINGS NOT FOUND");
            resolve();
        }
        else {
            (0, speech_1.utter)(this.getSpeakableText(data), ss.voice, ss.rate, ss.pitch, resolve);
        }
    }
}
exports.FlashcardType = FlashcardType;
function registerFlashcardType(ft) {
    exports.gCardTypeRegistry[ft.getTypeName()] = ft;
}
class SimpleCardType extends FlashcardType {
    getTypeName() {
        return "simple-card";
    }
    getUserFriendlyName() {
        return "Simple two-sided flashcards";
    }
    // abstract preprocessEntry(entry: E, settings: S): void;
    preprocessEntry(entry, settings) {
        return;
    }
    // abstract processEntry(entry: E, settings: S, context: any): Promise<D>;
    processEntry(entry, settings, context) {
        var preventReversedCard = context.preventReversedCard;
        var canBeReversed = !preventReversedCard && entry.twoSided && settings.doTwoSided;
        var reversed = canBeReversed && (Math.random() < settings.probReversed);
        var canBeSpoken = settings.doReadAloud && entry.readAloud;
        var spoken = reversed && canBeSpoken && (Math.random() < settings.probSpoken);
        var subber = (0, utils_1.makeSubber)(settings.substitutions);
        var tpPrompt = [];
        var tpAnswers = [];
        var ctx = {};
        for (var i in Object.keys(entry.prompt)) {
            var res = (0, random_templating_1.randomizeStringSub)(subber(entry.prompt[i]), ctx);
            ctx = res[1];
            tpPrompt.push(res[0]);
        }
        for (var i in Object.keys(entry.answer)) {
            var res = (0, random_templating_1.randomizeStringSub)(subber(entry.answer[i]), ctx);
            ctx = res[1];
            tpAnswers.push(res[0]);
        }
        return (0, utils_1.trivialPromise)({
            prompt: reversed ? tpAnswers : tpPrompt,
            answer: reversed ? tpPrompt : tpAnswers,
            reversed: reversed,
            spoken: spoken
        });
    }
    // abstract getSearchableText(entry: E): string;
    getSearchableText(entry) {
        return entry.prompt.join(" ").concat(entry.answer.join(" "));
    }
    // abstract getSpeakableText(data: D): string;
    getSpeakableText(data) {
        if (data.reversed)
            return data.prompt[0];
        else
            return data.answer[0];
    }
    // abstract generateCard(data: D, settings: S, externalParams: IDictionary<any>): Flashcard;
    generateCard(data, settings, externalParams = {}) {
        var a = document.createElement("div");
        var prompt = "";
        var answers = [];
        var hint = "";
        prompt = data.prompt[0];
        answers = data.answer;
        hint = data.answer.join(' | ');
        var fontSize = 100.0 / (10.0 * Math.log(10 + prompt.length));
        var templateArgs = {
            prompts: data.prompt,
            fontSize: fontSize,
            reversed: data.reversed,
            spoken: data.spoken
        };
        templateArgs = Object.assign({}, templateArgs, externalParams);
        var tpl = settings.template;
        var el = (new DOMParser().parseFromString((0, nunjucks_1.renderString)(tpl, templateArgs), "text/html").body.firstChild);
        el = (0, speech_1.makeAudioButtons)(el, settings.speechSettings);
        return new flashcard_1.Flashcard(el, hint);
    }
    // abstract checkAnswer(answer: string, data: D, settings: S): Promise<boolean>;
    checkAnswer(answer, data, settings, tf) {
        return (0, utils_1.trivialPromise)(data.answer.map(tf).includes(tf(answer)));
    }
    // abstract getDefaultEntry(settings?: S): E;
    getDefaultEntry(settings) {
        return {
            prompt: [],
            answer: [],
            twoSided: false,
            readAloud: false
        };
    }
    // abstract getDefaultSettings(): S;
    getDefaultSettings() {
        return {
            doTwoSided: true,
            doReadAloud: true,
            probReversed: 0.5,
            probSpoken: 0.5,
            speechSettings: (0, speech_1.defaultSpeechSettings)(),
            substitutions: [],
            template: nj_templates_1.njSimpleCard
        };
    }
}
exports.SimpleCardType = SimpleCardType;
registerFlashcardType(new SimpleCardType());
class ClozeCardType extends FlashcardType {
    getTypeName() {
        return "cloze-card";
    }
    getUserFriendlyName() {
        return "Cloze puzzle cards";
    }
    cache = new generic_preloader_1.Preloader(10);
    fetchCloze(key, settings) {
        return fetch(`${settings.clozeServerUrl}/cloze?` + new URLSearchParams({
            "srcs": settings.sourceLangs.join(","),
            "groups": settings.clozeGroups.join(","),
            "tgt": settings.targetLang,
            "lemma": key,
            "n": this.cache.numPreload.toString(),
            "maxlen": settings.maxLength.toString()
        }).toString()).then((r) => r.json()).catch((e) => undefined);
    }
    // abstract preprocessEntry(entry: E, settings: S): void;
    preprocessEntry(entry, settings) {
        entry.key.split("|").forEach((key) => {
            this.cache.addKey(key, (k) => this.fetchCloze(key, settings));
        });
    }
    // abstract processEntry(entry: E, settings: S, context: any): Promise<D>;
    processEntry(entry, settings, context) {
        var keys = entry.key.split("|");
        var keyInd = Math.floor(Math.random() * keys.length); // Uniform choice among keys
        var key = keys[keyInd];
        return this.cache.getKey(key, (k) => this.fetchCloze(key, settings)).then((j) => {
            if (j === undefined) {
                return { valid: false, key: key };
            }
            var goalWords = [];
            j["puzzle"].match(/\{\{([^\{\}]+)\}\}/g).forEach((m) => {
                goalWords.push(m.slice(2, -2));
            });
            var shortAnswer1 = goalWords.join(" ");
            var shortAnswer2 = goalWords.join(", ");
            return {
                key: key,
                valid: true,
                cloze: {
                    prompt: j["puzzle"],
                    answers: [shortAnswer1, shortAnswer2, j["target"]],
                    translation: j["source"],
                    group: j["group"]
                }
            };
        }).catch((e) => {
            return { valid: false, key: key };
        });
    }
    // abstract getSearchableText(entry: E): string;
    getSearchableText(entry) {
        return entry.key;
    }
    // abstract getSpeakableText(data: D): string;
    getSpeakableText(data) {
        if (data.valid)
            return data.cloze.answers.at(-1);
        else
            return "";
    }
    // abstract generateCard(data: D, settings: S, externalParams: IDictionary<any>): Flashcard;
    generateCard(data, settings, externalParams = {}) {
        if (!data.valid) {
        }
        var fontSize = 20;
        var prompt = "";
        if (data.valid) {
            var fontSize = 900.0 / (10.0 * Math.log(10 + data.cloze.prompt.length));
            prompt = data.cloze.prompt.replaceAll(/\{\{([^\{\}]+)\}\}/g, "___");
        }
        var templateArgs = {
            key: data.key,
            puzzleFound: data.valid,
            prompt: prompt,
            translation: data.valid ? data.cloze.translation : undefined,
            source: data.valid ? data.cloze.group : undefined,
            fontSize: fontSize,
        };
        templateArgs = Object.assign({}, templateArgs, externalParams);
        var tpl = settings.template;
        var el = (new DOMParser().parseFromString((0, nunjucks_1.renderString)(tpl, templateArgs), "text/html").body.firstChild);
        return new flashcard_1.Flashcard(el, data.valid ? data.cloze.answers[0] : "no answer, press up or down arrow to skip");
    }
    // abstract checkAnswer(answer: string, data: D, settings: S, tf: (s: string) => string): Promise<boolean>;
    checkAnswer(answer, data, settings, tf) {
        return (0, utils_1.trivialPromise)(data.valid && data.cloze.answers.map(tf).includes(tf(answer)));
    }
    // abstract getDefaultEntry(settings?: S): E;
    getDefaultEntry(settings) {
        return {
            key: ""
        };
    }
    // abstract getDefaultSettings(): S;
    getDefaultSettings() {
        return {
            clozeServerUrl: "",
            sourceLangs: [],
            targetLang: "",
            clozeGroups: [],
            maxLength: 150,
            speechSettings: (0, speech_1.defaultSpeechSettings)(),
            template: nj_templates_1.njClozeCard
        };
    }
}
exports.ClozeCardType = ClozeCardType;
registerFlashcardType(new ClozeCardType());
var MultiSidedCardQStyle;
(function (MultiSidedCardQStyle) {
    MultiSidedCardQStyle[MultiSidedCardQStyle["AllowAnySide"] = 1] = "AllowAnySide";
    MultiSidedCardQStyle[MultiSidedCardQStyle["AskRandomSide"] = 2] = "AskRandomSide";
    MultiSidedCardQStyle[MultiSidedCardQStyle["AskAllSides"] = 3] = "AskAllSides";
    MultiSidedCardQStyle[MultiSidedCardQStyle["AskOneSideGivenAllOthers"] = 4] = "AskOneSideGivenAllOthers"; // Given all sides but one, provide the missing side
})(MultiSidedCardQStyle || (exports.MultiSidedCardQStyle = MultiSidedCardQStyle = {}));
class MultiSidedCardType extends FlashcardType {
    getTypeName() {
        return "multi-sided-card";
    }
    getUserFriendlyName() {
        return "Multi-sided flashcards";
    }
    // abstract preprocessEntry(entry: E, settings: S): void;
    preprocessEntry(entry, settings) { }
    // abstract processEntry(entry: E, settings: S, context: any): Promise<D>;
    processEntry(entry, settings, context) {
        var n = entry.sides.length;
        var chosenSides = [];
        var availableSides = [...new Array(n).keys()];
        var k = 1;
        if (settings.quizzingStyle == MultiSidedCardQStyle.AskOneSideGivenAllOthers) {
            k = n - 1;
        }
        for (var i = 0; i < k; i++) {
            var ind = Math.floor(Math.random() * availableSides.length);
            ind = availableSides[ind];
            chosenSides.push(ind);
            availableSides = [...availableSides.filter((j) => j != ind)];
        }
        if (settings.quizzingStyle === MultiSidedCardQStyle.AskRandomSide) {
            var ind = Math.floor(Math.random() * availableSides.length);
            ind = availableSides[ind];
            availableSides = [ind];
        }
        var prompts = [...chosenSides.map((ind) => entry.sides[ind].split("|")[0])];
        var promptNames = [...chosenSides.map((ind) => settings.sideNames[ind])];
        var answers = [...availableSides.map((ind) => entry.sides[ind].split("|"))];
        var answerNames = [...availableSides.map((ind) => settings.sideNames[ind])];
        var res = {
            prompts: prompts,
            promptNames: promptNames,
            answers: answers,
            answersNames: answerNames,
            spokenText: entry.sides[settings.speakableSide],
            allAnswersRequired: settings.quizzingStyle !== MultiSidedCardQStyle.AllowAnySide
        };
        return (0, utils_1.trivialPromise)(res);
    }
    // abstract getSearchableText(entry: E): string;
    getSearchableText(entry) {
        return entry.sides.join(" ");
    }
    // abstract getSpeakableText(data: D): string;
    getSpeakableText(data) {
        return data.spokenText;
    }
    // abstract generateCard(data: D, settings: S, externalParams: IDictionary<any>): Flashcard;
    generateCard(data, settings, externalParams) {
        var templateArgs = {
            fontSize: 25
        };
        templateArgs = Object.assign({}, templateArgs, data, externalParams);
        var tpl = settings.template;
        var el = (new DOMParser().parseFromString((0, nunjucks_1.renderString)(tpl, templateArgs), "text/html").body.firstChild);
        return new flashcard_1.Flashcard(el, data.answers.map((a) => a[0]).join(", "));
    }
    // abstract checkAnswer(answer: string, data: D, settings: S, tf: (s: string) => string): Promise<boolean>;
    checkAnswer(answer, data, settings, tf) {
        var answerParts = answer.split(",");
        if (answerParts.length < data.answers.length) {
            return (0, utils_1.trivialPromise)(false);
        }
        for (var i = 0; i < data.answers.length; i++) {
            if (!data.answers[i].map(tf).includes(tf(answerParts[i]))) {
                return (0, utils_1.trivialPromise)(false);
            }
        }
        return (0, utils_1.trivialPromise)(true);
    }
    // abstract getDefaultEntry(settings?: S): E;
    getDefaultEntry(settings) {
        return {
            "sides": ["", ""]
        };
    }
    // abstract getDefaultSettings(): S;
    getDefaultSettings() {
        return {
            sideNames: ["first side", "second side"],
            speakableSide: 0,
            quizzingStyle: MultiSidedCardQStyle.AskAllSides,
            speechSettings: (0, speech_1.defaultSpeechSettings)(),
            template: nj_templates_1.njMultiSidedCard
        };
    }
}
exports.MultiSidedCardType = MultiSidedCardType;
registerFlashcardType(new MultiSidedCardType());
