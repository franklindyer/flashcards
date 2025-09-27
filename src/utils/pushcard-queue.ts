import {
    trivialPromise
} from "utils/utils"
import {
    StateEditor,
    singleTextFieldEditor,
    acceptDeclineEditor,
    multipleEditors
} from "core/editor"

export type PushcardQueue = {
    url: string,
    key: string,
    index: number,
    pending: any[],
    accepted: any[]
};

export function defaultPushcardQueue(): PushcardQueue {
    return {
        url: "",
        key: "",
        index: 0,
        pending: [],
        accepted: []
    };
}

function pullCards(pcq: PushcardQueue): Promise<PushcardQueue> {
    if (pcq.url.length == 0) {
        pcq.index = 0;
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
        var serverIndex = r.index;
        var results = r.results;
        var deltaIndex = r.index - pcq.index;
        pcq.index = serverIndex;
        if (deltaIndex > 0) {
            pcq.pending = results.slice(0, deltaIndex).concat(pcq.pending);
        }
        return pcq;
    })
}

export function makePCQEditor(pcq: PushcardQueue): StateEditor<PushcardQueue> {
    var contDiv = document.createElement("div");
    var titleDiv = document.createElement("h3");
    titleDiv.textContent = "Suggested third-party cards";
    contDiv.appendChild(titleDiv);
    contDiv.classList.add("deck-menu-submenu");
    var urlEditor = singleTextFieldEditor(pcq.url);
    (<HTMLInputElement>urlEditor.element).placeholder = "url...";
    var keyEditor = singleTextFieldEditor(pcq.key);
    (<HTMLInputElement>urlEditor.element).placeholder = "name of queue...";
    contDiv.appendChild(urlEditor.element);
    contDiv.appendChild(keyEditor.element);
    var refreshBtn = document.createElement("button");
    refreshBtn.textContent = "Refresh";
    contDiv.appendChild(refreshBtn);

    var suggestionsDiv = document.createElement("div");
    contDiv.appendChild(suggestionsDiv);
    var suggestions: any[] = [];
    var yesNoEds: StateEditor<number>[] = [];

    function refreshSuggestions(pcqNew: PushcardQueue) {
        suggestions = [];
        yesNoEds = [];
        pcq.url = urlEditor.menuToState();
        pcq.key = keyEditor.menuToState();
        pcq.index = pcqNew.index;
        pcq.pending = pcqNew.pending;
        suggestionsDiv.innerHTML = "";
        for (var i in pcq.pending) {
            var opt = pcq.pending[i];
            var cardData = opt.data;
            var cardSummary = opt.summary;
            var yesNoEd = acceptDeclineEditor(cardData, cardSummary);
            suggestions.push(cardData);
            yesNoEds.push(yesNoEd);
            suggestionsDiv.appendChild(yesNoEd.element);
        }
    }

    refreshSuggestions(pcq);
    pullCards(pcq).then(refreshSuggestions);
    refreshBtn.onclick = (e) => { pullCards(pcq).then(refreshSuggestions); };

    return {
        element: contDiv,
        menuToState: () => {
            pcq.url = urlEditor.menuToState();
            pcq.key = keyEditor.menuToState();
            pcq.pending = [];
            pcq.accepted = [];
            for (var i in suggestions) {
                var sugg = suggestions[i];
                var ed = yesNoEds[i];
                if (ed.menuToState() == 0) pcq.pending.unshift(sugg);
                if (ed.menuToState() == 1) pcq.accepted.unshift(sugg);
            }
            return pcq;
        }
    }
}
