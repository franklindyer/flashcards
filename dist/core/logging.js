"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setLogRemote = setLogRemote;
exports.getLogRemote = getLogRemote;
exports.setLogKey = setLogKey;
exports.getLogKey = getLogKey;
exports.validateLogCreds = validateLogCreds;
exports.promptForLogCreds = promptForLogCreds;
exports.logPost = logPost;
const utils_1 = require("utils/utils");
function setLogRemote(url) {
    localStorage.setItem("logserver", url);
}
function getLogRemote() {
    return localStorage.getItem("logserver");
}
function setLogKey(key) {
    localStorage.setItem("logkey", key);
}
function getLogKey() {
    return localStorage.getItem("logkey");
}
function validateLogCreds(goodCallback, badCallback) {
    var remote = getLogRemote();
    var key = getLogKey();
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
function promptForLogCreds(successCallback = (_, __) => { }) {
    var remote = window.prompt("Enter the URL of your logging server.") || "";
    var key = window.prompt("Enter your key with the logging server.") || "";
    setLogRemote(remote);
    setLogKey(key);
    validateLogCreds((_, __) => {
        alert("Successfully paired with logging server.");
        successCallback(remote, key);
    }, () => alert("Error attempting to connect to logging server. Try again."));
}
function logPost(deckId, data, doAlert = false) {
    var badCallback = () => alert("Could not log deck data. Please ensure your logging server is set up.");
    var host = (0, utils_1.getHostname)();
    if (Object.keys(data).length == 0) { // Avoid logging empty records
        return;
    }
    var remote = getLogRemote();
    var key = getLogKey();
    if (remote === null || key === null) {
        return;
    }
    try {
        fetch(`${remote}/put`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ host: host, key: key, data: data, id: deckId })
        }).catch(res => badCallback());
    }
    catch (e) {
        badCallback();
    }
}
