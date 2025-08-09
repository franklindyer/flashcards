"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultTextFilterSettings = void 0;
exports.applyTextFilter = applyTextFilter;
exports.textFilterSelectionMenu = textFilterSelectionMenu;
const editor_1 = require("core/editor");
exports.defaultTextFilterSettings = {
    removeParenDelimited: false,
    removeSqDelimited: false,
    noPunctuation: false,
    smartQuotes: false,
    doubleSpaces: false,
    trimSpaces: false,
    nfc: false
};
function filterSmartQuotes(str) {
    return str.replaceAll(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
}
function filterDoubleSpaces(str) {
    return str.replaceAll(/\s+/g, " ");
}
function filterHintParens(str) {
    return str.replaceAll(/\([^\)]*\)/g, "");
}
function filterHintSqs(str) {
    return str.replaceAll(/\[[^\]]*\]/g, "");
}
function filterEndSpaces(str) {
    return str.trim();
}
function filterNFC(str) {
    return str.normalize("NFC");
}
function filterPunctuation(str) {
    return str.replaceAll(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
}
// Replace missing settings in the case of updates
function repairTextFilterSettings(tfs) {
    for (var i in Object.keys(exports.defaultTextFilterSettings)) {
        var k = Object.keys(exports.defaultTextFilterSettings)[i];
        if (!(k in tfs)) {
            tfs[k] = false;
        }
    }
    return tfs;
}
function applyTextFilter(str, tfs) {
    tfs = repairTextFilterSettings(tfs);
    if (tfs.removeParenDelimited)
        str = filterHintParens(str);
    if (tfs.removeSqDelimited)
        str = filterHintSqs(str);
    if (tfs.noPunctuation)
        str = filterPunctuation(str);
    if (tfs.smartQuotes)
        str = filterSmartQuotes(str);
    if (tfs.doubleSpaces)
        str = filterDoubleSpaces(str);
    if (tfs.nfc)
        str = filterNFC(str);
    if (tfs.trimSpaces)
        str = filterEndSpaces(str);
    return str;
}
function textFilterSelectionMenu(tfs) {
    tfs = repairTextFilterSettings(tfs);
    var container = document.createElement("div");
    var accordion = document.createElement("details");
    var accordionSummary = document.createElement("summary");
    accordionSummary.textContent = "Text filter settings";
    accordion.appendChild(accordionSummary);
    container.appendChild(accordion);
    var noPunctuationEd = (0, editor_1.boolEditor)("Ignore punctuation", tfs.noPunctuation);
    var smartQuotesEd = (0, editor_1.boolEditor)("Ignore smart quotes", tfs.smartQuotes);
    var doubleSpacesEd = (0, editor_1.boolEditor)("Ignore multiple spaces", tfs.doubleSpaces);
    var trimSpacesEd = (0, editor_1.boolEditor)("Ignore leading and trailing spaces", tfs.trimSpaces);
    var nfcEd = (0, editor_1.boolEditor)("NFC-normalize unicode text", tfs.nfc);
    var removeParenEd = (0, editor_1.boolEditor)("Ignore substrings enclosed in (parentheses)", tfs.removeParenDelimited);
    var removeSqEd = (0, editor_1.boolEditor)("Ignore substrings enclosed in [square brackets]", tfs.removeSqDelimited);
    [
        noPunctuationEd.element,
        smartQuotesEd.element,
        doubleSpacesEd.element,
        trimSpacesEd.element,
        nfcEd.element,
        removeParenEd.element,
        removeSqEd.element
    ].map((el) => accordion.appendChild(el));
    return {
        element: container,
        menuToState: () => {
            return {
                removeParenDelimited: removeParenEd.menuToState(),
                removeSqDelimited: removeSqEd.menuToState(),
                noPunctuation: noPunctuationEd.menuToState(),
                smartQuotes: smartQuotesEd.menuToState(),
                doubleSpaces: doubleSpacesEd.menuToState(),
                trimSpaces: trimSpacesEd.menuToState(),
                nfc: nfcEd.menuToState()
            };
        }
    };
}
