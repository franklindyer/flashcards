"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultTextFilterSettings = void 0;
exports.applyTextFilter = applyTextFilter;
exports.textFilterSelectionMenu = textFilterSelectionMenu;
const editor_1 = require("./editor");
exports.defaultTextFilterSettings = {
    noPunctuation: false,
    smartQuotes: false,
    doubleSpaces: false,
    nfc: false
};
function filterSmartQuotes(str) {
    return str.replaceAll(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
}
function filterDoubleSpaces(str) {
    return str.replaceAll(/\s+/g, " ");
}
function filterNFC(str) {
    return str.normalize("NFC");
}
function filterPunctuation(str) {
    return str.replaceAll(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
}
function applyTextFilter(str, tfs) {
    if (tfs.noPunctuation)
        str = filterPunctuation(str);
    if (tfs.smartQuotes)
        str = filterSmartQuotes(str);
    if (tfs.doubleSpaces)
        str = filterDoubleSpaces(str);
    if (tfs.nfc)
        str = filterNFC(str);
    return str;
}
function textFilterSelectionMenu(tfs) {
    var container = document.createElement("div");
    var accordion = document.createElement("details");
    var accordionSummary = document.createElement("summary");
    accordionSummary.textContent = "Text filter settings";
    accordion.appendChild(accordionSummary);
    container.appendChild(accordion);
    var noPunctuationEd = (0, editor_1.boolEditor)("Ignore punctuation", tfs.noPunctuation);
    var smartQuotesEd = (0, editor_1.boolEditor)("Ignore smart quotes", tfs.smartQuotes);
    var doubleSpacesEd = (0, editor_1.boolEditor)("Ignore multiple spaces", tfs.doubleSpaces);
    var nfcEd = (0, editor_1.boolEditor)("NFC-normalize unicode text", tfs.nfc);
    [
        noPunctuationEd.element,
        smartQuotesEd.element,
        doubleSpacesEd.element,
        nfcEd.element
    ].map((el) => accordion.appendChild(el));
    return {
        element: container,
        menuToState: () => {
            return {
                noPunctuation: noPunctuationEd.menuToState(),
                smartQuotes: smartQuotesEd.menuToState(),
                doubleSpaces: doubleSpacesEd.menuToState(),
                nfc: nfcEd.menuToState()
            };
        }
    };
}
