"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleCardType = exports.FlashcardType = exports.gCardTypeRegistry = void 0;
exports.registerFlashcardType = registerFlashcardType;
const utils_1 = require("utils/utils");
const editor_1 = require("core/editor");
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
        console.log(data);
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
