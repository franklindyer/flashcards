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
        var playBtn = document.createElement("img");
        playBtn.src = "/speaker.png";
        playBtn.onclick = (e) => {
            var ss = data.speechSettings;
            utter(data.text, ss.voice, ss.rate, ss.pitch);
        };

        var fl = new Flashcard(playBtn, (answer: string) => data.text == answer, data.text);
        return fl;
    }
}

registerTemplate(new TranscriptFlashcardTemplate());
