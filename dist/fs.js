"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setDeckJSON = exports.getDeckJSON = void 0;
const opfsRootP = navigator.storage.getDirectory();
const deckFolderP = opfsRootP.then((r) => r.getDirectoryHandle("decks", { create: true }));
function getDeckJSON(deckSlug) {
    var deckHandleP = deckFolderP.then((f) => f.getFileHandle(deckSlug));
    return deckHandleP
        .then((h) => h.getFile()).then((f) => f.text())
        .catch((e) => { console.log(e); return ""; });
}
exports.getDeckJSON = getDeckJSON;
function setDeckJSON(deckSlug, deckBlob) {
    console.log("SET DECK JSON");
    var deckHandleP = deckFolderP.then((f) => f.getFileHandle(deckSlug, { create: true }));
    var deckWriteableP = deckHandleP.then((h) => h.createWritable());
    return deckWriteableP.then((w) => {
        w.write(deckBlob).then(() => w.close());
    }).catch((e) => console.log(`ERROR WRITING DECK: ${e}`));
}
exports.setDeckJSON = setDeckJSON;
