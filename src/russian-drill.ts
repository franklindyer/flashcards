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
    var ruVerbs: any
}

var ruVerbsRes = () => fetch("/data/verbs.csv").then((r) => r.text()).then((s) => {
    var csvData = papa.parse(s, { header: true, dynamicTyping: true }).data;
    console.log(csvData[1]);
    window.ruVerbs = (bareVerb: string) => {
        var v = csvData.find((k: any) => k.bare === bareVerb);
        return v; 
    }
});

const enNomPron = ["I", "you", "he", "we", "y'all", "they"];
const ruNomPron = ["я", "ты", "он", "мы", "вы", "они"];
const subjPresentCols = [
    "presfut_sg1",
    "presfut_sg2",
    "presfut_sg3",
    "presfut_pl1",
    "presfut_pl2",
    "presfut_pl3"
];

var ruVerbQuizzer: FlashcardGenerator<[number, string, string], [string, string][]> = {
    ftemp: {
        generator: function(seed: [number, string, string]) {
            var answer = `${ruNomPron[seed[0]]} ${window.ruVerbs(seed[2])[subjPresentCols[seed[0]]]}`;
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
        ["speak", "говорить"]
    ],
    seeder: function(vbs: [string, string][]) {
        var pronInd = Math.floor(Math.random() * ruNomPron.length);
        var vb = vbs[Math.floor(Math.random() * vbs.length)];
        return [pronInd, vb[0], vb[1]];
    },
    updater: (correct, card, st) => st,
    history: [],
    editor: (vbs: [string, string][]) => {
        var validator = (ruStr: string) => window.ruVerbs(ruStr) !== undefined;
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

var ruPrepQuizzer = evilFGen([
    ["forest", "лес", ["simple"]],
    ["garden", "сад", ["simple"]],
    ["house", "дом", ["simple"]],
    ["in the forest", "в лесу", ["prep"]],
    ["in the garden", "в саду", ["prep"]],
    ["in the house", "в доме", ["prep"]]
], 0.9);

defaultDecks["russian-verb-deck"] = {
    name: "Russian present-tense verb conjugations",
    slug: "russian-verb-deck",
    decktype: "russian-verb-driller",
    resources: ["russian-verbs"],
    state: ruVerbQuizzer.state
};
providedGenerators["russian-verb-driller"] = ruVerbQuizzer;
indexedResources["russian-verbs"] = ruVerbsRes;
