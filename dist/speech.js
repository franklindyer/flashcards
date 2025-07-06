"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gSynth = void 0;
exports.utter = utter;
exports.defaultSpeechSettings = defaultSpeechSettings;
exports.speechSettingsEditor = speechSettingsEditor;
const editor_1 = require("./editor");
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
    utterThis.onend = callback;
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
function speechSettingsEditor(ss) {
    var voices = (0, exports.gSynth)().getVoices().map((v) => v.name);
    var voiceEditor = (0, editor_1.optionsEditor)(ss.voice, voices, (v) => `${getVoice(v).name} (${getVoice(v).lang})`);
    var rateEditor = (0, editor_1.scrollNumberEditor)("Speech rate: ", ss.rate, 0.5, 2.0, 0.05);
    var pitchEditor = (0, editor_1.scrollNumberEditor)("Speech pitch: ", ss.pitch, 0, 2, 0.05);
    var contDiv = document.createElement("div");
    var accordion = document.createElement("details");
    var accordionSummary = document.createElement("summary");
    accordionSummary.textContent = "Text-to-speech settings";
    accordion.appendChild(accordionSummary);
    [voiceEditor, rateEditor, pitchEditor].map((ed) => accordion.appendChild(ed.element));
    contDiv.appendChild(accordion);
    return {
        element: contDiv,
        menuToState: () => {
            return {
                voice: voiceEditor.menuToState(),
                rate: rateEditor.menuToState(),
                pitch: pitchEditor.menuToState()
            };
        }
    };
}
// utter("Hello, my name is Albert.", gSynth.getVoices()[0], 1, 1);
