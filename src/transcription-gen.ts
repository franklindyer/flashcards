import {
    IDictionary,
    makeDict,
    getUuid
} from "./utils"
import {
    Flashcard
} from "./flashcard"
import {
    FlashcardResult,
    FlashcardGen
} from "./flashcard-generator"
import {
    utter,
    speechSettingsEditor,
    defaultSpeechSettings,
    SpeechSettings
} from "./speech"

type TranscriptionCardData = {
    guid: string,
    text: string,
    correct: number,
    incorrect: number
};

type TranscriptionSettings = {
    autoplay: boolean,
    speechSettings: SpeechSettings
};

type TranscriptionDeckState = {
    cards: IDictionary<TranscriptionCardData>,
    settings: TranscriptionSettings
};

const defaultTranscriptionSettings = {
    autoplay: true,
    speechSettings: defaultSpeechSettings()
};

function makeTranscriptionCardDict(cards: string[]): IDictionary<TranscriptionCardData> {
    var cardDict: IDictionary<TranscriptionCardData> = {};
    for (var i in cards) {
        var c = {
            guid: getUuid(cards[i], 5),
            text: cards[i],
            correct: 0,
            incorrect: 0
        };
        cardDict[c.guid] = c;
    }
    return cardDict;
}

const defaultTranscriptionState = {
    cards: makeTranscriptionCardDict([
        "Hello, my name is Bob.",
        "What interesting weather we're having!",
        "How old are you?",
        "I've had enough of this."
    ]),
    settings: defaultTranscriptionSettings
};
