export type TextFilterSettings = {
    answerSubs: [string, string][],
    removeParenDelimited: boolean,
    removeSqDelimited: boolean,
    noPunctuation: boolean,
    noCaps: boolean,
    smartQuotes: boolean,
    doubleSpaces: boolean,
    trimSpaces: boolean,
    nfc: boolean
};

export const defaultTextFilterSettings = {
    answerSubs: [],
    removeParenDelimited: false,
    removeSqDelimited: false,
    noPunctuation: false,
    noCaps: false,
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
    // return str.replaceAll(/[.,\/#!?$%\^&\*;:{}=\-_`~()]/g, "");
    return str.replaceAll(/\p{Sc}|\p{P}/gu, "");
}

function filterCaps(str: string) {
    return str.toLowerCase();
}


// Replace missing settings in the case of updates
function repairTextFilterSettings(tfs: any): TextFilterSettings {
    for (var i in Object.keys(defaultTextFilterSettings)) {
        var k = Object.keys(defaultTextFilterSettings)[i];
        if (!(k in tfs)) {
            if (k == "answerSubs") {
                tfs[k] = [];
            } else {
                tfs[k] = false;
            }
        }
    }
    return <TextFilterSettings>tfs;
}

export function applyTextFilter(str: string, tfs: TextFilterSettings) {
    tfs = repairTextFilterSettings(tfs);

    for (var i = 0; i < tfs.answerSubs.length; i++) {
        var r = tfs.answerSubs[i];
        var regex = new RegExp(r[0], 'g');
        var subtxt = r[1];
        str = str.replace(regex, subtxt);
    }

    if (tfs.removeParenDelimited)
        str = filterHintParens(str);
    if (tfs.removeSqDelimited)
        str = filterHintSqs(str);
    if (tfs.noPunctuation)
        str = filterPunctuation(str);
    if (tfs.noCaps)
        str = filterCaps(str);
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


