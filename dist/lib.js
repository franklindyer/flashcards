"use strict";
// Types
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.indexedResources = exports.providedGenerators = exports.defaultDecks = exports.defaultDeckView = exports.runFlashcardController = exports.loadDeckGenFromRegistry = exports.saveDeckToLocal = exports.loadRegistryFromLocal = exports.multipleEditors = exports.fixedNumEditors = exports.makeTranslationEditor = exports.tableEditor = exports.combineEditors = exports.doubleTextFieldEditor = exports.validatedTextFieldEditor = exports.singleTextFieldEditor = exports.scrollNumberEditor = exports.floatEditor = exports.boolEditor = exports.evilFGen = exports.uniformRandomFGen = exports.guidGenerator = exports.fconst = void 0;
// Utilities
function fconst(y) {
    return (_) => y;
}
exports.fconst = fconst;
// https://stackoverflow.com/questions/6860853/generate-random-string-for-div-id
function guidGenerator() {
    var S4 = function () {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };
    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
}
exports.guidGenerator = guidGenerator;
function zeroDict(keys) {
    var d = {};
    for (var k in keys) {
        d[keys[k]] = 0;
    }
    return d;
}
function weightedRandomIndex(weights) {
    var weightSums = weights.map((sum => value => sum += value)(0));
    var totalSum = weights.reduce((a, b) => a + b, 0);
    var ind = weightSums.findIndex((w) => w >= Math.random() * totalSum);
    return ind;
}
function arrayLen(ls) {
    var n = 0;
    for (var i in ls) {
        if (ls[i] !== undefined)
            n++;
    }
    return n;
}
function arrayReindex(ls) {
    return ls.filter((_) => true);
}
// https://stackoverflow.com/questions/3665115/how-to-create-a-file-in-memory-for-user-to-download-but-not-through-server
function downloadText(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}
// Logic
function uniformRandomFGen(cards) {
    var gen = {
        ftemp: {
            generator: function (seed, st) {
                return {
                    params: seed,
                    prompt: st[seed][0],
                    answers: [st[seed][1]],
                    hint: st[seed][1],
                    uuid: guidGenerator()
                };
            }
        },
        state: cards,
        seeder: function (st) {
            return Math.floor(Math.random() * arrayLen(st));
        },
        updater: (correct, answer, card, st) => st,
        history: [],
        editor: (ls) => multipleEditors(ls, ["", ""], doubleTextFieldEditor)
    };
    return gen;
}
exports.uniformRandomFGen = uniformRandomFGen;
function evilFGen(cards, alpha) {
    return {
        ftemp: {
            generator: function (seed, st) {
                return {
                    params: seed,
                    prompt: st[0][seed][0],
                    answers: [st[0][seed][1]],
                    hint: st[0][seed][1],
                    uuid: guidGenerator()
                };
            }
        },
        state: [cards, zeroDict([...new Set(cards.map((c) => c[2]).flat())])],
        seeder: function (st) {
            var weights = st[0].map((card) => 1 + card[2].map((p) => st[1][p]).reduce((a, b) => a + b, 0));
            return weightedRandomIndex(weights);
        },
        updater: function (correct, answer, card, st) {
            var props = st[0][card.params][2];
            for (var i in props) {
                if (correct) {
                    st[1][props[i]] *= alpha;
                }
                else {
                    st[1][props[i]] += 1;
                }
            }
            return st;
        },
        history: [],
        editor: (st) => {
            var propWeights = st[1];
            var cards = st[0].map((c) => [c[0], c[1], c[2].join(',')]);
            var editor = multipleEditors(cards, ["", "", ""], (c) => fixedNumEditors(c, singleTextFieldEditor));
            var newWeights = zeroDict([...new Set(cards.map((c) => c[2]).flat())]);
            for (var i in propWeights) {
                if (propWeights[i] in Object.keys(newWeights)) {
                    newWeights[propWeights[i]] = propWeights[propWeights[i]];
                }
            }
            return {
                element: editor.element,
                menuToState: () => {
                    return [editor.menuToState().map((c) => [c[0], c[1], c[2].split(',')]), newWeights];
                }
            };
        }
    };
}
exports.evilFGen = evilFGen;
function nextCard(fgen) {
    var seed = fgen.seeder(fgen.state);
    var card = fgen.ftemp.generator(seed, fgen.state);
    return card;
}
function isGuessCorrect(card, guess) {
    return card.answers.indexOf(guess) > -1;
}
// View
function boolEditor(label, val) {
    var checkbox = document.createElement("input");
    var editor = {
        element: null,
        menuToState: () => checkbox.checked
    };
    checkbox.type = "checkbox";
    checkbox.checked = val;
    var guid = guidGenerator();
    checkbox.id = guid;
    var elementLabel = document.createElement("label");
    elementLabel.htmlFor = guid;
    elementLabel.textContent = label;
    var boxWithLabel = document.createElement("div");
    boxWithLabel.appendChild(checkbox);
    boxWithLabel.appendChild(elementLabel);
    editor.element = boxWithLabel;
    return editor;
}
exports.boolEditor = boolEditor;
function floatEditor(label, val, min, max) {
    var slider = document.createElement("input");
    slider.type = "range";
    slider.min = min.toString();
    slider.max = max.toString();
    slider.step = ((max - min) / 100.0).toString();
    slider.value = val.toString();
    slider.style.display = "inline-block";
    slider.style.verticalAlign = "middle";
    var guid = guidGenerator();
    slider.id = guid;
    var sliderLabel = document.createElement("label");
    sliderLabel.textContent = label;
    sliderLabel.htmlFor = guid;
    sliderLabel.style.verticalAlign = "middle";
    var guid = guidGenerator();
    var contDiv = document.createElement("div");
    [slider, sliderLabel].map((el) => contDiv.appendChild(el));
    return {
        element: contDiv,
        menuToState: () => parseFloat(slider.value)
    };
}
exports.floatEditor = floatEditor;
function scrollNumberEditor(label, val, min, max, step) {
    var scroller = document.createElement("input");
    scroller.type = "number";
    scroller.max = max.toString();
    scroller.min = min.toString();
    scroller.value = val.toString();
    scroller.step = step.toString();
    var scrollerLabel = document.createElement("a");
    scrollerLabel.textContent = label;
    var scrollerCont = document.createElement("div");
    scrollerCont.appendChild(scrollerLabel);
    scrollerCont.appendChild(scroller);
    scrollerCont.style.display = "block";
    return {
        element: scrollerCont,
        menuToState: () => parseFloat(scroller.value)
    };
}
exports.scrollNumberEditor = scrollNumberEditor;
function singleTextFieldEditor(txt) {
    var editor = {
        element: document.createElement("input"),
        menuToState: () => editor.element.value
    };
    editor.element.value = txt;
    return editor;
}
exports.singleTextFieldEditor = singleTextFieldEditor;
function validatedTextFieldEditor(txt, pred) {
    var editor = singleTextFieldEditor(txt);
    editor.element.oninput = (e) => {
        if (!pred(editor.element.value)) {
            editor.element.style.backgroundColor = "#ffeeee";
        }
        else {
            editor.element.style.backgroundColor = "white";
        }
    };
    return editor;
}
exports.validatedTextFieldEditor = validatedTextFieldEditor;
function doubleTextFieldEditor(txts) {
    var children = [singleTextFieldEditor(txts[0]), singleTextFieldEditor(txts[1])];
    var editor = {
        element: document.createElement("div"),
        menuToState: () => children.map((c) => c.menuToState())
    };
    editor.element.appendChild(children[0].element);
    editor.element.appendChild(children[1].element);
    return editor;
}
exports.doubleTextFieldEditor = doubleTextFieldEditor;
function combineEditors(st, gen1, gen2) {
    var children = [gen1(st[0]), gen2(st[1])];
    var editor = {
        element: document.createElement("div"),
        menuToState: () => [children[0].menuToState(), children[1].menuToState()]
    };
    editor.element.appendChild(children[0].element);
    editor.element.appendChild(children[1].element);
    return editor;
}
exports.combineEditors = combineEditors;
function tableEditor(st, rownames, colnames, gen) {
    var rows = st.length;
    var cols = st[0].length;
    var tbl = document.createElement("table");
    var eds = [];
    for (var i = 0; i < rows + 1; i++) {
        var tblrow = document.createElement("tr");
        for (var j = 0; j < cols + 1; j++) {
            var tblcell = document.createElement("td");
            if (i === 0 && j !== 0) {
                tblcell.textContent = colnames[j - 1];
            }
            else if (i !== 0 && j === 0) {
                tblcell.textContent = rownames[i - 1];
            }
            else if (i !== 0 && j !== 0) {
                var ed = gen(st[i - 1][j - 1]);
                tblcell.appendChild(ed.element);
                eds[eds.length - 1].push(ed);
            }
            tblrow.appendChild(tblcell);
        }
        if (i < rows) {
            eds.push([]);
        }
        tbl.appendChild(tblrow);
    }
    return {
        element: tbl,
        menuToState: () => eds.map((r) => r.map((ed) => ed.menuToState()))
    };
}
exports.tableEditor = tableEditor;
function makeTranslationEditor(ls, validator) {
    return multipleEditors(ls, ["", ""], (item) => combineEditors(item, (s) => singleTextFieldEditor(s), (s) => validatedTextFieldEditor(s, validator)), true, (s, cd) => cd[0].includes(s) || cd[1].includes(s));
}
exports.makeTranslationEditor = makeTranslationEditor;
function fixedNumEditors(ls, ed) {
    var children = [];
    var editor = {
        element: document.createElement("div"),
        menuToState: () => arrayReindex(children.map((c) => c.menuToState()))
    };
    var statePartEditorFactory = (statePart) => {
        var newEditor = ed(statePart);
        children.push(newEditor);
        editor.element.appendChild(newEditor.element);
    };
    for (var i in ls) {
        statePartEditorFactory(ls[i]);
    }
    return editor;
}
exports.fixedNumEditors = fixedNumEditors;
function multipleEditors(ls, empty, ed, includeSearch = false, searchFxn = (s, x) => true) {
    var children = [];
    var editor = {
        element: document.createElement("div"),
        menuToState: () => arrayReindex(children.map((c) => c.menuToState()))
    };
    var addBtn = document.createElement("button");
    addBtn.classList.add("add-new-field-button");
    addBtn.textContent = "Add another";
    var statePartDivs = [];
    var statePartEditorFactory = (statePart) => {
        var newEditor = ed(statePart);
        children.push(newEditor);
        var ind = children.length - 1;
        var statePartDiv = document.createElement("div");
        statePartDiv.appendChild(newEditor.element);
        newEditor.element.style.display = "inline-block";
        var delBtn = document.createElement("button");
        delBtn.textContent = "remove";
        delBtn.onclick = (e) => {
            delete children[ind];
            delete statePartDivs[ind];
            editor.element.removeChild(statePartDiv);
        };
        statePartDiv.appendChild(delBtn);
        editor.element.appendChild(statePartDiv);
        statePartDivs.push(statePartDiv);
    };
    addBtn.onclick = (e) => { statePartEditorFactory(empty); };
    editor.element.appendChild(addBtn);
    if (includeSearch) {
        var searchBar = document.createElement("input");
        searchBar.placeholder = "Search...";
        searchBar.oninput = (e) => {
            for (var i in children) {
                var ed = children[i];
                if (searchFxn(searchBar.value, ed.menuToState())) {
                    statePartDivs[i].style.display = "block";
                }
                else {
                    statePartDivs[i].style.display = "none";
                }
            }
        };
        editor.element.appendChild(searchBar);
    }
    for (var i in ls) {
        statePartEditorFactory(ls[i]);
    }
    return editor;
}
exports.multipleEditors = multipleEditors;
function buildCardDiv(card) {
    var cardDiv = document.createElement("div");
    cardDiv.classList.add("flashcard");
    cardDiv.textContent = card.prompt;
    cardDiv.id = card.uuid;
    if (card.info !== null) {
        var cardInfo = document.createElement("span");
        cardInfo.classList.add("flashcard-info");
        cardInfo.textContent = card.info;
        cardDiv.appendChild(cardInfo);
    }
    var fontSize = 100.0 / (10.0 * Math.log(10 + card.prompt.length));
    cardDiv.style.fontSize = `${fontSize}vw`;
    return cardDiv;
}
function slideCardIntoDiv(divId, card) {
    var container = document.getElementById(divId);
    var cardDiv = buildCardDiv(card);
    cardDiv.classList.add("flashcard-slide-in");
    cardDiv.onanimationend = () => { cardDiv.classList.remove("flashcard-slide-in"); };
    container === null || container === void 0 ? void 0 : container.appendChild(cardDiv);
}
function slideCardOutOfDiv(cardId) {
    var cardDiv = document.getElementById(cardId);
    cardDiv === null || cardDiv === void 0 ? void 0 : cardDiv.classList.add("flashcard-slide-out");
    cardDiv.onanimationend = () => { cardDiv.style.display = "none"; };
}
function clearCardDiv() {
    var cardDiv = document.getElementsByClassName("flashcard")[0];
    cardDiv === null || cardDiv === void 0 ? void 0 : cardDiv.remove();
}
function markCardIncorrect(cardId) {
    var _a;
    var cardDiv = document.getElementById(cardId);
    (_a = cardDiv === null || cardDiv === void 0 ? void 0 : cardDiv.classList) === null || _a === void 0 ? void 0 : _a.add("flashcard-incorrect");
    cardDiv.onanimationend = () => { cardDiv.classList.remove("flashcard-incorrect"); };
    cardDiv.offsetHeight;
}
function setHintText(hint) {
    var hintBox = document.getElementById("flashcard-answer-hint");
    hintBox.value = hint;
}
function updateProgressBar(fgen) {
    var progressBar = document.getElementById("flashcard-progress-bar");
    var cardsDone = fgen.history.length;
    var cardsCorrect = fgen.history.filter((x) => x[1]).length;
    var percent = Math.floor(100 * cardsCorrect / cardsDone);
    var progressMsg = `${cardsDone} cards complete, ${percent}% correct`;
    progressBar.textContent = progressMsg;
    progressBar.style.backgroundColor = `rgba(${225 - percent / 3},${155 + percent}, 150)`;
}
function generateDeckNameEditor(deck) {
    var nicknameEditor = singleTextFieldEditor(deck.name);
    var colorEditor = singleTextFieldEditor(deck.view.color);
    var closeBtn = document.createElement("button");
    closeBtn.textContent = "Save";
    var contDiv = document.createElement("div");
    [nicknameEditor.element, colorEditor.element, closeBtn].map((el) => contDiv.appendChild(el));
    contDiv.onclick = (e) => {
        e.cancelBubble = true;
        if (e.stopPropagation)
            e.stopPropagation();
    };
    var ed = {
        element: contDiv,
        menuToState: () => {
            deck.name = nicknameEditor.menuToState();
            deck.view.color = colorEditor.menuToState();
            contDiv.remove();
            return deck;
        }
    };
    return ed;
}
function generateDecklistMenu(decklist, onfinish) {
    var decklistEditor = document.getElementById("flashcard-decklist-editor");
    decklistEditor.innerHTML = "";
    var decklistOverlay = document.getElementById("flashcard-decklist-overlay");
    Object.keys(decklist).sort();
    for (var k in decklist) {
        var deckDiv = document.createElement("div");
        var slug = decklist[k].slug;
        deckDiv.textContent = decklist[k].name;
        deckDiv.classList.add("deck-editor-entry");
        if (decklist[k].view !== undefined) {
            deckDiv.style.backgroundColor = decklist[k].view.color;
        }
        deckDiv.onclick = ((s) => (e) => {
            decklistOverlay.style.display = "none";
            onfinish(decklist);
            runFlashcardController(s);
        })(slug);
        var deckEditBtn = document.createElement("button");
        //        deckEditBtn.textContent = "Rename";
        deckEditBtn.innerHTML = "<img src='/edit.png'/>";
        deckEditBtn.classList.add("deck-editor-button");
        deckEditBtn.onclick = ((dk, deckDiv) => (e) => {
            var ed = generateDeckNameEditor(dk);
            var closeBtn = ed.element.getElementsByTagName("button")[0];
            closeBtn.onclick = (e) => {
                var newDeck = ed.menuToState();
                decklist[dk.slug] = newDeck;
                generateDecklistMenu(decklist, onfinish);
            };
            deckDiv.replaceChildren(ed.element);
            e.cancelBubble = true;
            if (e.stopPropagation)
                e.stopPropagation();
        })(decklist[k], deckDiv);
        var deckDeleteBtn = document.createElement("button");
        deckDeleteBtn.classList.add("deck-editor-button");
        //        deckDeleteBtn.textContent = "Delete";
        deckDeleteBtn.innerHTML = "<img src='/trash.png'/>";
        deckDeleteBtn.onclick = ((dk) => (e) => {
            var confirmation = confirm(`Are you sure you want to delete "${dk.name}"?`);
            if (confirmation) {
                delete decklist[dk.slug];
            }
            e.cancelBubble = true;
            if (e.stopPropagation)
                e.stopPropagation();
            generateDecklistMenu(decklist, onfinish);
        })(decklist[k]);
        var deckCloneBtn = document.createElement("button");
        deckCloneBtn.classList.add("deck-editor-button");
        //        deckCloneBtn.textContent = "Clone";
        deckCloneBtn.innerHTML = "<img src='/copy.png'/>";
        deckCloneBtn.onclick = ((dk) => (e) => {
            var guid = guidGenerator();
            var deckClone = JSON.parse(JSON.stringify(dk));
            deckClone.slug = guid;
            decklist[guid] = deckClone;
            e.cancelBubble = true;
            if (e.stopPropagation)
                e.stopPropagation();
            generateDecklistMenu(decklist, onfinish);
        })(decklist[k]);
        deckDiv.appendChild(deckEditBtn);
        deckDiv.appendChild(deckDeleteBtn);
        deckDiv.appendChild(deckCloneBtn);
        decklistEditor.appendChild(deckDiv);
    }
}
// Saving and loading decks
function loadRegistryFromLocal() {
    var registryStr = localStorage.getItem("decks");
    if (!registryStr) {
        var starterRegistry = {
            decks: exports.defaultDecks,
            generators: exports.providedGenerators,
            resources: exports.indexedResources
        };
        return starterRegistry;
    }
    var registry = JSON.parse(registryStr);
    return {
        decks: registry,
        generators: exports.providedGenerators,
        resources: exports.indexedResources
    };
}
exports.loadRegistryFromLocal = loadRegistryFromLocal;
function saveDeckToLocal(reg, deck, gen) {
    reg.decks[deck.slug].state = gen.state;
    var registryStr = JSON.stringify(reg.decks);
    localStorage.setItem("decks", registryStr);
}
exports.saveDeckToLocal = saveDeckToLocal;
function loadDeckGenFromRegistry(reg, slug) {
    return __awaiter(this, void 0, void 0, function* () {
        var deck = reg.decks[slug];
        if (deck === undefined) {
            return null;
        }
        var gen = reg.generators[deck.decktype];
        if (deck === undefined) {
            return null;
        }
        gen.state = deck.state;
        yield Promise.all(deck.resources.map((rname) => reg.resources[rname]()));
        return gen;
    });
}
exports.loadDeckGenFromRegistry = loadDeckGenFromRegistry;
// export function runFlashcardController<a, s>(fgen: FlashcardGenerator<a, s>) {
function runFlashcardController(slug) {
    return __awaiter(this, void 0, void 0, function* () {
        var reg = loadRegistryFromLocal();
        if (reg === null) {
            console.log("Could not load flashcard registry.");
            return;
        }
        var fgenMaybe = yield loadDeckGenFromRegistry(reg, slug);
        if (fgenMaybe === null) {
            console.log("Could not load flashcard deck.");
            return;
        }
        var fgen = fgenMaybe;
        var isCorrect = false;
        var guessBox = document.getElementById("flashcard-answer-input");
        var guessController = function (card) {
            var correct = isGuessCorrect(card, guessBox.value);
            isCorrect = correct;
            if (!correct) {
                setHintText(card.hint);
                markCardIncorrect(card.uuid);
            }
            return isCorrect;
        };
        var editDeck = document.getElementById("deck-edit-button");
        editDeck.onclick = (e) => {
            var editor = fgen.editor(fgen.state);
            var deckEditor = document.getElementById("flashcard-deck-editor");
            var deckEditorOverlay = document.getElementById("flashcard-deck-editor-overlay");
            deckEditor.replaceChildren(editor.element);
            deckEditorOverlay.style.display = "block";
            var closeEditor = document.getElementById("flashcard-deck-editor-close");
            var deckOverlay = document.getElementById("flashcard-deck-editor-overlay");
            closeEditor.onclick = (e) => {
                fgen.state = editor.menuToState();
                deckOverlay.style.display = "none";
                saveDeckToLocal(reg, reg.decks[slug], fgen);
                flashcardLoop();
            };
        };
        var decklistBtn = document.getElementById("deck-list-button");
        decklistBtn.onclick = (e) => {
            clearCardDiv();
            var decklistOverlay = document.getElementById("flashcard-decklist-overlay");
            generateDecklistMenu(reg.decks, (ds) => {
                localStorage.setItem("decks", JSON.stringify(ds));
            });
            decklistOverlay.style.display = "block";
        };
        var exportBtn = document.getElementById("export-deck-button");
        exportBtn.onclick = (e) => {
            downloadText(`${slug}.txt`, JSON.stringify(reg.decks[slug]));
        };
        var importBtn = document.getElementById("import-deck-button");
        var fileUploadInput = document.getElementById("deck-upload-file");
        importBtn.onclick = (e) => {
            fileUploadInput.click();
            fileUploadInput.onchange = (e) => {
                var files = fileUploadInput.files;
                if (files === null)
                    return;
                var file = files[0];
                if (file === null)
                    return;
                var reader = new FileReader();
                reader.onload = (e) => {
                    fgen.state = JSON.parse(e.target.result).state;
                    saveDeckToLocal(reg, reg.decks[slug], fgen);
                };
                reader.readAsText(file, "UTF-8");
            };
        };
        var lastCardId = null;
        var flashcardLoop = () => {
            var _a;
            isCorrect = false;
            (_a = document.getElementById(lastCardId)) === null || _a === void 0 ? void 0 : _a.remove();
            var card = nextCard(fgen);
            lastCardId = card.uuid;
            slideCardIntoDiv("flashcard-container", card);
            setHintText("");
            var firstCorrect = true;
            var addedToHistory = false;
            guessBox.onkeydown = (e) => {
                if (e.key == "Enter") {
                    if (guessController(card)) {
                        var finalAnswer = guessBox.value;
                        guessBox.value = "";
                        slideCardOutOfDiv(card.uuid);
                        setTimeout(() => flashcardLoop(), 1000);
                        if (!addedToHistory) {
                            fgen.history.push([card, firstCorrect]);
                            fgen.state = fgen.updater(firstCorrect, finalAnswer, card, fgen.state);
                            addedToHistory = true;
                            updateProgressBar(fgen);
                            saveDeckToLocal(reg, reg.decks[slug], fgen);
                        }
                    }
                    else {
                        guessBox.oninput = (e) => { guessBox.value = guessBox.value.slice(-1); guessBox.oninput = () => { }; };
                        firstCorrect = false;
                    }
                }
            };
        };
        flashcardLoop();
    });
}
exports.runFlashcardController = runFlashcardController;
// Demos
exports.defaultDeckView = {
    color: "#eeeeff"
};
exports.defaultDecks = {};
exports.providedGenerators = {};
exports.indexedResources = {};
