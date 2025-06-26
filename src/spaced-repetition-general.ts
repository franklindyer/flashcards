import {
    IDictionary,
    guidGenerator,
    makeDict,
    trivialPromise
} from "./utils"
import {
    Flashcard
} from "./flashcard"
import {
    FlashcardGen,
    FlashcardResult
} from "./flashcard-generator"
import {
    FlashcardSyncGen
} from "./flashcard-sync-generator"

export enum SpacedRepStudying {
    NewCards = 1,
    DueCards,
    RandomCards
}

export type SpacedRepCard<content, auxdata> = {
    guid: string,
    content: content,
    due: Date,
    intervalMinutes: number,
    auxdata: auxdata
}

export type SpacedRepCardPhysical<content, auxdata> = {
    data?: SpacedRepCard<content, auxdata>,
    context: {
        cardsLeft: number,
        isPractice: boolean
    }
}

export type SpacedRepState<content, auxdata, settings> = {
    cards: IDictionary<SpacedRepCard<content, auxdata>>,
    newIndex: number,
    newQueue: string[],
    newQueueSize: number,
    studying: SpacedRepStudying,
    settings: settings
}

export function makeSpacedRepCardDict<content, auxdata>(
    cards: content[],
    defaultAuxData: () => auxdata): 
    IDictionary<SpacedRepCard<content, auxdata>> {
    var cardDict: IDictionary<SpacedRepCard<content, auxdata>> = {};
    for (var i in cards) {
        var c = cards[i];
        var guid = guidGenerator();
        cardDict[guid] = { guid: guid, content: c, due: new Date(), intervalMinutes: 0, auxdata: defaultAuxData() };
    }
    return cardDict;
}

