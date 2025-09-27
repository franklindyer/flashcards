export interface IDictionary<a> {
    [key: string]: a;
}

// https://stackoverflow.com/questions/6860853/generate-random-string-for-div-id
export function guidGenerator(): string {
    var S4 = function() {
       return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}

export function arrayReindex<a>(ls: a[]): a[] { 
    return ls.filter((_) => true);
}

export function shuffleArr<a>(ls: a[]): a[] {
    return ls
        .map((v) => ({ val: v, key: Math.random() }))
        .sort((x, y) => x.key - y.key )
        .map((v) => v.val);
}

export function makeDict<a>(items: a[], key: (x: a) => string) {
    var d: IDictionary<a> = {};
    items.map((x) => { d[key(x)] = x; });
    return d;
}

// https://stackoverflow.com/questions/3665115/how-to-create-a-file-in-memory-for-user-to-download-but-not-through-server
export function downloadText(filename: string, text: string) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

export const getUuid = require("uuid-by-string");

export function trivialPromise<a>(x: a): Promise<a> {
    return new Promise((resolve, _) => { resolve(x); });
}

export function getSRFutureDateInfo(d: Date): string {
    var dateNow = new Date();
    var seconds: number = Math.floor((new Date(d).getTime() - dateNow.getTime())/1000);
    var minutes: number = Math.floor(seconds/60);
    var hours: number = Math.floor(minutes/60);
    var days: number = Math.floor(hours/24);
    if (seconds < 0) return "now";
    else if (hours == 0) return "in under an hour";
    else if (hours == 1) return "in an hour";
    else if (hours < 24) return `in ${hours} hours`;
    else if (days == 1) return "in a day";
    else return `in ${days} days`;
}

export function showLoadingIcon() {
    var cont = document.getElementById("flashcard-container")!;
    var loadingAnim = document.createElement("div");
    [...new Array(12)].map((x) => {
        var subDiv = document.createElement("div");
        loadingAnim.appendChild(subDiv);
    });
    loadingAnim.id = "card-loading-spinner";
    loadingAnim.classList.add("lds-spinner");
    cont.appendChild(loadingAnim);
}

export function hideLoadingIcon() {
    var loadingAnim = document.getElementById("card-loading-spinner");
    if (loadingAnim != null)
        loadingAnim.remove();
}

export function iconButton(imgUrl: string, effect: () => void): HTMLElement {
    var btn = document.createElement("button");
    var icon = document.createElement("img");
    btn.appendChild(icon);
    btn.classList.add("deck-editor-button");
    icon.src = imgUrl;
    btn.onclick = effect;
    return btn;
}

export function recursiveRepairJSON(obj: any, defaultObj: any, omitKeys: string[] = []) {
    if (typeof obj === 'string' || obj instanceof String)
        return obj;

    var objKeys = Object.keys(obj);
    var defaultKeys = Object.keys(defaultObj);

    for (var i in defaultKeys) {
        var k = defaultKeys[i];
        if (omitKeys.includes(k))
            continue;        

        if (!(k in obj)) {
            obj[k] = JSON.parse(JSON.stringify(defaultObj[k]));
        }

        if (["number", "string", "boolean", "null"].includes(typeof obj[k]) || obj[k] === null)
            continue;

        if (Array.isArray(obj[k])) {
            if (defaultObj[k].length > 0) {
                for (var j in obj[k]) {
                    obj[k][j] = recursiveRepairJSON(obj[k][j], defaultObj[k][0], omitKeys);
                }
            }
        } else if (typeof obj[k] === "object") {
            obj[k] = recursiveRepairJSON(obj[k], defaultObj[k], omitKeys);
        }
    }
   
    for (var i in objKeys) {
        var k = objKeys[i];
        if (!(k in defaultObj)) {
            delete obj[k];
        }
    }

    return obj;
}

export function recursiveRepairEachValueJSON(objDict: any, defaultObj: any, omitKeys: string[] = []) {
    console.log(objDict);
    var objDictKeys = Object.keys(objDict);
    for (var i in objDictKeys) {
        var k = objDictKeys[i];
        objDict[k] = recursiveRepairJSON(objDict[k], defaultObj, omitKeys);
    }
    return objDict;
}
