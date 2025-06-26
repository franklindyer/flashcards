import {
    loadAllDecks,
    runDeck,
    gDeckRegistry,
    getStartingDeck
} from "./flashcard-deck"
import {
    generateDecklistMenu,
    setupDecklistMenu
} from "./decklist"

import "./basic-template"
import "./cloze-template"
import "./transcript-template"

import "./fs"
import "./uniform-key-value";
import "./spaced-repetition-simple";
import "./spaced-repetition-cloze";
import "./cloze-gen";
import "./transcript-gen";

import "./speech";

setupDecklistMenu();

loadAllDecks().then((_) => runDeck(getStartingDeck("key-value-quizzer")));
