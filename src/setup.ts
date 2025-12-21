import {
    loadAllDecks,
    runDeck,
    gDeckRegistry,
    getStartingDeck
} from "core/flashcard-deck"
import {
    setupDecklistMenu
} from "core/decklist"

import "menus/menus";

import "decks/times-tables-gen";
import "decks/uniform-key-value";
import "decks/spaced-repetition-universal";
import "decks/transcript-gen";

import "utils/basic-template";
import "utils/cloze-template";
import "utils/noanswer-template";
import "utils/transcript-template";

setupDecklistMenu();

loadAllDecks().then((_) => runDeck(getStartingDeck("key-value-quizzer")));
