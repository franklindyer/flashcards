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

export type SpacedRepCard<content, timing> = {
    guid: string,
    content: content,
    timing: timing
}

export type SpacedRepCardPhysical<content, timing> = {
    data?: SpacedRepCard<content, timing>,
    context: {
        cardsLeft: number,
        isPractice: boolean
    }
}

export type SpacedRepState<content, timing, settings> = {
    cards: IDictionary<SpacedRepCard<content, timing>>,
    newIndex: number,
    newQueue: string[],
    newQueueSize: number,
    studying: SpacedRepStudying,
    settings: settings
}

export function makeSpacedRepCardDict<content, timing>(
    cards: content[],
    defaultTiming: () => timing): 
    IDictionary<SpacedRepCard<content, timing>> {
    var cardDict: IDictionary<SpacedRepCard<content, timing>> = {};
    for (var i in cards) {
        var c = cards[i];
        var guid = guidGenerator();
        cardDict[guid] = { guid: guid, content: c, timing: defaultTiming() };
    }
    return cardDict;
}

export abstract class AbstractSpacedRepGen<content, timing, settings>
    extends FlashcardGen<SpacedRepState<content, timing, settings>, SpacedRepCardPhysical<content, timing>> {

    // For unit testing
    getDate: () => Date = () => new Date();

    abstract cardIsDue(card: SpacedRepCard<content, timing>): boolean;
    abstract cardIsNew(card: SpacedRepCard<content, timing>): boolean;
    abstract updateCard(
        settings: settings, 
        cardData: SpacedRepCardPhysical<content, timing>,
        correct: FlashcardResult
    ): SpacedRepCard<content, timing>;

    getNew(st: SpacedRepState<content, timing, settings>): string[] {
        return Object.keys(st.cards).filter((k) => this.cardIsNew(st.cards[k]));
    }

    getDue(st: SpacedRepState<content, timing, settings>): string[] {
        return Object.keys(st.cards).filter((k) => this.cardIsDue(st.cards[k]));
    }

    getNextCard(st: SpacedRepState<content, timing, settings>): 
        SpacedRepCardPhysical<content, timing> {
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
        st: SpacedRepState<content, timing, settings>,
        card: SpacedRepCardPhysical<content, timing>,
        result: FlashcardResult
    ): SpacedRepState<content, timing, settings> {
        if (result == FlashcardResult.Unanswered || st.studying == SpacedRepStudying.RandomCards)
            return st;

        var cardData = card.data!;
        var correct = (result == FlashcardResult.Correct);
        var cardGuid = cardData.guid;
        var cardState = st.cards[cardGuid];

        var cardNewState = this.updateCard(st.settings, card, result);

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
