"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const flashcard_1 = require("core/flashcard");
const flashcard_template_1 = require("core/flashcard-template");
const speech_1 = require("utils/speech");
class TranscriptFlashcardTemplate extends flashcard_template_1.FlashcardTemplate {
    getName() { return "transcript-template"; }
    render(data) {
        var container = document.createElement("div");
        var playBtn = document.createElement("img");
        playBtn.src = "/static/images/speaker.png";
        playBtn.classList.add("transcription-audio-button");
        playBtn.onclick = (e) => {
            var ss = data.speechSettings;
            (0, speech_1.utter)(data.spokenText, ss.voice, ss.rate, ss.pitch);
        };
        container.appendChild(playBtn);
        var fl = new flashcard_1.Flashcard(container, data.hintText);
        return fl;
    }
}
(0, flashcard_template_1.registerTemplate)(new TranscriptFlashcardTemplate());
