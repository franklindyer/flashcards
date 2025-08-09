import {
    IDictionary
} from "utils/utils"

export class Preloader<a> {
    values: IDictionary<a[]> = {};
    valueCounts: IDictionary<number> = {};
    numPreload: number;

    delaySeconds: number = 1.0;

    constructor(numPreload: number) { 
        this.numPreload = numPreload;
    }

    fillCacheForKey(k: string, fetcher: (k: string) => Promise<a[]>): Promise<void> {
        var valuesNeeded = this.numPreload - this.valueCounts[k];
        return fetcher(k).then((xs) => {
            if (xs === null || xs === undefined)
                return;
            xs.map((x) => this.values[k].push(x));
            this.valueCounts[k] = this.values[k].length; 
        }).catch((e) => { console.log(e); });
    }

    addKey(k: string, fetcher: (k: string) => Promise<a[]>): Promise<void> {
        if (this.values[k] === undefined) {
            this.values[k] = [];
            this.valueCounts[k] = 0;
        }
        return this.fillCacheForKey(k, fetcher);
    }

    getKey(k: string, fetcher: (k: string) => Promise<a[]>, maxAttempts: number = 3): Promise<a | undefined> {
        if (maxAttempts == 0)
            return new Promise((resolve, _) => resolve(undefined));
        var keyAddedPromise = this.addKey(k, fetcher);
        if (this.values[k].length > 0) {
            return new Promise((resolve, _) => {
                this.valueCounts[k] += -1;
                var nextVal = this.values[k].shift()!;
                this.fillCacheForKey(k, fetcher);
                resolve(nextVal);
            });
        } else {
            return keyAddedPromise.then((_) => this.getKey(k, fetcher, maxAttempts-1));
        }
    }
}
