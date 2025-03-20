export function makeOpenmojiImage(emjSeq: string) {
    var emjs = emjSeq.split("\u200D");
    var hex = emjs.map((emj) => emj.codePointAt(0)!.toString(16)!.toUpperCase());
    var imgId = hex.join("-200D-");
    return buildOpenmojiImage(imgId);
}

export function makeOpenmojiFlagImage(emjFlag: string) {
    var imgId = [...emjFlag].map((emj) => emj.codePointAt(0)!.toString(16)!.toUpperCase()).join("-");
    return buildOpenmojiImage(imgId); 
}

export function buildOpenmojiImage(emjId: string) {
    const img = document.createElement('img');
    img.classList.add("openmoji-svg-image");
    var url = `https://cdn.jsdelivr.net/gh/hfg-gmuend/openmoji/color/svg/${emjId}.svg`;
    img.src = url;
    return img;
}

export function replaceEmojis(el: HTMLElement) {
    var txtInside = el.innerHTML;
    txtInside = txtInside.replace(/[🇦-🇿]{2}/ug, function(match, capture) {
        return new XMLSerializer().serializeToString(makeOpenmojiFlagImage(match));
    });
    txtInside = txtInside.replace(/(\p{RGI_Emoji}\u200D)*\p{RGI_Emoji}/vg, function(match, capture) {
        return new XMLSerializer().serializeToString(makeOpenmojiImage(match));
    });
    el.innerHTML = txtInside;
}
