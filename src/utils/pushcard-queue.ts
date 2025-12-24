import {
    trivialPromise
} from "utils/utils"

export type PushcardQueue = {
    url: string,
    key: string,
    epoch: number,
    pending: any[],
    accepted: any[]
};

export function defaultPushcardQueue(): PushcardQueue {
    return {
        url: "",
        key: "",
        epoch: 0,
        pending: [],
        accepted: []
    };
}

function pullCards(pcq: PushcardQueue): Promise<PushcardQueue> {
    if (pcq.url.length == 0) {
        pcq.epoch = 0;
        pcq.pending = [];
        return trivialPromise(pcq);
    }
    return fetch(`${pcq.url}/get`, {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            key: pcq.key
        })
    }).then((r) => r.json())
      .then((r) => {
        var results = r.results;
        results = results.filter((r: any) => r.epoch > pcq.epoch);
        if (results.length > 0) {
            pcq.epoch = Math.max(...results.map((r: any) => r.epoch));
        }
        console.log(results);
        pcq.pending = pcq.pending.concat(results);
        return pcq;
    })
}