export abstract class AbstractAsyncSpacedRepGen<content, auxdata, settings>
    extends FlashcardGen<SpacedRepState<content, auxdata, settings>, SpacedRepCardPhysical<content, auxdata>> {

    getDate: () => Date = () => new Date();
    
    // For unit testing
    setDate(newDt: Date) { this.getDate = () => newDt; } 

    cardIsDue(card: SpacedRepCard<content, auxdata>): boolean {
        return (card.intervalMinutes > 0 && new Date(card.due).valueOf() < this.getDate().valueOf());
    };
    
    cardIsNew(card: SpacedRepCard<content, auxdata>): boolean { 
        return (card.intervalMinutes == 0); 
    };

    // Allows for cards to be temporarily disabled
    abstract cardIsEnabled(
        card: SpacedRepCard<content, auxdata>,
        st: SpacedRepState<content, auxdata, settings>
    ): boolean

    // Return interval > 0 if the card should go from new to due
    abstract updateInterval(
        cardData: SpacedRepCardPhysical<content, auxdata>,
        settings: settings,
        correct: FlashcardResult
    ): number;
    abstract updateAuxData(
        cardData: SpacedRepCardPhysical<content, auxdata>,
        settings: settings,
        correct: FlashcardResult
    ): auxdata;

    updateCard(
        card: SpacedRepCardPhysical<content, auxdata>,
        settings: settings, 
        correct: FlashcardResult
    ): SpacedRepCard<content, auxdata> {
        if (card.context.isPractice) {
            return card.data!;
        }
        var isNew = card.data!.intervalMinutes == 0;

        var newAuxData = this.updateAuxData(card, settings, correct);
        card.data!.auxdata = newAuxData;
        var newInterval = this.updateInterval(card, settings, correct);
        card.data!.intervalMinutes = newInterval;

        // Interval > 0 implies the card is no longer new
        // Only reschedule the card if it was answered correctly
        if (correct == FlashcardResult.Correct && newInterval > 0) {
            card.data!.due = this.getDate();
            card.data!.due.setHours(card.data!.due!.getHours() + card.data!.intervalMinutes/60);
        }

        return card.data!;
    }

    getNew(st: SpacedRepState<content, auxdata, settings>): string[] {
        return Object.keys(st.cards).filter((k) => this.cardIsNew(st.cards[k]) && this.cardIsEnabled(st.cards[k], st));
    }

    getDue(st: SpacedRepState<content, auxdata, settings>): string[] {
        return Object.keys(st.cards).filter((k) => this.cardIsDue(st.cards[k]) && this.cardIsEnabled(st.cards[k], st));
    }

    getNextCardAsync(st: SpacedRepState<content, auxdata, settings>): 
        Promise<SpacedRepCardPhysical<content, auxdata>> {
        var inds = Object.keys(st.cards);
        var newInds = this.getNew(st);
        var dueInds = this.getDue(st);
        st.newQueue = st.newQueue.filter((k) => this.cardIsEnabled(st.cards[k], st));
        switch (st.studying) {
            case SpacedRepStudying.NewCards:
                if (newInds.length == 0 && st.newQueue.length == 0) {
                    return trivialPromise({ data: undefined, context: { cardsLeft: 0, isPractice: false }});
                }
                var newInd;
                if (st.newIndex < st.newQueue.length) {
                    newInd = st.newQueue[st.newIndex];
                } else {
                    newInd = newInds[Math.floor(Math.random() * newInds.length)];
                }
                return trivialPromise({
                    data: st.cards[newInd],
                    context: {
                        cardsLeft: newInds.length,
                        isPractice: false
                    }
                });
            case SpacedRepStudying.DueCards:
                if (dueInds.length == 0) {
                    return trivialPromise({ data: undefined, context: { cardsLeft: 0, isPractice: false } });
                } 
                var dueInd = dueInds[Math.floor(Math.random() * dueInds.length)];
                return trivialPromise({
                    data: st.cards[dueInd],
                    context: {
                        cardsLeft: dueInds.length,
                        isPractice: false
                    }
                });
            case SpacedRepStudying.RandomCards:
                var ind = inds[Math.floor(Math.random() * inds.length)];
                return trivialPromise({
                    data: st.cards[ind],
                    context: {
                        cardsLeft: 0,
                        isPractice: true
                    }
                });
        }
        return trivialPromise({
            data: undefined,
            context: {
                cardsLeft: 0,
                isPractice: false
            }
        });
    }

    updateStateAsync(
        st: SpacedRepState<content, auxdata, settings>,
        card: SpacedRepCardPhysical<content, auxdata>,
        result: FlashcardResult
    ): Promise<SpacedRepState<content, auxdata, settings>> {
        if (result == FlashcardResult.Unanswered || st.studying == SpacedRepStudying.RandomCards)
            return trivialPromise(st); 

        var cardData = card.data!;
        var correct = (result == FlashcardResult.Correct);
        var cardGuid = cardData.guid;
        var cardState = st.cards[cardGuid];

        var cardNewState = this.updateCard(card, st.settings, result);

        if (st.studying == SpacedRepStudying.NewCards) {
            if (!st.newQueue.includes(cardData.guid)) {
                st.newQueue.push(cardData.guid);
            }
            if (!this.cardIsNew(cardNewState)) {
                st.newQueue = st.newQueue.filter((i) => i != cardData.guid);
            }
            var maxNewQueueSize = Math.min(st.newQueueSize, this.getNew(st).length);
            st.newQueue = st.newQueue.slice(0, st.newQueueSize);
            st.newIndex += 1;
            if (st.newIndex >= maxNewQueueSize) {
                st.newIndex = 0;
                st.newQueue = st.newQueue.sort((a, b) => 0.5 - Math.random());
            }
        } 

        st.cards[cardGuid] = cardNewState;    
        return trivialPromise(st);
    }

}

export abstract class AbstractSpacedRepGen<content, auxdata, settings>
    extends AbstractAsyncSpacedRepGen<content, auxdata, settings> {
    abstract generateCard(data: SpacedRepCardPhysical<content, auxdata>): Flashcard;
    abstract checkAnswer(
        answer: string,
        state: SpacedRepState<content, auxdata, settings>,
        data: SpacedRepCardPhysical<content, auxdata>
    ): boolean;

    generateCardAsync(data: SpacedRepCardPhysical<content, auxdata>): Promise<Flashcard> {
        return new Promise((resolve, _) => { resolve(this.generateCard(data)); });
    }

    checkAnswerAsync(
        answer: string,
        state: SpacedRepState<content, auxdata, settings>,
        data: SpacedRepCardPhysical<content, auxdata>
    ): Promise<boolean> {
        return new Promise((resolve, _) => { resolve(this.checkAnswer(answer, state, data)); });
    }
}
