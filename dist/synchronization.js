"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHostname = getHostname;
exports.setRemote = setRemote;
exports.getRemote = getRemote;
exports.setSyncKey = setSyncKey;
exports.getSyncKey = getSyncKey;
exports.validateSyncCreds = validateSyncCreds;
exports.promptForSyncCreds = promptForSyncCreds;
exports.syncUploadDeck = syncUploadDeck;
exports.syncDownloadDeck = syncDownloadDeck;
const utils_1 = require("./utils");
function getHostname() {
    var host = localStorage.getItem("host");
    if (host === null) {
        host = (0, utils_1.guidGenerator)();
        localStorage.setItem("host", host);
    }
    return host;
}
function setRemote(url) {
    localStorage.setItem("syncserver", url);
}
function getRemote() {
    return localStorage.getItem("syncserver");
}
function setSyncKey(key) {
    localStorage.setItem("synckey", key);
}
function getSyncKey() {
    return localStorage.getItem("synckey");
}
function validateSyncCreds(goodCallback, badCallback) {
    var remote = getRemote();
    var key = getSyncKey();
    try {
        fetch(`${remote}/status`, {
            method: "POST",
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ key: key })
        }).then(res => res.json())
            .then(res => goodCallback(remote, key))
            .catch(res => badCallback());
    }
    catch (e) {
        badCallback();
    }
}
function promptForSyncCreds() {
    var remote = window.prompt("Enter the URL of your synchronization server.") || "";
    var key = window.prompt("Enter your key with the synchronization server.") || "";
    setRemote(remote);
    setSyncKey(key);
    validateSyncCreds((_, __) => alert("Successfully paired with synchronization server."), () => alert("Error attempting to connect to synchronization server. Try again."));
}
function syncUploadDeck(deck) {
    var badCallback = () => alert("Could not upload deck. Ensure your sync server is set up.");
    var host = getHostname();
    validateSyncCreds((remote, key) => {
        try {
            fetch(`${remote}/put`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ host: host, key: key, id: deck.slug, data: JSON.stringify(deck) })
            }).catch(res => badCallback());
        }
        catch (e) {
            badCallback();
        }
    }, () => badCallback());
}
function syncDownloadDeck(slug, setDeck) {
    var badCallback = () => alert("Could not download deck. Ensure your sync server is set up and that the deck ID is correct.");
    var host = getHostname();
    validateSyncCreds((remote, key) => {
        try {
            fetch(`${remote}/get`, {
                method: "POST",
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ host: host, key: key, id: slug })
            }).then(res => res.json())
                .then(res => {
                if (confirm("Are you sure you want to download this deck? Any local version will be overwritten.")) {
                    setDeck(res['data']);
                    alert("Deck downloaded successfully.");
                }
            })
                .catch(res => badCallback());
        }
        catch (e) {
            badCallback();
        }
    }, () => badCallback());
}
