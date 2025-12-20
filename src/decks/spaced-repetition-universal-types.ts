import {
    IDictionary
} from "utils/utils"
import {
    TextFilterSettings,
} from "utils/text-filters"
import {
    PushcardQueue
} from "utils/pushcard-queue"
import {
    SRNewQueue
} from "utils/spaced-repetition-newqueue"

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
    extraInfo: string,
    stats: SRUniversalStats
}

export type SRUniversalCardPhysical = {
    virtual?: SRUniversalCardVirtual,
    processed?: any,
    context: {
        cardsLeft: number,
        isPractice: boolean,
        studying: string
    }
}

export enum SRStudying {
    NewCards = 1,
    DueCards,
    RandomCards,
    DueThenNewCards,
    NewThenDueCards
}

export type SRUniversalSettings = {
    cardTypeSettings: IDictionary<any>,
    initialHours: number,
    correctFactor: number,
    incorrectFactor: number,
    fillQOnlyWhenEmpty: boolean,
    inactiveTags: string[],
    readCorrectAnswers: boolean,
    preventReversedNewCards: boolean,
    filterSettings: TextFilterSettings,
    pushcardQueue: PushcardQueue
}

export type SRUniversalState = {
    cards: IDictionary<SRUniversalCardVirtual>,
    newQ: SRNewQueue,
    studying: SRStudying,
    settings: SRUniversalSettings
}
