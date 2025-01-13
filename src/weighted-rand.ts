
export function weightedRandom<a>(dmn: a[], getWeight: (x: a) => number, urand: number): a {
    dmn = dmn.filter((x: a) => getWeight(x) > 0);
    if (dmn.length <= 1) return dmn[0];
    var halfInd = Math.floor(dmn.length/2);
    var firstHalf = dmn.slice(0, halfInd);
    var secondHalf = dmn.slice(halfInd, dmn.length);
    var firstWeight = firstHalf.map(getWeight).reduce((a,b)=>a+b);
    var secondWeight = secondHalf.map(getWeight).reduce((a,b)=>a+b);
    var cutoff = firstWeight/(firstWeight+secondWeight);
    if (urand <= cutoff) {
        return weightedRandom(firstHalf, getWeight, urand/cutoff);
    } else {
        return weightedRandom(secondHalf, getWeight, (urand-cutoff)/(1-cutoff));
    }
}

export function weightedRandomEdge<a, b>(
    dmnA: a[], 
    dmnB: b[],
    getWeight: (x: a, y: b) => number):
    [a, b] {
    var indsA = [...Array(dmnA.length).keys()];
    var weightsA = indsA.map((i) => dmnB.map((y) => getWeight(dmnA[i], y)).reduce((x,y)=>x+y));
    var chosenA = dmnA[weightedRandom(indsA, (i) => weightsA[i], Math.random())];
    var chosenB = weightedRandom(dmnB, (y) => getWeight(chosenA, y), Math.random());
    return [chosenA, chosenB];
}
