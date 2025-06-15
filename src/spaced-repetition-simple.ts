import {
    AbstractSpacedRepGen
} from "./spaced-repetition-general"
import {
    utter,
    speechSettingsEditor,
    defaultSpeechSettings,
    SpeechSettings
} from "./speech"
import {
    TextFilterSettings,
    applyTextFilter,
    textFilterSelectionMenu,
    defaultTextFilterSettings
} from "./text-filters"

type SRSimpleContent = {
    prompt: string,
    answers: string[],
    hint: string
}

type SRSimpleTiming = {
    streak: number,
    intervalMinutes: number,
    due: Date | undefined
}

type SRSimpleSettings = {
    initialHours: number,
    correctFactor: number,
    incorrectFactor: number,
    readCorrectAnswers: boolean,
    speechSettings: SpeechSettings,
    filterSettings: TextFilterSettings
}
