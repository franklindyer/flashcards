"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const flashcard_1 = require("./flashcard");
const flashcard_template_1 = require("./flashcard-template");
const speech_1 = require("./speech");
class TranscriptFlashcardTemplate extends flashcard_template_1.FlashcardTemplate {
    getName() { return "transcript-template"; }
    render(data) {
        var container = document.createElement("div");
        var playBtn = document.createElement("img");
        playBtn.src = "/static/images/speaker.png";
        playBtn.classList.add("transcription-audio-button");
        playBtn.onclick = (e) => {
            var ss = data.speechSettings;
            (0, speech_1.utter)(data.text, ss.voice, ss.rate, ss.pitch);
        };
        container.appendChild(playBtn);
        var fl = new flashcard_1.Flashcard(container, data.text);
        return fl;
    }
}
(0, flashcard_template_1.registerTemplate)(new TranscriptFlashcardTemplate());
