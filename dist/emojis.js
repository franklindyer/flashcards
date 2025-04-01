"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.replaceEmojis = exports.buildOpenmojiImage = void 0;
fetch("/openmoji.txt").then((r) => r.text().then((s) => {
    var lns = s.split('\n');
    var pts = lns.map((ln) => ln.split('\t'));
    global.emojiDict = {};
    for (var pt in pts) {
        global.emojiDict[pt[0]] = pt[1];
    }
}));
/* export function makeOpenmojiImage(emjSeq: string) {
    var emjs = emjSeq.split("\u200D");
    var hex = emjs.map((emj) => emj.codePointAt(0)!.toString(16)!.toUpperCase());
    var imgId = hex.join("-200D-");
    return buildOpenmojiImage(imgId);
}

export function makeOpenmojiFlagImage(emjFlag: string) {
    var imgId = [...emjFlag].map((emj) => emj.codePointAt(0)!.toString(16)!.toUpperCase()).join("-");
    return buildOpenmojiImage(imgId);
} */
function buildOpenmojiImage(emjId) {
    const img = document.createElement('img');
    img.classList.add("openmoji-svg-image");
    var url = `https://cdn.jsdelivr.net/gh/hfg-gmuend/openmoji/color/svg/${emjId}.svg`;
    img.src = url;
    return img;
}
exports.buildOpenmojiImage = buildOpenmojiImage;
function replaceEmojis(el) {
    var txtInside = el.innerHTML;
    // txtInside = txtInside.replace(/[🇦-🇿]{2}/ug, function(match, capture) {
    //     return new XMLSerializer().serializeToString(makeOpenmojiFlagImage(match));
    // });
    // txtInside = txtInside.replace(/(\p{RGI_Emoji}\u200D)*\p{RGI_Emoji}/vg, function(match, capture) {
    //     return new XMLSerializer().serializeToString(makeOpenmojiImage(match));
    // });
    txtInside = txtInside.replace(/<<([a-z\-]+)>>/g, function (match, capture) {
        return new XMLSerializer().serializeToString(buildOpenmojiImage(global.emojiDict[capture]));
    });
    el.innerHTML = txtInside;
}
exports.replaceEmojis = replaceEmojis;
