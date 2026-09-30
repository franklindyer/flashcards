"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setSyncRemote = setSyncRemote;
exports.getSyncRemote = getSyncRemote;
exports.setSyncKey = setSyncKey;
exports.getSyncKey = getSyncKey;
exports.validateSyncCreds = validateSyncCreds;
exports.promptForSyncCreds = promptForSyncCreds;
exports.syncUploadDeck = syncUploadDeck;
exports.syncDownloadDeck = syncDownloadDeck;
const utils_1 = require("utils/utils");
const CONFIRM_DOWNLOAD_MSG = "A more recent version of this deck was found on the sync server. Do you want to download it, overwriting your current copy of the deck?";
function setSyncRemote(url) {
    localStorage.setItem("syncserver", url);
}
function getSyncRemote() {
    return localStorage.getItem("syncserver");
}
function setSyncKey(key) {
    localStorage.setItem("synckey", key);
}
function getSyncKey() {
    return localStorage.getItem("synckey");
}
function validateSyncCreds(goodCallback, badCallback) {
    var remote = getSyncRemote();
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
function promptForSyncCreds(successCallback = (_, __) => { }) {
    var remote = window.prompt("Enter the URL of your synchronization server.") || "";
    var key = window.prompt("Enter your key with the synchronization server.") || "";
    setSyncRemote(remote);
    setSyncKey(key);
    validateSyncCreds((_, __) => {
        alert("Successfully paired with synchronization server.");
        successCallback(remote, key);
    }, () => alert("Error attempting to connect to synchronization server. Try again."));
}
function syncUploadDeck(deck, doAlert = false) {
    var badCallback = () => alert("Could not upload deck. Ensure your sync server is set up.");
    var host = (0, utils_1.getHostname)();
    validateSyncCreds((remote, key) => {
        try {
            fetch(`${remote}/put`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ host: host, key: key, id: deck.slug, data: deck })
            }).then(res => {
                if (doAlert)
                    alert("Deck uploaded successfully.");
            })
                .catch(res => badCallback());
        }
        catch (e) {
            badCallback();
        }
    }, () => badCallback());
}
function syncDownloadDeck(slug, lastSavedLocal, setDeck, resolve = () => { }) {
    var badCallback = () => alert("Could not download deck. Ensure your sync server is set up and that the deck ID is correct.");
    var host = (0, utils_1.getHostname)();
    // To prevent unnecessary lag, don't pull unless this deck was last saved over 2 minutes ago
    var timeSinceLastSave = ((new Date()).getTime() - lastSavedLocal.getTime()) / 1000;
    if (timeSinceLastSave < 120) {
        resolve();
        return;
    }
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
                console.log(res);
                var lastSavedRemote = new Date(res['data'].lastSaved);
                console.log(lastSavedRemote);
                console.log(lastSavedLocal);
                var remoteIsMoreRecent = lastSavedRemote > lastSavedLocal;
                if (remoteIsMoreRecent && confirm(CONFIRM_DOWNLOAD_MSG)) {
                    setDeck(JSON.stringify(res['data']), () => {
                        alert("Deck downloaded successfully.");
                        resolve();
                    });
                }
                else {
                    console.log("REMOTE IS NOT MORE RECENT THAN LOCAL");
                    resolve();
                }
            })
                .catch(res => {
                badCallback();
                resolve();
            });
        }
        catch (e) {
            console.log(e);
            badCallback();
            resolve();
        }
    }, () => {
        badCallback();
        resolve();
    });
}
