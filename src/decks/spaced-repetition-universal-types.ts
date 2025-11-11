import {
    IDictionary,
    guidGenerator,
    makeDict,
    trivialPromise,
    getSRFutureDateInfo,
    recursiveRepairJSON,
    recursiveRepairEachValueJSON,
    iconButton
} from "utils/utils"
import {
    Preloader
} from "utils/generic-preloader"
import {
    Flashcard
} from "core/flashcard"
import {
    FlashcardGen,
    FlashcardResult
} from "core/flashcard-generator"
import {
    utter,
    speechSettingsEditor,
    defaultSpeechSettings,
    SpeechSettings
} from "utils/speech"
import {
    TextFilterSettings,
    applyTextFilter,
    textFilterSelectionMenu,
    defaultTextFilterSettings
} from "utils/text-filters"
import {
    StateEditor,
    boolEditor,
    scrollNumberEditor,
    singleTextFieldEditor,
    radioEditor,
    combineEditors,
    swappingTextEditor,
    multipleEditors
} from "core/editor"
import {
    renderCard
} from "core/flashcard-template"
import {
    registerDeckType
} from "core/flashcard-deck"
import {
    emptySRQueue,
    SRNewQueue,
    chooseNext,
    filterNewQueue,
    incorporateLast
} from "utils/spaced-repetition-newqueue"
import {
    gCardTypeRegistry,
    FlashcardType
} from "core/flashcard-entry"

export type SRUniversalStats = {
    created: Date,
    streak: number,
}

export type SRUniversalCardVirtual = {
    guid: string,
    due: Date,
    intervalMinutes: number,
    cardType: string,
    cardEntry: any,
    tags: string[],
    stats: SRUniversalStats
}

export type SRUniversalCardPhysical = {
    virtual?: SRUniversalCardVirtual,
    processed?: any,
    context: {
        cardsLeft: number,
        isPractice: boolean
    }
}

export enum SRStudying {
    NewCards = 1,
    DueCards,
    RandomCards
}

export type SRUniversalSettings = {
    cardTypeSettings: IDictionary<any>,
    initialHours: number,
    correctFactor: number,
    incorrectFactor: number,
    inactiveTags: string[],
    readCorrectAnswers: boolean,
    preventReversedNewCards: boolean,
    filterSettings: TextFilterSettings
}

export type SRUniversalState = {
    cards: IDictionary<SRUniversalCardVirtual>,
    newQ: SRNewQueue,
    studying: SRStudying,
    settings: SRUniversalSettings
}
