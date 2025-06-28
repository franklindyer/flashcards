import {
    Flashcard
} from "./flashcard"
import {
    FlashcardTemplate,
    gTemplateRegistry,
    registerTemplate
} from "./flashcard-template"
import {
    SpeechSettings,
    utter
} from "./speech"

export type TranscriptCardData = {
    text: string,
    speechSettings: SpeechSettings
};

class TranscriptFlashcardTemplate extends FlashcardTemplate<TranscriptCardData> {
    getName(): string { return "transcript-template"; }
   
    render(data: TranscriptCardData): Flashcard {
        var container = document.createElement("div");

        var playBtn = document.createElement("img");
        playBtn.src = "/static/images/speaker.png";
        playBtn.classList.add("transcription-audio-button");
        playBtn.onclick = (e) => {
            var ss = data.speechSettings;
            utter(data.text, ss.voice, ss.rate, ss.pitch);
        };
        container.appendChild(playBtn);

        var fl = new Flashcard(container, data.text);
        return fl;
    }
}

registerTemplate(new TranscriptFlashcardTemplate());
