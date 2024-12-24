import {
    guidGenerator,
    FlashcardGenerator,
    FlashcardGenEditor,
    singleTextFieldEditor,
    validatedTextFieldEditor,
    doubleTextFieldEditor,
    combineEditors,
    multipleEditors,
    evilFGen, 
    runFlashcardController,
    defaultDecks,
    providedGenerators,
    indexedResources
    } from "./lib";
const papa = require("papaparse");

declare global {
    var deVerbs: any
}

var deVerbsRes = () => fetch("/data/de-verbs.csv").then((r) => r.text()).then((s) => {
    var csvData = papa.parse(s, { header: true, dynamicTyping: true }).data;
    console.log(csvData[1]);
    window.deVerbs = (bareVerb: string) => {
        var v = csvData.find((k: any) => k.Infinitive === bareVerb);
        return v; 
    }
});

const enNomPron = ["I", "you", "he", "she", "it"];
const deNomPron = ["ich", "du", "er", "sie", "es"];
const subjPresentCols = [
    "Präsens_ich",
    "Präsens_du",
    "Präsens_er, sie, es",
    "Präsens_er, sie, es",
    "Präsens_er, sie, es"
];

var deVerbQuizzer: FlashcardGenerator<[number, string, string], [string, string][]> = {
    ftemp: {
        generator: function(seed: [number, string, string]) {
            var answer = `${deNomPron[seed[0]]} ${window.deVerbs(seed[2])[subjPresentCols[seed[0]]]}`;
            answer = answer.replace("'", "");
            return {
                params: seed,
                prompt: `${enNomPron[seed[0]]} ${seed[1]}`,
                answers: [answer],
                hint: answer,
                uuid: guidGenerator() 
            }
        }
    },
    state: [
        ["jump", "springen"]
    ],
    seeder: function(vbs: [string, string][]) {
        var pronInd = Math.floor(Math.random() * deNomPron.length);
        var vb = vbs[Math.floor(Math.random() * vbs.length)];
        return [pronInd, vb[0], vb[1]];
    },
    updater: (correct, card, st) => st,
    history: [],
    editor: (vbs: [string, string][]) => {
        var validator = (deStr: string) => window.deVerbs(deStr) !== undefined;
        var editor: FlashcardGenEditor<[string, string][]> = multipleEditors(
            vbs,
            ["", ""],
            (vb) => combineEditors(
                vb,
                (s: string) => singleTextFieldEditor(s),
                (s: string) => validatedTextFieldEditor(s, validator) 
            )
        );
        return {
            element: editor.element,
            menuToState: () => editor.menuToState().filter((c) => validator(c[1])) 
        };
    }
}

defaultDecks["german-verb-deck"] = {
    name: "German present-tense verb conjugations",
    slug: "german-verb-deck",
    decktype: "german-verb-driller",
    resources: ["german-verbs"],
    state: deVerbQuizzer.state
};
providedGenerators["german-verb-driller"] = deVerbQuizzer;
indexedResources["german-verbs"] = deVerbsRes;
