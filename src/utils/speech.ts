export const gSynth = () => { return window.speechSynthesis; };

function getVoice(voiceName: string): SpeechSynthesisVoice {
    var voices = gSynth().getVoices();
    for (var i in voices) {
        var voice = voices[i];
        if (voice.name == voiceName) {
            return voice;
        }
    }
    return voices[0];   // Default behavior
}

export function utter(
    txt: string, 
    voice: string, 
    rate: number = 1, 
    pitch: number = 1,
    callback: () => void = () => {}) {
    const utterThis = new SpeechSynthesisUtterance(txt);
    utterThis.voice = getVoice(voice);
    utterThis.rate = rate;
    utterThis.pitch = pitch;
    utterThis.onend = callback;
    // console.log(`Speaking "${txt}"...`);
    gSynth().speak(utterThis);
}

export type SpeechSettings = {
    voice: string,
    rate: number,
    pitch: number
}

export function defaultSpeechSettings() {
    try {
        var voices = gSynth().getVoices();
        return {
            voice: voices.length > 0 ? voices[0].name : "",
            rate: 1.0,
            pitch: 1.0
        };
    } catch (e) {
        return {
            voice: "",
            rate: 1.0,
            pitch: 1.0
        }
    }
}
defaultSpeechSettings();

export function makeAudioButtons(el: HTMLElement, ss: SpeechSettings): HTMLElement {
    var btns = el.querySelectorAll(".read-aloud-button");
    btns.forEach((btn) => {
        (<any>btn).onclick = (e: any) => {
            utter(e.target.alt, ss.voice, ss.rate, ss.pitch);
        }
    });
    return el;
}
