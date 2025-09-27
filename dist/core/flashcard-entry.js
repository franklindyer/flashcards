"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClozeCardType = exports.SimpleCardType = exports.FlashcardType = exports.gCardTypeRegistry = void 0;
exports.registerFlashcardType = registerFlashcardType;
const utils_1 = require("utils/utils");
const editor_1 = require("core/editor");
const flashcard_template_1 = require("core/flashcard-template");
const generic_preloader_1 = require("utils/generic-preloader");
const flashcard_1 = require("core/flashcard");
exports.gCardTypeRegistry = {};
class FlashcardType {
    getTypeName() {
        throw new Error("getTypeName not implemented!");
    }
    getUserFriendlyName() {
        throw new Error("getUserFriendlyName not implemented!");
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
    // abstract processEntry(entry: E, settings: S): Promise<D>;
    processEntry(entry, settings) {
        return (0, utils_1.trivialPromise)({
            prompt: entry.prompt,
            answer: entry.answer,
            reversed: entry.twoSided && (Math.random() < 0.5)
        });
    }
    // abstract getSearchableText(entry: E): string;
    getSearchableText(entry) {
        return entry.prompt.join(" ").concat(entry.answer.join(" "));
    }
    // abstract generateCard(data: D, settings: S): Flashcard;
    generateCard(data, settings) {
        var a = document.createElement("div");
        var prompt = "";
        var answers = [];
        var hint = "";
        if (!data.reversed) {
            prompt = data.prompt[0];
            answers = data.answer;
            hint = data.answer[0];
        }
        else {
            prompt = data.answer[0];
            answers = data.prompt;
            hint = data.prompt[0];
        }
        var fontSize = 100.0 / (10.0 * Math.log(10 + prompt.length));
        a.style.fontSize = `${fontSize}vw`;
        a.textContent = prompt;
        return new flashcard_1.Flashcard(a, hint);
    }
    // abstract checkAnswer(answer: string, data: D, settings: S): Promise<boolean>;
    checkAnswer(answer, data, settings, tf) {
        return (0, utils_1.trivialPromise)(data.answer.map(tf).includes(tf(answer)));
    }
    // abstract makeEntryEditor(entry: E): StateEditor<E>;
    makeEntryEditor(entry) {
        var edDetails = document.createElement("details");
        var edSummary = document.createElement("summary");
        edDetails.style.display = "inline-block";
        edDetails.appendChild(edSummary);
        edDetails.classList.add("cardlist-accordion");
        edDetails.onkeyup = function (e) {
            if (e.keyCode == 32) {
                e.preventDefault();
            }
        };
        var edMain = (0, editor_1.swappingTextEditor)([entry.prompt.join('|'), entry.answer.join('|')]);
        edMain.element.style.display = "inline-block";
        edSummary.appendChild(edMain.element);
        var twoSideEd = (0, editor_1.boolEditor)("Double-sided card?", entry.twoSided);
        edDetails.appendChild(twoSideEd.element);
        return {
            element: edDetails,
            menuToState: () => {
                let tp = edMain.menuToState();
                return {
                    prompt: tp[0].split('|'),
                    answer: tp[1].split('|'),
                    twoSided: twoSideEd.menuToState()
                };
            }
        };
    }
    // abstract makeSettingsEditor(settings: S): StateEditor<S>;
    makeSettingsEditor(settings) {
        var contDiv = document.createElement("div");
        var twoSidedEditor = (0, editor_1.boolEditor)("Study both sides of two-sided cards?", settings.doTwoSided);
        var twoSidedCont = document.createElement("div");
        twoSidedCont.appendChild(twoSidedEditor.element);
        contDiv.appendChild(twoSidedCont);
        return {
            element: contDiv,
            menuToState: () => {
                return {
                    doTwoSided: twoSidedEditor.menuToState()
                };
            }
        };
    }
    // abstract getDefaultEntry(): E;
    getDefaultEntry() {
        return {
            prompt: [],
            answer: [],
            twoSided: false
        };
    }
    // abstract getDefaultSettings(): S;
    getDefaultSettings() {
        return {
            doTwoSided: true
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
            "n": this.cache.numPreload.toString()
        }).toString()).then((r) => r.json()).catch((e) => undefined);
    }
    // abstract preprocessEntry(entry: E, settings: S): void;
    preprocessEntry(entry, settings) {
        this.cache.addKey(entry.key, (k) => this.fetchCloze(entry.key, settings));
    }
    // abstract processEntry(entry: E, settings: S): Promise<D>;
    processEntry(entry, settings) {
        return this.cache.getKey(entry.key, (k) => this.fetchCloze(entry.key, settings)).then((j) => {
            if (j === undefined) {
                return { valid: false, key: entry.key };
            }
            return {
                key: entry.key,
                valid: true,
                cloze: {
                    prompt: j["puzzle"],
                    answer: j["target"],
                    translation: j["source"],
                    group: j["group"]
                }
            };
        }).catch((e) => {
            return { valid: false, key: entry.key };
        });
    }
    // abstract getSearchableText(entry: E): string;
    getSearchableText(entry) {
        return entry.key;
    }
    // abstract generateCard(data: D, settings: S): Flashcard;
    generateCard(data, settings) {
        if (!data.valid) {
            return (0, flashcard_template_1.renderCard)("noanswer-template", `Could not get puzzle for card "${data.key}".`);
        }
        var fl = (0, flashcard_template_1.renderCard)("cloze-template", {
            group: data.cloze.group,
            guid: "",
            upper: data.cloze.prompt,
            lower: data.cloze.translation
        });
        return fl;
    }
    // abstract checkAnswer(answer: string, data: D, settings: S, tf: (s: string) => string): Promise<boolean>;
    checkAnswer(answer, data, settings, tf) {
        return (0, utils_1.trivialPromise)(data.valid && tf(answer) == tf(data.cloze.answer));
    }
    // abstract makeEntryEditor(entry: E): StateEditor<E>;
    makeEntryEditor(entry) {
        var edCont = document.createElement("div");
        var keyEd = (0, editor_1.singleTextFieldEditor)(entry.key);
        keyEd.element.style.display = "inline-block";
        edCont.appendChild(keyEd.element);
        return {
            element: edCont,
            menuToState: () => {
                return {
                    key: keyEd.menuToState()
                };
            }
        };
    }
    // abstract makeSettingsEditor(settings: S): StateEditor<S>;
    makeSettingsEditor(settings) {
        var clozeServerDiv = document.createElement("div");
        clozeServerDiv.classList.add("deck-menu-submenu");
        var clozeServerUrlEditor = (0, editor_1.singleTextFieldEditor)(settings.clozeServerUrl);
        var clozeSourceLangEditor = (0, editor_1.singleTextFieldEditor)(settings.sourceLangs.join(','));
        var clozeTargetLangEditor = (0, editor_1.singleTextFieldEditor)(settings.targetLang);
        var clozeGroupsEditor = (0, editor_1.singleTextFieldEditor)(settings.clozeGroups.join(','));
        clozeGroupsEditor.element.placeholder = "allowed groups...";
        clozeServerDiv.appendChild(clozeServerUrlEditor.element);
        clozeServerDiv.appendChild(clozeSourceLangEditor.element);
        clozeServerDiv.appendChild(clozeTargetLangEditor.element);
        clozeServerDiv.appendChild(clozeGroupsEditor.element);
        return {
            element: clozeServerDiv,
            menuToState: () => {
                return {
                    clozeServerUrl: clozeServerUrlEditor.menuToState(),
                    sourceLangs: clozeSourceLangEditor.menuToState().split(','),
                    targetLang: clozeTargetLangEditor.menuToState(),
                    clozeGroups: clozeGroupsEditor.menuToState().split(',').filter((g) => g.length > 0)
                };
            }
        };
    }
    // abstract getDefaultEntry(): E;
    getDefaultEntry() {
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
            clozeGroups: []
        };
    }
}
exports.ClozeCardType = ClozeCardType;
registerFlashcardType(new ClozeCardType());
