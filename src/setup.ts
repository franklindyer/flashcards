import {
    loadAllDecks,
    runDeck
} from "./flashcard-deck"

import "./fs"
import "./uniform-fgen";

loadAllDecks().then((_) => runDeck("simple-key-value-deck"));
