"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lib_1 = require("./lib");
var SpacedRepCardStatus;
(function (SpacedRepCardStatus) {
    SpacedRepCardStatus[SpacedRepCardStatus["CardNew"] = 1] = "CardNew";
    SpacedRepCardStatus[SpacedRepCardStatus["CardNotNew"] = 2] = "CardNotNew";
})(SpacedRepCardStatus || (SpacedRepCardStatus = {}));
var SpacedRepStudying;
(function (SpacedRepStudying) {
    SpacedRepStudying[SpacedRepStudying["NewCards"] = 1] = "NewCards";
    SpacedRepStudying[SpacedRepStudying["DueCards"] = 2] = "DueCards";
    SpacedRepStudying[SpacedRepStudying["NotStudying"] = 3] = "NotStudying";
})(SpacedRepStudying || (SpacedRepStudying = {}));
function getSpacedRepCardSeed(ind) {
    return {
        tag: "card",
        index: ind
    };
}
function makeSpacedRepCard(prompt, answers, tags) {
    return {
        guid: (0, lib_1.guidGenerator)(),
        prompt: prompt,
        answers: answers,
        tags: ["all"].concat(tags),
        due: null,
        lastInterval: 0,
        streak: 0
    };
}
function getSpacedRepMenuCard(menuSeed) {
    if (menuSeed.numDue > 0 && menuSeed.numNew > 0) {
        return {
            params: menuSeed,
            prompt: `${menuSeed.numDue} due cards and ${menuSeed.numNew} new cards. Enter 'due' to study due cards or 'new' to study new cards.`,
            answers: ["due", "new"],
            hint: "Please enter either 'due' or 'new'.",
            uuid: (0, lib_1.guidGenerator)()
        };
    }
    else if (menuSeed.numDue > 0) {
        return {
            params: menuSeed,
            prompt: `No new cards. Studying ${menuSeed.numDue} due cards now.`,
            answers: ["due"],
            hint: "Type 'due' to continue.",
            uuid: (0, lib_1.guidGenerator)()
        };
    }
    else if (menuSeed.numNew > 0) {
        return {
            params: menuSeed,
            prompt: `No due cards. Studying ${menuSeed.numNew} new cards now.`,
            answers: ["new"],
            hint: "Type 'new' to continue.",
            uuid: (0, lib_1.guidGenerator)()
        };
    }
    else {
        return {
            params: menuSeed,
            prompt: "No due or new cards. Come back later!",
            answers: [],
            hint: "Seriously. Come back LATER.",
            uuid: (0, lib_1.guidGenerator)()
        };
    }
}
function pickNextSpacedRepSeed(st) {
    var inds = [...Array(st.cards.length).keys()];
    var isActiveTag = (tg) => st.settings.activeTags.includes(tg);
    inds = inds.filter((i) => st.cards[i].tags.map(isActiveTag).includes(true));
    var newInds = inds.filter((i) => st.cards[i].due == null);
    var dueInds = inds.filter((i) => (st.cards[i].due != null && new Date(st.cards[i].due) < new Date()));
    var menuCard = {
        tag: "menu",
        numDue: dueInds.length,
        numNew: newInds.length
    };
    var cardSeed;
    switch (st.studying) {
        case SpacedRepStudying.NewCards:
            if (newInds.length === 0) {
                return menuCard;
            }
            var ind = Math.floor(Math.random() * newInds.length);
            cardSeed = getSpacedRepCardSeed(newInds[ind]);
            break;
        case SpacedRepStudying.DueCards:
            if (dueInds.length === 0) {
                return menuCard;
            }
            var ind = Math.floor(Math.random() * dueInds.length);
            cardSeed = getSpacedRepCardSeed(dueInds[ind]);
            break;
        case SpacedRepStudying.NotStudying:
            return menuCard;
    }
    cardSeed.info = `${st.leftInBatch} cards remain`;
    return cardSeed;
}
function spacedRepUpdater(correct, answer, card, st) {
    switch (card.params.tag) {
        case "card":
            var cardState = st.cards[card.params.index];
            if (correct) {
                cardState.lastInterval = cardState.lastInterval * st.settings.correctFactor;
                cardState.streak += 1;
            }
            else {
                cardState.lastInterval = cardState.lastInterval * st.settings.incorrectFactor;
                cardState.streak = 0;
            }
            if (cardState.due === null) {
                if (cardState.streak >= 3) {
                    cardState.lastInterval = st.settings.initialHours;
                    cardState.due = new Date();
                    cardState.due.setHours(cardState.due.getHours() + cardState.lastInterval);
                }
            }
            else if (correct) {
                cardState.due = new Date();
                cardState.due.setHours(cardState.due.getHours() + cardState.lastInterval);
            }
            cardState.due = JSON.parse(JSON.stringify(cardState.due));
            st.leftInBatch += -1;
            if (st.leftInBatch === 0) {
                st.studying = SpacedRepStudying.NotStudying;
            }
            break;
        case "menu":
            if (answer === "new") {
                st.leftInBatch = st.settings.newBatchSize;
                st.studying = SpacedRepStudying.NewCards;
            }
            else if (answer === "due") {
                st.leftInBatch = st.settings.dueBatchSize;
                st.studying = SpacedRepStudying.DueCards;
            }
            break;
    }
    return st;
}
function spacedRepMenu(st) {
    var contDiv = document.createElement("div");
    var conf = st.settings;
    var initHoursEditor = (0, lib_1.scrollNumberEditor)("Initial interval (hours): ", conf.initialHours, 1, 240, 1);
    var correctFactor = (0, lib_1.scrollNumberEditor)("Correct factor: ", conf.correctFactor, 1, 10, 0.1);
    var incorrectFactor = (0, lib_1.scrollNumberEditor)("Incorrect factor: ", conf.incorrectFactor, 0, 1, 0.01);
    var allTags = [...new Set(st.cards.map((c) => c.tags).flat())];
    var allTagStatuses = allTags.map((s) => st.settings.activeTags.includes(s));
    var activeTagsDiv = document.createElement("div");
    activeTagsDiv.innerHTML = `<h3>Active tags</h3>`;
    var makeTagSelector = (s) => {
        var ed = (0, lib_1.boolEditor)(s, st.settings.activeTags.includes(s));
        return {
            element: ed.element,
            menuToState: () => ed.menuToState() ? [s] : []
        };
    };
    var activeTagsEditor = (0, lib_1.fixedNumEditors)(allTags, makeTagSelector);
    activeTagsDiv.appendChild(activeTagsEditor.element);
    function makeCardEditor(c) {
        var ed = (0, lib_1.fixedNumEditors)([c.prompt, c.answers.join('|'), c.tags.join(',')], lib_1.singleTextFieldEditor);
        var cardInfo = document.createElement("a");
        cardInfo.style.color = "lightgray";
        cardInfo.style.marginLeft = "10px";
        cardInfo.style.marginRight = "10px";
        cardInfo.style.verticalAlign = "middle";
        if (c.due === null) {
            cardInfo.textContent = "not studied";
        }
        else {
            cardInfo.textContent = `due ${c.due.toLocaleString().split('T')[0]}`;
        }
        ed.element.appendChild(cardInfo);
        return {
            element: ed.element,
            menuToState: () => {
                let tp = ed.menuToState();
                return {
                    guid: c.guid,
                    prompt: tp[0],
                    answers: tp[1].split('|'),
                    tags: tp[2].split(','),
                    due: c.due,
                    lastInterval: c.lastInterval,
                    streak: c.streak
                };
            }
        };
    }
    ;
    var cardsEditor = (0, lib_1.multipleEditors)(st.cards, makeSpacedRepCard("", [], []), makeCardEditor, true, (s, cd) => cd.prompt.includes(s) || cd.answers.some((a) => a.includes(s)));
    var cardsEditorTitle = document.createElement("h3");
    cardsEditorTitle.textContent = "Cards";
    cardsEditor.element.prepend(cardsEditorTitle);
    var components = [
        initHoursEditor.element,
        correctFactor.element,
        incorrectFactor.element,
        activeTagsDiv,
        cardsEditor.element
    ];
    components.map((el) => contDiv.appendChild(el));
    return {
        element: contDiv,
        menuToState: () => {
            return {
                settings: {
                    initialHours: initHoursEditor.menuToState(),
                    correctFactor: correctFactor.menuToState(),
                    incorrectFactor: incorrectFactor.menuToState(),
                    newBatchSize: 10,
                    dueBatchSize: 20,
                    activeTags: activeTagsEditor.menuToState().flat()
                },
                studying: SpacedRepStudying.NotStudying,
                cards: cardsEditor.menuToState(),
                leftInBatch: 0
            };
        }
    };
}
function spacedRepGen(st) {
    var gen = {
        ftemp: {
            generator: function (seed, st) {
                switch (seed.tag) {
                    case "card":
                        var card = st.cards[seed.index];
                        return {
                            params: seed,
                            prompt: card.prompt,
                            answers: card.answers,
                            hint: card.answers[0],
                            info: seed.info,
                            uuid: (0, lib_1.guidGenerator)()
                        };
                    case "menu":
                        return getSpacedRepMenuCard(seed);
                }
                return null;
            }
        },
        state: st,
        seeder: pickNextSpacedRepSeed,
        updater: spacedRepUpdater,
        history: [],
        editor: spacedRepMenu
    };
    return gen;
}
const sampleSpacedRepState = {
    settings: {
        initialHours: 8,
        correctFactor: 1.2,
        incorrectFactor: 0.5,
        newBatchSize: 10,
        dueBatchSize: 20,
        activeTags: ["all"]
    },
    studying: SpacedRepStudying.NotStudying,
    cards: [
        makeSpacedRepCard("boy", ["niño", "chico"], []),
        makeSpacedRepCard("dog", ["perro"], ["animal"]),
        makeSpacedRepCard("cat", ["gato"], ["animal"]),
        makeSpacedRepCard("frog", ["rana"], ["animal"]),
        makeSpacedRepCard("bird", ["pájaro"], ["animal"]),
        makeSpacedRepCard("apple", ["manzana"], []),
        makeSpacedRepCard("orange", ["naranja"], []),
        makeSpacedRepCard("fascism", ["fascismo"], [])
    ],
    leftInBatch: 0
};
lib_1.defaultDecks["spaced-repetition-deck"] = {
    name: "Spaced repetition quizzer",
    slug: "spaced-repetition-deck",
    decktype: "spaced-repetition-driller",
    resources: [],
    view: lib_1.defaultDeckView,
    state: sampleSpacedRepState
};
lib_1.providedGenerators["spaced-repetition-driller"] = spacedRepGen(sampleSpacedRepState);
