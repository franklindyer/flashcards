import {
    runFlashcardController,
    loadLastDecknameFromLocal,
    loadRegistryFromLocal
    } from './lib'
import './demos'
import './spaced-repetition'
import './german-drill'
import './russian-drill'
import './progression'
import './weighted-rand'
import './evil'

import './russian-templating'
import './russian-penguin'

import './german-bacon'

import './abstract-agreement'
import './word-rel'

import './frequency-drillers'

import './emojis'

var reg = loadRegistryFromLocal();
var lastDeckname = loadLastDecknameFromLocal(reg["decks"]);
if (!lastDeckname) {
    lastDeckname = "addition-quiz-deck";
}
runFlashcardController(lastDeckname);
