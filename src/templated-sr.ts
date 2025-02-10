import {
    IDictionary
} from "./lib";

type SRSettings = {
    maxNewCardsAtOnce: number,
    streakToAddCard: number,
    initialInterval: number,
    minimumInterval: number,
    correctFactor: number,
    incorrectFactor: number,
    punishmentCloneProb: number
}

enum CardType {
    Template,
    PoolValue
}

type NewCard = {
    uuid: string,
    type: CardType,
    tplUuid?: string,
    copies?: number,
    poolType?: string,
    poolValue?: any
}

type QueuedCard = {
    tplUuid: string,
    due: Date | null,
    lastInterval: number,   // In hours
    permanent: boolean      // Whether this template can be "cleared" from due cards, or persists 
}

type SRState = {
    progress: number,
    settings: SRSettings,
    studyingNew: boolean,
    pool: IDictionary<any[]>,
    dueQueue: QueuedCard[]
}

const defaultSRSettings: SRSettings = {
    maxNewCardsAtOnce: 10,
    streakToAddCard: 3,
    initialInterval: 12,
    minimumInterval: 1,
    correctFactor: 1.2,
    incorrectFactor: 0.5,
    punishmentCloneProb: 1
}
