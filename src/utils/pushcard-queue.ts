import {
    MenuComponent
} from "menus/menus"
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
        pcq.pending = pcq.pending.concat(results);
        return pcq;
    })
}

class PushcardComponent extends HTMLElement
                        implements MenuComponent<PushcardQueue> {
    root = this;

    defaultElement?: HTMLElement;
    entriesDiv?: HTMLElement;
    serverURL?: HTMLElement;
    serverKey?: HTMLElement;
 
    st: PushcardQueue = defaultPushcardQueue();
    suggestions: [number, MenuComponent<string>][] = [];

    constructor() {
        super();
    }

    fieldName() {
        return this.getAttribute("name")!;
    }

    lazyInit() {
        if (this.defaultElement) {
            return;
        }
        this.defaultElement = this.querySelector(".menu-pushcard-default-entry")!;
        this.defaultElement.remove();

        this.serverURL = this.querySelector(".menu-pushcard-server-url")!;
        this.serverKey = this.querySelector(".menu-pushcard-server-key")!;
        this.entriesDiv = this.querySelector(".menu-pushcard-entries-div")!;
        var refreshBtn = <any>this.querySelector(".menu-pushcard-refresh-button")!;
        refreshBtn.onclick = (e: any) => {
            pullCards(this.getState()).then((st2) => {
                this.setState(st2);
            });    
        };

        setTimeout(() => refreshBtn.click(), 1000);
    }

    getState() {
        this.lazyInit();
        this.st.accepted = this.suggestions.filter((r) => r[1].getState() == "accept").map((r) => this.st.pending[r[0]]); 
        this.st.pending = this.suggestions.filter((r) => r[1].getState() == "pending").map((r) => this.st.pending[r[0]]); 
        this.st.url = (<any>this.serverURL).getState();
        this.st.key = (<any>this.serverKey).getState();
        this.setState(this.st);
        return this.st;
    }

    setState(pcq: PushcardQueue) {
        this.lazyInit();
        this.suggestions = [];
        this.st = pcq;
        (<any>this.serverURL).setState(this.st.url);
        (<any>this.serverKey).setState(this.st.key);
        this.entriesDiv!.innerHTML = "";
        [...Array(this.st.pending.length).keys()].forEach((i: number) => {
            var entryMenu = <HTMLElement>this.defaultElement!.cloneNode(true);
            var previewLabel = entryMenu.querySelector(".menu-pushcard-entry-label")!;
            var acceptSelect = <any>entryMenu.querySelector(".menu-pushcard-accept-select")!;
            previewLabel.textContent = this.st.pending[i].summary;
            this.suggestions.push([i, acceptSelect]);
            this.entriesDiv!.appendChild(entryMenu);
        });
    }
} 

window.customElements.define("menu-pushcard", PushcardComponent, { extends: "div" });
