const opfsRootP = navigator.storage.getDirectory();
const deckFolderP = opfsRootP.then((r) => r.getDirectoryHandle("decks", { create: true }));

export function getDeckJSON(deckSlug: string): Promise<string> {
    var deckHandleP = deckFolderP.then((f) => f.getFileHandle(deckSlug));
    return deckHandleP
            .then((h) => h.getFile()).then((f) => f.text())
            .catch((e) => { console.log(e); return "";});
}

export function setDeckJSON(deckSlug: string, deckBlob: string) {
    console.log("SET DECK JSON");
    var deckHandleP = deckFolderP.then((f) => f.getFileHandle(deckSlug, { create: true }));
    var deckWriteableP = deckHandleP.then((h) => h.createWritable());
    return deckWriteableP.then((w) => { 
        w.write(deckBlob).then(() => w.close());
    }).catch((e) => console.log(`ERROR WRITING DECK: ${e}`));
}
