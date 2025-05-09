import {
    StateEditor,
    boolEditor
} from "./editor"

export type TextFilterSettings = {
    noPunctuation: boolean,
    smartQuotes: boolean,
    doubleSpaces: boolean,
    nfc: boolean
};

export const defaultTextFilterSettings = {
    noPunctuation: false,
    smartQuotes: false,
    doubleSpaces: false,
    nfc: false
};

function filterSmartQuotes(str: string) {
    return str.replaceAll(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
}

function filterDoubleSpaces(str: string) {
    return str.replaceAll(/\s+/g, " ");
}

function filterNFC(str: string) {
    return str.normalize("NFC");
}

function filterPunctuation(str: string) {
    return str.replaceAll(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
}

export function applyTextFilter(str: string, tfs: TextFilterSettings) {
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

export function textFilterSelectionMenu(tfs: TextFilterSettings): StateEditor<TextFilterSettings> {
    var container = document.createElement("div");
    var accordion = document.createElement("details");
    var accordionSummary = document.createElement("summary");
    accordionSummary.textContent = "Text filter settings";
    accordion.appendChild(accordionSummary);
    container.appendChild(accordion);
    
    var noPunctuationEd = boolEditor("Ignore punctuation", tfs.noPunctuation);
    var smartQuotesEd = boolEditor("Ignore smart quotes", tfs.smartQuotes);
    var doubleSpacesEd = boolEditor("Ignore multiple spaces", tfs.doubleSpaces);
    var nfcEd = boolEditor("NFC-normalize unicode text", tfs.nfc);

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
