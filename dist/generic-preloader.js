"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Preloader = void 0;
class Preloader {
    values = {};
    valueCounts = {};
    numPreload;
    delaySeconds = 1.0;
    constructor(numPreload) {
        this.numPreload = numPreload;
    }
    fillCacheForKey(k, fetcher) {
        var valuesNeeded = this.numPreload - this.valueCounts[k];
        return fetcher(k).then((xs) => {
            if (xs === null || xs === undefined)
                return;
            xs.map((x) => this.values[k].push(x));
            this.valueCounts[k] = this.values[k].length;
        }).catch((e) => { console.log(e); });
    }
    addKey(k, fetcher) {
        if (this.values[k] === undefined) {
            this.values[k] = [];
            this.valueCounts[k] = 0;
        }
        return this.fillCacheForKey(k, fetcher);
    }
    getKey(k, fetcher, maxAttempts = 3) {
        if (maxAttempts == 0)
            return new Promise((resolve, _) => resolve(undefined));
        var keyAddedPromise = this.addKey(k, fetcher);
        if (this.values[k].length > 0) {
            return new Promise((resolve, _) => {
                this.valueCounts[k] += -1;
                var nextVal = this.values[k].shift();
                this.fillCacheForKey(k, fetcher);
                resolve(nextVal);
            });
        }
        else {
            return keyAddedPromise.then((_) => this.getKey(k, fetcher, maxAttempts - 1));
        }
    }
}
exports.Preloader = Preloader;
