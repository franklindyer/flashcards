import {
    StateEditor,
    boolEditor
} from "./editor"

export type TextFilterSettings = {
    removeParenDelimited: boolean,
    removeSqDelimited: boolean,
    noPunctuation: boolean,
    smartQuotes: boolean,
    doubleSpaces: boolean,
    trimSpaces: boolean,
    nfc: boolean
};

export const defaultTextFilterSettings = {
    removeParenDelimited: false,
    removeSqDelimited: false,
    noPunctuation: false,
    smartQuotes: false,
    doubleSpaces: false,
    trimSpaces: false,
    nfc: false
};

function filterSmartQuotes(str: string) {
    return str.replaceAll(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
}

function filterDoubleSpaces(str: string) {
    return str.replaceAll(/\s+/g, " ");
}

function filterHintParens(str: string) {
    return str.replaceAll(/\([^\)]*\)/g, "");
}

function filterHintSqs(str: string) {
    return str.replaceAll(/\[[^\]]*\]/g, "");
}

function filterEndSpaces(str: string) {
    return str.trim();
}

function filterNFC(str: string) {
    return str.normalize("NFC");
}

function filterPunctuation(str: string) {
    return str.replaceAll(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
}

// Replace missing settings in the case of updates
function repairTextFilterSettings(tfs: any): TextFilterSettings {
    for (var i in Object.keys(defaultTextFilterSettings)) {
        var k = Object.keys(defaultTextFilterSettings)[i];
        if (!(k in tfs)) {
            tfs[k] = false;
        }
    }
    return <TextFilterSettings>tfs;
}

export function applyTextFilter(str: string, tfs: TextFilterSettings) {
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

export function textFilterSelectionMenu(tfs: TextFilterSettings): StateEditor<TextFilterSettings> {
    tfs = repairTextFilterSettings(tfs);
    
    var container = document.createElement("div");
    var accordion = document.createElement("details");
    var accordionSummary = document.createElement("summary");
    accordionSummary.textContent = "Text filter settings";
    accordion.appendChild(accordionSummary);
    container.appendChild(accordion);
    
    var noPunctuationEd = boolEditor("Ignore punctuation", tfs.noPunctuation);
    var smartQuotesEd = boolEditor("Ignore smart quotes", tfs.smartQuotes);
    var doubleSpacesEd = boolEditor("Ignore multiple spaces", tfs.doubleSpaces);
    var trimSpacesEd = boolEditor("Ignore leading and trailing spaces", tfs.trimSpaces);
    var nfcEd = boolEditor("NFC-normalize unicode text", tfs.nfc);
    var removeParenEd = boolEditor("Ignore substrings enclosed in (parentheses)", tfs.removeParenDelimited);
    var removeSqEd = boolEditor("Ignore substrings enclosed in [square brackets]", tfs.removeSqDelimited);

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
