import {
    loadAllDecks,
    runDeck,
    gDeckRegistry
} from "./flashcard-deck"
import {
    generateDecklistMenu,
    setupDecklistMenu
} from "./decklist"

import "./fs"
import "./uniform-fgen";
import "./spaced-repetition";

setupDecklistMenu();

loadAllDecks().then((_) => runDeck("key-value-quizzer"));
