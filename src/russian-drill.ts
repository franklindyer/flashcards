import {evilFGen, runFlashcardController} from "./lib";
const papa = require("papaparse");

declare global {
    var ruVerbs: any
}

var ruVerbs = fetch("/data/verbs.csv").then((r) => r.text()).then((s) => {
    var csvData = papa.parse(s, { header: true, dynamicTyping: true }).data;
    console.log(csvData[1]);
    window.ruVerbs = (bareVerb: string) => {
        var v = csvData.find((k: any) => k.bare === bareVerb);
        return v; 
    }
});

var ruPrepQuizzer = evilFGen([
    ["forest", "лес", ["simple"]],
    ["garden", "сад", ["simple"]],
    ["house", "дом", ["simple"]],
    ["in the forest", "в лесу", ["prep"]],
    ["in the garden", "в саду", ["prep"]],
    ["in the house", "в доме", ["prep"]]
], 0.9);

window.onload = () => { runFlashcardController(ruPrepQuizzer); }
