"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const speech_1 = require("./speech");
const defaultTranscriptionSettings = {
    autoplay: true,
    speechSettings: (0, speech_1.defaultSpeechSettings)()
};
function makeTranscriptionCardDict(cards) {
    var cardDict = {};
    for (var i in cards) {
        var c = {
            guid: (0, utils_1.getUuid)(cards[i], 5),
            text: cards[i],
            correct: 0,
            incorrect: 0
        };
        cardDict[c.guid] = c;
    }
    return cardDict;
}
const defaultTranscriptionState = {
    cards: makeTranscriptionCardDict([
        "Hello, my name is Bob.",
        "What interesting weather we're having!",
        "How old are you?",
        "I've had enough of this."
    ]),
    settings: defaultTranscriptionSettings
};
