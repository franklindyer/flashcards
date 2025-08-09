"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDeckJSON = getDeckJSON;
exports.getDeckSlugs = getDeckSlugs;
exports.setDeckJSON = setDeckJSON;
exports.deleteDeck = deleteDeck;
const opfsRootP = () => navigator.storage.getDirectory();
const deckFolderP = () => opfsRootP().then((r) => r.getDirectoryHandle("decks", { create: true }));
const logFolderP = () => opfsRootP().then((r) => r.getDirectoryHandle("logs", { create: true }));
function getDeckJSON(deckSlug) {
    var deckHandleP = deckFolderP().then((f) => f.getFileHandle(deckSlug));
    return deckHandleP
        .then((h) => h.getFile()).then((f) => f.text())
        .catch((e) => { console.log(e); return ""; });
}
function getDeckSlugs() {
    var entriesP = deckFolderP().then((h) => Array.fromAsync(h.entries()));
    var namesP = entriesP.then((es) => es.map((entry) => entry[0]));
    return namesP;
}
function setDeckJSON(deckSlug, deckBlob) {
    var deckHandleP = deckFolderP().then((f) => f.getFileHandle(deckSlug, { create: true }));
    var deckWriteableP = deckHandleP.then((h) => h.createWritable());
    return deckWriteableP.then((w) => {
        w.write(deckBlob).then(() => w.close());
    }).catch((e) => console.log(`ERROR WRITING DECK: ${e}`));
}
function deleteDeck(deckSlug) {
    deckFolderP().then((h) => h.removeEntry(deckSlug));
}
