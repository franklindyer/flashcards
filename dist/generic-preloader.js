"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Preloader = void 0;
class Preloader {
    values = {};
    valueCounts = {};
    numPreload;
    delaySeconds = 0.1;
    constructor(numPreload) {
        this.numPreload = numPreload;
    }
    fillCacheForKey(k, fetcher) {
        var valuesNeeded = this.numPreload - this.valueCounts[k];
        this.valueCounts[k] = this.numPreload;
        var i = 0;
        fetcher(k).then((xs) => xs.map((x) => this.values[k].push(x))).catch((e) => { console.log(e); });
    }
    addKey(k, fetcher) {
        if (this.values[k] === undefined) {
            this.values[k] = [];
            this.valueCounts[k] = 0;
        }
        this.fillCacheForKey(k, fetcher);
    }
    getKey(k, fetcher) {
        this.addKey(k, fetcher);
        if (this.values[k].length > 0) {
            return new Promise((resolve, _) => {
                this.valueCounts[k] += -1;
                var nextVal = this.values[k].shift();
                this.fillCacheForKey(k, fetcher);
                resolve(nextVal);
            });
        }
        else {
            return new Promise((resolve, _) => setTimeout(() => resolve(this.getKey(k, fetcher)), 1000 * this.delaySeconds));
        }
    }
}
exports.Preloader = Preloader;
