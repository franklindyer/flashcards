"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SRStudying = void 0;
exports.makeEmptyCard = makeEmptyCard;
const utils_1 = require("utils/utils");
const flashcard_entry_1 = require("core/flashcard-entry");
var SRStudying;
(function (SRStudying) {
    SRStudying[SRStudying["NewCards"] = 1] = "NewCards";
    SRStudying[SRStudying["DueCards"] = 2] = "DueCards";
    SRStudying[SRStudying["RandomCards"] = 3] = "RandomCards";
    SRStudying[SRStudying["DueThenNewCards"] = 4] = "DueThenNewCards";
    SRStudying[SRStudying["NewThenDueCards"] = 5] = "NewThenDueCards";
})(SRStudying || (exports.SRStudying = SRStudying = {}));
function makeEmptyCard(cardType, settings) {
    return {
        guid: (0, utils_1.guidGenerator)(),
        cardType: cardType,
        cardEntry: flashcard_entry_1.gCardTypeRegistry[cardType].getDefaultEntry(settings),
        extraInfo: "",
        tags: [],
        due: new Date(),
        intervalMinutes: 0,
        stats: {
            created: new Date(),
            lastStudied: [],
            streak: 0,
            lastStreak: 0,
            streakWrong: 0,
            lastStreakWrong: 0,
            numCorrect: 0,
            numIncorrect: 0,
            maxStreakBroken: 0
        }
    };
}
