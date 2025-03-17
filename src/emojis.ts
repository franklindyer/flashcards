export function makeOpenmojiImage(emj: string) {
    const img = document.createElement('img');
    img.classList.add("openmoji-svg-image");
    var hex = emj.codePointAt(0)!.toString(16)!.toUpperCase();
    var url = `https://cdn.jsdelivr.net/gh/hfg-gmuend/openmoji/color/svg/${hex}.svg`
    img.src = url;
    return img;
}

export function replaceEmojis(el: HTMLElement) {
    var txtInside = el.innerHTML;
    txtInside = txtInside.replace(/\p{RGI_Emoji}/vg, function(match, capture) {
        return new XMLSerializer().serializeToString(makeOpenmojiImage(match));
    });
    el.innerHTML = txtInside;
}
