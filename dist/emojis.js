"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.replaceEmojis = exports.buildOpenmojiImage = exports.openmojiDataPromise = void 0;
exports.openmojiDataPromise = fetch("/openmojis.txt").then((r) => r.text().then((s) => {
    var lns = s.split('\n');
    var pts = lns.map((ln) => ln.split('\t').map((pt) => pt.trim()));
    window.emojiDict = {};
    for (var i in pts) {
        var pt = pts[i];
        if (pt.length < 2)
            continue;
        window.emojiDict[pt[0]] = pt[1].toUpperCase();
    }
}));
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
    txtInside = txtInside.replace(/\|([a-z\-]*)\|/g, function (match, capture) {
        return new XMLSerializer().serializeToString(buildOpenmojiImage(window.emojiDict[capture]));
    });
    el.innerHTML = txtInside;
}
exports.replaceEmojis = replaceEmojis;
