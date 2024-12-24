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
    var ruAdjectives: any
    var ruNouns: any
    var ruVerbs: any
}

var ruDataPromise = (filename: string, objname: string) => 
    fetch(`/data/${filename}.csv`).then((r) => r.text()).then((s) => {
    var csvData = papa.parse(s, { header: true, dynamicTyping: true }).data;
    (<any>window)[objname] = (bareVerb: string) => {
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

function makeTranslationEditor(ls: [string, string][], validator: (s: string) => boolean):
    FlashcardGenEditor<[string, string][]> {
    return multipleEditors(
        ls,
        ["", ""],
        (item) => combineEditors(
            item,
            (s: string) => singleTextFieldEditor(s),
            (s: string) => validatedTextFieldEditor(s, validator)
        )
    )
}

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
/*        var editor: FlashcardGenEditor<[string, string][]> = multipleEditors(
            vbs,
            ["", ""],
            (vb) => combineEditors(
                vb,
                (s: string) => singleTextFieldEditor(s),
                (s: string) => validatedTextFieldEditor(s, validator) 
            )
        ); */
        var editor = makeTranslationEditor(vbs, validator);
        return {
            element: editor.element,
            menuToState: () => editor.menuToState().filter((c) => validator(c[1])) 
        };
    }
}

var ruAdjQuizzer: FlashcardGenerator<
    [[string, string], [string, string]], 
    [[string, string][], [string, string][]]> = {
    ftemp: {
        generator: function(seed: [[string, string], [string, string]]) {
            var nouns = window.ruNouns;
            var adjs = window.ruAdjectives;
            var adjDecl = `decl_${nouns(seed[0][1]).gender}_nom`;
            var answer = `${adjs(seed[1][1])[adjDecl]} ${nouns(seed[0][1]).bare}`;
            answer = answer.replace("'", "");
            return {
                params: seed,
                prompt: `${seed[1][0]} ${seed[0][0]}`,
                hint: answer,
                answers: [answer],
                uuid: guidGenerator()
            }
        }
    },
    state: [
        [
            ["day", "день"],
            ["night", "ночь"],
            ["morning", "утро"]
        ],
        [
            ["good", "добрый"],
            ["bad", "плохой"],
            ["this", "этот"],
            ["that", "тот"]
        ]
    ],
    seeder: function(st: [[string, string][], [string, string][]]) {
        var noun = st[0][Math.floor(Math.random() * st[0].length)];
        var adj = st[1][Math.floor(Math.random() * st[1].length)];
        return [noun, adj]
    },
    updater: (correct, card, st) => st,
    history: [],
    editor: (dat: [[string, string][], [string, string][]]) => {
        var nounValidator = (ruStr: string) => window.ruNouns(ruStr) !== undefined;
        var adjValidator = (ruStr: string) => window.ruAdjectives(ruStr) !== undefined;
        var nounEditor = makeTranslationEditor(dat[0], nounValidator);
        var adjEditor = makeTranslationEditor(dat[1], adjValidator);
        var contDiv = document.createElement("div");
        var nounTitle = document.createElement("h3");
        nounTitle.textContent = "Nouns";
        var adjTitle = document.createElement("h3");
        adjTitle.textContent = "Adjectives";
        contDiv.appendChild(nounTitle);
        contDiv.appendChild(nounEditor.element);
        contDiv.appendChild(adjTitle);
        contDiv.appendChild(adjEditor.element);
        return {
            element: contDiv,
            menuToState: () => [nounEditor.menuToState(), adjEditor.menuToState()]
        }
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

defaultDecks["russian-adj-deck"] = {
    name: "Russian adjective declinations",
    slug: "russian-adj-deck",
    decktype: "russian-adj-driller",
    resources: ["russian-nouns", "russian-adjectives"],
    state: ruAdjQuizzer.state
};

providedGenerators["russian-verb-driller"] = ruVerbQuizzer;
providedGenerators["russian-adj-driller"] = ruAdjQuizzer;

indexedResources["russian-verbs"] = () => ruDataPromise("ru-verbs", "ruVerbs");
indexedResources["russian-nouns"] = () => ruDataPromise("ru-nouns", "ruNouns");
indexedResources["russian-adjectives"] = () => ruDataPromise("ru-adjectives", "ruAdjectives");
