"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const flashcard_deck_1 = require("./flashcard-deck");
const decklist_1 = require("./decklist");
require("./fs");
require("./uniform-fgen");
(0, decklist_1.generateDecklistMenu)(flashcard_deck_1.gDeckRegistry, (_) => { });
(0, flashcard_deck_1.loadAllDecks)().then((_) => (0, flashcard_deck_1.runDeck)("key-value-quizzer"));
