import {
    Flashcard
} from "core/flashcard"
import {
    FlashcardTemplate,
    gTemplateRegistry,
    registerTemplate
} from "core/flashcard-template"
import {
    SpeechSettings,
    utter
} from "utils/speech"

export type TranscriptCardData = {
    spokenText: string,
    hintText: string,
    speechSettings: SpeechSettings
};

class TranscriptFlashcardTemplate extends FlashcardTemplate<TranscriptCardData> {
    getName(): string { return "transcript-template"; }
   
    render(data: TranscriptCardData): Flashcard {
        var container = document.createElement("div");

        var playBtn = document.createElement("img");
        playBtn.src = "/speaker.png";
        playBtn.classList.add("transcription-audio-button");
        playBtn.onclick = (e) => {
            var ss = data.speechSettings;
            utter(data.spokenText, ss.voice, ss.rate, ss.pitch);
        };
        container.appendChild(playBtn);

        var fl = new Flashcard(container, data.hintText);
        return fl;
    }
}

registerTemplate(new TranscriptFlashcardTemplate());
