"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.weightedRandomEdge = exports.weightedRandom = void 0;
function weightedRandom(dmn, getWeight, urand) {
    dmn = dmn.filter((x) => getWeight(x) > 0);
    if (dmn.length <= 1)
        return dmn[0];
    var halfInd = Math.floor(dmn.length / 2);
    var firstHalf = dmn.slice(0, halfInd);
    var secondHalf = dmn.slice(halfInd, dmn.length);
    var firstWeight = firstHalf.map(getWeight).reduce((a, b) => a + b);
    var secondWeight = secondHalf.map(getWeight).reduce((a, b) => a + b);
    var cutoff = firstWeight / (firstWeight + secondWeight);
    if (urand <= cutoff) {
        return weightedRandom(firstHalf, getWeight, urand / cutoff);
    }
    else {
        return weightedRandom(secondHalf, getWeight, (urand - cutoff) / (1 - cutoff));
    }
}
exports.weightedRandom = weightedRandom;
function weightedRandomEdge(dmnA, dmnB, getWeight) {
    var indsA = [...Array(dmnA.length).keys()];
    var weightsA = indsA.map((i) => dmnB.map((y) => getWeight(dmnA[i], y)).reduce((x, y) => x + y));
    var chosenA = dmnA[weightedRandom(indsA, (i) => weightsA[i], Math.random())];
    var chosenB = weightedRandom(dmnB, (y) => getWeight(chosenA, y), Math.random());
    return [chosenA, chosenB];
}
exports.weightedRandomEdge = weightedRandomEdge;
