import {
    IDictionary
} from "./utils"

export class Preloader<a> {
    values: IDictionary<a[]> = {};
    valueCounts: IDictionary<number> = {};
    numPreload: number;

    delaySeconds: number = 0.1;

    constructor(numPreload: number) { 
        this.numPreload = numPreload;
    }

    fillCacheForKey(k: string, fetcher: (k: string) => Promise<a>) {
        var valuesNeeded = this.numPreload - this.valueCounts[k];
        this.valueCounts[k] = this.numPreload;
        var i = 0;
        for (i = 0; i < valuesNeeded; i++) {
            fetcher(k).then((x) => this.values[k].push(x));
        } 
    }

    addKey(k: string, fetcher: (k: string) => Promise<a>) {
        if (this.values[k] === undefined) {
            this.values[k] = [];
            this.valueCounts[k] = 0;
        }
        this.fillCacheForKey(k, fetcher);
    }

    getKey(k: string, fetcher: (k: string) => Promise<a>): Promise<a> {
        this.addKey(k, fetcher);
        if (this.values[k].length > 0) {
            return new Promise((resolve, _) => {
                this.valueCounts[k] += -1;
                var nextVal = this.values[k].shift()!;
                this.fillCacheForKey(k, fetcher);
                resolve(nextVal);
            });
        } else {
            return new Promise((resolve, _) => setTimeout(() => resolve(this.getKey(k, fetcher)), 1000*this.delaySeconds));
        }
    }
}
