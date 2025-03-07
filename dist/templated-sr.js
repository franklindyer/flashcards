"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var CardType;
(function (CardType) {
    CardType[CardType["Template"] = 0] = "Template";
    CardType[CardType["PoolValue"] = 1] = "PoolValue";
})(CardType || (CardType = {}));
const defaultSRSettings = {
    maxNewCardsAtOnce: 10,
    streakToAddCard: 3,
    initialInterval: 12,
    minimumInterval: 1,
    correctFactor: 1.2,
    incorrectFactor: 0.5,
    punishmentCloneProb: 1
};
