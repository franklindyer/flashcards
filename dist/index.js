"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lib_1 = require("./lib");
require("./demos");
require("./spaced-repetition");
require("./german-drill");
require("./russian-drill");
require("./progression");
require("./weighted-rand");
require("./evil");
require("./russian-templating");
require("./russian-penguin");
require("./german-bacon");
require("./abstract-agreement");
require("./word-rel");
require("./frequency-drillers");
require("./emojis");
var reg = (0, lib_1.loadRegistryFromLocal)();
var lastDeckname = (0, lib_1.loadLastDecknameFromLocal)(reg["decks"]);
if (!lastDeckname) {
    lastDeckname = "addition-quiz-deck";
}
(0, lib_1.runFlashcardController)(lastDeckname);
