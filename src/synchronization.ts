import {
    guidGenerator
} from "./utils"


export function getHostname() {
    var host = localStorage.getItem("host");
    if (host === null) {
        host = guidGenerator();
        localStorage.setItem("host", host);
    }
    return host;
}

export function setRemote(url: string) {
    localStorage.setItem("syncserver", url);
}

export function getRemote(): string | null {
    return localStorage.getItem("syncserver");
}

export function setSyncKey(key: string) {
    localStorage.setItem("synckey", key);
}

export function getSyncKey(): string | null {
    return localStorage.getItem("synckey");
}

export function validateSyncCreds() {
    var remote = getRemote()!;
    var key = getSyncKey()!;

    try {
        fetch(`${remote}/status`, {
            method: "POST",
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ key: key })
        }).then(res => res.json())
          .then(res => alert("Synchronization server successfully connected."))
          .catch(res => alert("Error setting up synchronization server."));
    } catch (e) {
        alert("Error setting up synchronization server.");
    }
}

export function promptForSyncCreds() {
    var remote = window.prompt("Enter the URL of your synchronization server.") || "";
    var key = window.prompt("Enter your key with the synchronization server.") || "";
    setRemote(remote);
    setSyncKey(key);
    validateSyncCreds();
}
