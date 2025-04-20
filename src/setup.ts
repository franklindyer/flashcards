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

// generateDecklistMenu(gDeckRegistry, (_) => {});
setupDecklistMenu();

loadAllDecks().then((_) => runDeck("key-value-quizzer"));
