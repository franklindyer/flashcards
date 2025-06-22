import {
    StateEditor,
    scrollNumberEditor,
    optionsEditor
} from "./editor"

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

export function speechSettingsEditor(ss: SpeechSettings): StateEditor<SpeechSettings> {
    var voices = gSynth().getVoices().map((v) => v.name);
    var voiceEditor = optionsEditor(ss.voice, voices, (v) => `${getVoice(v).name} (${getVoice(v).lang})`);
    var rateEditor = scrollNumberEditor("Speech rate: ", ss.rate, 0.5, 2.0, 0.05);
    var pitchEditor = scrollNumberEditor("Speech pitch: ", ss.pitch, 0, 2, 0.05);

    var contDiv = document.createElement("div");
    var accordion = document.createElement("details");
    var accordionSummary = document.createElement("summary");
    accordionSummary.textContent = "Text-to-speech settings";
    accordion.appendChild(accordionSummary);
    [voiceEditor, rateEditor, pitchEditor].map((ed) => accordion.appendChild(ed.element));
    contDiv.appendChild(accordion);

    return {
        element: contDiv,
        menuToState: () => { return {
            voice: voiceEditor.menuToState(),
            rate: rateEditor.menuToState(),
            pitch: pitchEditor.menuToState()
        }}
    }
}

// utter("Hello, my name is Albert.", gSynth.getVoices()[0], 1, 1);
