import {
    guidGenerator,
    getHostname
} from "utils/utils"
import {
    FlashcardDeck
} from "core/flashcard-deck"

export function setLogRemote(url: string) {
    localStorage.setItem("syncserver", url);
}

export function getLogRemote(): string | null {
    return localStorage.getItem("syncserver");
}

export function setLogKey(key: string) {
    localStorage.setItem("synckey", key);
}

export function getLogKey(): string | null {
    return localStorage.getItem("synckey");
}

export function validateLogCreds(goodCallback: (r: string, k: string) => void, badCallback: () => void) {
    var remote = getLogRemote()!;
    var key = getLogKey()!;

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
    } catch (e) {
        badCallback();
    }
}

export function promptForLogCreds(successCallback: (r: string, k: string) => void = (_: string, __: string) => {}) {
    var remote = window.prompt("Enter the URL of your logging server.") || "";
    var key = window.prompt("Enter your key with the logging server.") || "";
    setLogRemote(remote);
    setLogKey(key);
    validateLogCreds(
        (_, __) => {
            alert("Successfully paired with logging server.");
            successCallback(remote, key);
        },
        () => alert("Error attempting to connect to logging server. Try again.")
    );
}

export function logPost(data: any, doAlert: boolean = false): void {
    var badCallback = () => alert("Could not log deck data. Please ensure your logging server is set up.");
    var host = getHostname();

    if (Object.keys(data).length == 0) { // Avoid logging empty records
        return;
    }   
 
    validateLogCreds(
        (remote, key) => {
            try {
                fetch(`${remote}/put`, {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ host: host, key: key, data: data })
                }).catch(res => badCallback());
            } catch (e) {
                badCallback();
            }
        },
        () => badCallback()
    );
}

