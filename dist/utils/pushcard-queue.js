"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultPushcardQueue = defaultPushcardQueue;
exports.makePCQEditor = makePCQEditor;
const utils_1 = require("utils/utils");
const editor_1 = require("core/editor");
function defaultPushcardQueue() {
    return {
        url: "",
        key: "",
        index: 0,
        pending: [],
        accepted: []
    };
}
function pullCards(pcq) {
    if (pcq.url.length == 0) {
        pcq.index = 0;
        pcq.pending = [];
        return (0, utils_1.trivialPromise)(pcq);
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
    });
}
function makePCQEditor(pcq) {
    var contDiv = document.createElement("div");
    var titleDiv = document.createElement("h3");
    titleDiv.textContent = "Suggested third-party cards";
    contDiv.appendChild(titleDiv);
    contDiv.classList.add("deck-menu-submenu");
    var urlEditor = (0, editor_1.singleTextFieldEditor)(pcq.url);
    urlEditor.element.placeholder = "url...";
    var keyEditor = (0, editor_1.singleTextFieldEditor)(pcq.key);
    urlEditor.element.placeholder = "name of queue...";
    contDiv.appendChild(urlEditor.element);
    contDiv.appendChild(keyEditor.element);
    var refreshBtn = document.createElement("button");
    refreshBtn.textContent = "Refresh";
    contDiv.appendChild(refreshBtn);
    var suggestionsDiv = document.createElement("div");
    contDiv.appendChild(suggestionsDiv);
    var suggestions = [];
    var yesNoEds = [];
    function refreshSuggestions(pcqNew) {
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
            var yesNoEd = (0, editor_1.acceptDeclineEditor)(cardData, cardSummary);
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
                if (ed.menuToState() == 0)
                    pcq.pending.unshift(sugg);
                if (ed.menuToState() == 1)
                    pcq.accepted.unshift(sugg);
            }
            return pcq;
        }
    };
}
