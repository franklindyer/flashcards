import {
    loadAllDecks,
    runDeck,
    gDeckRegistry
} from "./flashcard-deck"
import {
    generateDecklistMenu,
    setupDecklistMenu
} from "./decklist"

import "./basic-template"
import "./cloze-template"

import "./fs"
import "./uniform-fgen";
import "./spaced-repetition";
import "./cloze-gen";

import "./speech";

setupDecklistMenu();

loadAllDecks().then((_) => runDeck("key-value-quizzer"));
