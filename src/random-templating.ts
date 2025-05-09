import {
    IDictionary
} from "./utils"


export type RandomSub = {
    index: number,
    group: number,
    options: string[]
}

export function preprocessStringSub(subString: string): [string, IDictionary<RandomSub>] {
    var subs: IDictionary<RandomSub> = {};
    var i = 0;
    const tplString = subString.replaceAll(/\{r([0-9]):([^\}]*)\}/g, function(m, g1, g2) {
        subs[i] = { index: i, group: +g1, options: g2.split(',') };
        var sub = `{${i}}`;
        i += 1;
        return sub;
    });
    return [tplString, subs]; 
}

export function validateStringSub(subString: string): boolean {
    var preproc = preprocessStringSub(subString);
    var subs = preproc[1];
    var counts: IDictionary<number> = {};
    for (var k in Object.keys(subs)) {
        var sub = subs[k];
        if (sub.group in Object.keys(counts)) {
            if (sub.options.length != counts[sub.group]) {
                return false
            }
        } else {
            counts[sub.group] = sub.options.length;
        }
    }
    return true;
}

export function randomizeStringSub(subString: string, rands: IDictionary<number> = {}): [string, IDictionary<number>] {
    var preproc = preprocessStringSub(subString);
    var outString = preproc[0];
    var subs = preproc[1];
    for (var k in Object.keys(subs)) {
        var sub = subs[k];
        if (!(sub.group in Object.keys(rands))) {
            rands[sub.group] = Math.floor(Math.random() * sub.options.length);
        }
        var sel = sub.options[rands[sub.group]];
        outString = outString.replace(`{${sub.index}}`, sel);
    }
    return [outString, rands];
}

// for (var i in [0,1,2,3,4,5,6,7,8,9]) {
//     var test = randomizeStringSub("{r0|I,you,he,she} {r0|want,want,wants,wants}");
//     console.log(test);
// }
