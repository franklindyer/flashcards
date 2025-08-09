import {
    loadAllDecks,
    runDeck,
    gDeckRegistry,
    getStartingDeck
} from "core/flashcard-deck"
import {
    setupDecklistMenu
} from "core/decklist"

import "decks/times-tables-gen";
import "decks/uniform-key-value";
import "decks/spaced-repetition-simple";
import "decks/spaced-repetition-cloze";
import "decks/cloze-gen";
import "decks/transcript-gen";

setupDecklistMenu();

loadAllDecks().then((_) => runDeck(getStartingDeck("key-value-quizzer")));
