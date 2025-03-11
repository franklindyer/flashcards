import {
    providedGenerators,
    indexedResources,
    defaultDecks
    } from "./lib";
import {
    geometricProgressFGen
    } from "./progression";
const papa = require("papaparse");

declare global {
    var esFreqlist: any
    var ruFreqlist: any
}

var langFreqPromise = (langCode: string) =>
    fetch(`/data/${langCode}-freqlist.csv`).then((r) => r.text()).then((s) => {
        var csvData = papa.parse(s, { header: false, delimiter: '\t' }).data;
        (<any>window)[`${langCode}Freqlist`] = (n: number) => {
            return csvData[n];
        }
    });

/* SPANISH */

var esFreqQuizzer = geometricProgressFGen((n: number) => {
    var record = window.esFreqlist(n);
    return [record[1], record[0].split(" ")[0].split("/")[0], `"${record[2].split('|')[1]}"`];
}, 5000);

defaultDecks["spanish-freq-deck"] = {
    name: "Spanish: Routledge most common words",
    slug: "spanish-freq-deck",
    decktype: "spanish-freq-driller",
    resources: ["spanish-freqlist"],
    view: {
        color: "#ffeeee"
    },
    state: esFreqQuizzer.state
}

providedGenerators["spanish-freq-driller"] = esFreqQuizzer;
indexedResources["spanish-freqlist"] = () => langFreqPromise("es");

/* RUSSIAN */

var ruFreqQuizzer = geometricProgressFGen((n: number) => {
    var record = window.ruFreqlist(n);
    return [record[1], record[0].split(" ")[0].split("/")[0], `"${record[2].split('|')[1]}"`];
}, 5000);

defaultDecks["russian-freq-deck"] = {
    name: "Russian: Routledge most common words",
    slug: "russian-freq-deck",
    decktype: "russian-freq-driller",
    resources: ["russian-freqlist"],
    view: {
        color: "#eee0ff"
    },
    state: ruFreqQuizzer.state
}

providedGenerators["russian-freq-driller"] = ruFreqQuizzer;
indexedResources["russian-freqlist"] = () => langFreqPromise("ru");
