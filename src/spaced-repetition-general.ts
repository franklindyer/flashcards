import {
    IDictionary,
    guidGenerator,
    makeDict
} from "./utils"
import {
    FlashcardGen,
    FlashcardResult
} from "./flashcard-generator"

export enum SpacedRepStudying {
    NewCards = 1,
    DueCards,
    RandomCards
}

export type SpacedRepCard<content, auxdata> = {
    guid: string,
    content: content,
    due?: Date,
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
        cardDict[guid] = { guid: guid, content: c, due: undefined, intervalMinutes: 0, auxdata: defaultAuxData() };
    }
    return cardDict;
}

export abstract class AbstractSpacedRepGen<content, auxdata, settings>
    extends FlashcardGen<SpacedRepState<content, auxdata, settings>, SpacedRepCardPhysical<content, auxdata>> {

    getDate: () => Date = () => new Date();
    
    // For unit testing
    setDate(newDt: Date) { this.getDate = () => newDt; } 

    cardIsDue(card: SpacedRepCard<content, auxdata>): boolean {
        return (card.due !== undefined && card.due < this.getDate());
    };
    
    cardIsNew(card: SpacedRepCard<content, auxdata>): boolean { 
        return (card.due === undefined); 
    };

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
        var cardData = card.data!;
        if (card.context.isPractice) {
            return cardData;
        }
        var isNew = cardData.due === undefined;

        var newAuxData = this.updateAuxData(card, settings, correct);
        cardData.auxdata = newAuxData;
        card.data = cardData;
        var newInterval = this.updateInterval(card, settings, correct);
        cardData.intervalMinutes = newInterval;

        // Interval > 0 implies the card is no longer new
        if (newInterval > 0) {
            cardData.due = this.getDate();
            cardData.due.setHours(cardData.due!.getHours() + cardData.intervalMinutes/60);
        }

        return cardData;
    }

    getNew(st: SpacedRepState<content, auxdata, settings>): string[] {
        return Object.keys(st.cards).filter((k) => this.cardIsNew(st.cards[k]));
    }

    getDue(st: SpacedRepState<content, auxdata, settings>): string[] {
        return Object.keys(st.cards).filter((k) => this.cardIsDue(st.cards[k]));
    }

    getNextCard(st: SpacedRepState<content, auxdata, settings>): 
        SpacedRepCardPhysical<content, auxdata> {
        var inds = Object.keys(st.cards);
        var newInds = this.getNew(st);
        var dueInds = this.getDue(st);
        switch (st.studying) {
            case SpacedRepStudying.NewCards:
                if (newInds.length == 0 && st.newQueue.length == 0) {
                    return { data: undefined, context: { cardsLeft: 0, isPractice: false }};
                }
                var newInd;
                if (st.newIndex < st.newQueue.length) {
                    newInd = st.newQueue[st.newIndex];
                } else {
                    newInd = newInds[Math.floor(Math.random() * newInds.length)];
                }
                return {
                    data: st.cards[newInd],
                    context: {
                        cardsLeft: newInds.length,
                        isPractice: false
                    }
                };
            case SpacedRepStudying.DueCards:
                if (dueInds.length == 0) {
                    return { data: undefined, context: { cardsLeft: 0, isPractice: false } };
                } 
                var dueInd = dueInds[Math.floor(Math.random() * dueInds.length)];
                return {
                    data: st.cards[dueInd],
                    context: {
                        cardsLeft: dueInds.length,
                        isPractice: false
                    }
                };
            case SpacedRepStudying.RandomCards:
                var ind = inds[Math.floor(Math.random() * inds.length)];
                return {
                    data: st.cards[ind],
                    context: {
                        cardsLeft: 0,
                        isPractice: true
                    }
                };
        }
        return {
            data: undefined,
            context: {
                cardsLeft: 0,
                isPractice: false
            }
        };
    }

    updateState(
        st: SpacedRepState<content, auxdata, settings>,
        card: SpacedRepCardPhysical<content, auxdata>,
        result: FlashcardResult
    ): SpacedRepState<content, auxdata, settings> {
        if (result == FlashcardResult.Unanswered || st.studying == SpacedRepStudying.RandomCards)
            return st;

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
        return st;
    }

}
