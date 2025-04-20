enum SpacedRepCardStatus {
    CardNew = 1,
    CardStudying,
    CardReview
}

enum SpacedRepOrder {
    RandomOrder = 1,
    ReviewFirst,
    NewFist
}

type SpacedRepCardData = {
    guid: string,
    prompt: string,
    answers: string[]
}

type SpacedRepCardTiming = {
    due: Date | null,
    intervalSeconds: number,
    status: SpacedRepCardStatus
}

type SpacedRepCard = {
    data: SpacedRepCardData,
    timing: SpacedRepCardTiming
}

type SpacedRepSettings = {
    initialHours: number,
    correctFactor: number,
    incorrectFactor: number,
    reviewInterval: number
}

type SpacedRepHistRecord = {
    guid: string,
    due: Date | null,
    answered: Date,
    timing: SpacedRepCardTiming,
    correct: boolean,
    answerSeconds: number
    
}
