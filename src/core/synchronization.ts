import {
    guidGenerator
} from "utils/utils"
import {
    FlashcardDeck
} from "core/flashcard-deck"

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

export function validateSyncCreds(goodCallback: (r: string, k: string) => void, badCallback: () => void) {
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
          .then(res => goodCallback(remote, key))
          .catch(res => badCallback());
    } catch (e) {
        badCallback();
    }
}

export function promptForSyncCreds() {
    var remote = window.prompt("Enter the URL of your synchronization server.") || "";
    var key = window.prompt("Enter your key with the synchronization server.") || "";
    setRemote(remote);
    setSyncKey(key);
    validateSyncCreds(
        (_, __) => alert("Successfully paired with synchronization server."),
        () => alert("Error attempting to connect to synchronization server. Try again.")
    );
}

export function syncUploadDeck(deck: FlashcardDeck<any>, doAlert: boolean = false): void {
    var badCallback = () => alert("Could not upload deck. Ensure your sync server is set up.");
    var host = getHostname();
    validateSyncCreds(
        (remote, key) => {
            try {
                fetch(`${remote}/put`, {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ host: host, key: key, id: deck.slug, data: JSON.stringify(deck) })
                }).then(res => {
                    if (doAlert)
                        alert("Deck uploaded successfully.")
                })
                  .catch(res => badCallback());
            } catch (e) {
                badCallback();
            }
        },
        () => badCallback()
    );
}

export function syncDownloadDeck(slug: string, lastSavedLocal: Date, setDeck: (deckstr: string) => void, resolve: () => void = () => {}): void {
    var badCallback = () => alert("Could not download deck. Ensure your sync server is set up and that the deck ID is correct.");
    var host = getHostname();
    validateSyncCreds(
        (remote, key) => {
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
                        var lastSavedRemote = new Date(JSON.parse(res['data']).lastSaved);
                        var remoteIsMoreRecent = lastSavedRemote > lastSavedLocal;
                        if (remoteIsMoreRecent && confirm("Are you sure you want to download this deck? Any local version will be overwritten.")) { 
                            setDeck(res['data']);
                            alert("Deck downloaded successfully.");
                            resolve();
                        } else {
                            resolve();
                        } 
                  })
                  .catch(res => {
                    badCallback();
                    resolve();
                  });
            } catch (e) {
                badCallback();
                resolve();
            }
        },
        () => {
            badCallback();
            resolve();
        }
    );
}
