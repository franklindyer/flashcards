"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gSynth = void 0;
exports.utter = utter;
exports.defaultSpeechSettings = defaultSpeechSettings;
exports.makeAudioButtons = makeAudioButtons;
const gSynth = () => { return window.speechSynthesis; };
exports.gSynth = gSynth;
function getVoice(voiceName) {
    var voices = (0, exports.gSynth)().getVoices();
    for (var i in voices) {
        var voice = voices[i];
        if (voice.name == voiceName) {
            return voice;
        }
    }
    return voices[0]; // Default behavior
}
function utter(txt, voice, rate = 1, pitch = 1, callback = () => { }) {
    const utterThis = new SpeechSynthesisUtterance(txt);
    utterThis.voice = getVoice(voice);
    utterThis.rate = rate;
    utterThis.pitch = pitch;
    utterThis.onend = () => {
        callback();
    };
    utterThis.onerror = (e) => {
        console.log(e);
        callback();
    };
    // console.log(`Speaking "${txt}"...`);
    (0, exports.gSynth)().speak(utterThis);
}
function defaultSpeechSettings() {
    try {
        var voices = (0, exports.gSynth)().getVoices();
        return {
            voice: voices.length > 0 ? voices[0].name : "",
            rate: 1.0,
            pitch: 1.0
        };
    }
    catch (e) {
        return {
            voice: "",
            rate: 1.0,
            pitch: 1.0
        };
    }
}
defaultSpeechSettings();
function makeAudioButtons(el, ss) {
    var btns = el.querySelectorAll(".read-aloud-button");
    btns.forEach((btn) => {
        btn.onclick = (e) => {
            utter(e.target.alt, ss.voice, ss.rate, ss.pitch);
        };
    });
    return el;
}
