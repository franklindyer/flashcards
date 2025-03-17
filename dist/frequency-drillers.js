"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lib_1 = require("./lib");
const progression_1 = require("./progression");
const papa = require("papaparse");
var langFreqPromise = (langCode) => fetch(`/data/${langCode}-freqlist.csv`).then((r) => r.text()).then((s) => {
    var csvData = papa.parse(s, { header: false, delimiter: '\t' }).data;
    window[`${langCode}Freqlist`] = (n) => {
        return csvData[n];
    };
});
/* SPANISH */
var esFreqQuizzer = (0, progression_1.geometricProgressFGen)((n) => {
    var record = window.esFreqlist(n);
    return [record[1], record[0].split("/")[0], `"${record[2].split('|')[1]}"`];
}, 5000);
lib_1.defaultDecks["spanish-freq-deck"] = {
    name: "Spanish: Routledge most common words",
    slug: "spanish-freq-deck",
    decktype: "spanish-freq-driller",
    resources: ["spanish-freqlist"],
    view: {
        color: "#ffeeee"
    },
    state: esFreqQuizzer.state
};
lib_1.providedGenerators["spanish-freq-driller"] = esFreqQuizzer;
lib_1.indexedResources["spanish-freqlist"] = () => langFreqPromise("es");
/* RUSSIAN */
var ruFreqQuizzer = (0, progression_1.geometricProgressFGen)((n) => {
    var record = window.ruFreqlist(n);
    return [record[1], record[0].split(" ")[0].split("/")[0], `"${record[2].split('|')[1]}"`];
}, 5000);
lib_1.defaultDecks["russian-freq-deck"] = {
    name: "Russian: Routledge most common words",
    slug: "russian-freq-deck",
    decktype: "russian-freq-driller",
    resources: ["russian-freqlist"],
    view: {
        color: "#eee0ff"
    },
    state: ruFreqQuizzer.state
};
lib_1.providedGenerators["russian-freq-driller"] = ruFreqQuizzer;
lib_1.indexedResources["russian-freqlist"] = () => langFreqPromise("ru");
