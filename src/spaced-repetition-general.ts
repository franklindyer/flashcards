import {
    IDictionary,
    guidGenerator,
    makeDict
} from "./utils"
import {
    FlashcardGen,
    FlashcardResult
} from "./flashcard-generator"

enum SpacedRepStudying {
    NewCards = 1,
    DueCards,
    RandomCards
}

type SpacedRepCard<content, timing> = {
    guid: string,
    content: content,
    timing: timing
}

type SpacedRepCardPhysical<content, timing> = {
    data?: SpacedRepCard<content, timing>,
    context: {
        cardsLeft: number,
        isPractice: boolean
    }
}

type SpacedRepState<content, timing, settings> = {
    cards: IDictionary<SpacedRepCard<content, timing>>,
    newIndex: number,
    newQueue: string[],
    newQueueSize: number,
    studying: SpacedRepStudying,
    settings: settings
}

export abstract class AbstractSpacedRepGen<content, timing, settings>
    extends FlashcardGen<SpacedRepState<content, timing, settings>, SpacedRepCardPhysical<content, timing>> {

    abstract makeEmptyCard(): SpacedRepCard<content, timing>;
    abstract cardHint(card: SpacedRepCard<content, timing>): boolean;
    abstract cardIsDue(card: SpacedRepCard<content, timing>): boolean;
    abstract cardIsNew(card: SpacedRepCard<content, timing>): boolean;
    abstract updateCard(
        settings: settings, 
        cardData: SpacedRepCardPhysical<content, timing>,
        correct: FlashcardResult
    ): SpacedRepCard<content, timing>;
    abstract cardTransitionNewToDue(
        settings: settings,
        cardData: SpacedRepCardPhysical<content, timing>,
        correct: FlashcardResult
    ): boolean;

    getNew(st: SpacedRepState<content, timing, settings>): string[] {
        return Object.keys(st.cards).filter((k) => this.cardIsNew(st.cards[k]));
    }

    getDue(st: SpacedRepState<content, timing, settings>): string[] {
        return Object.keys(st.cards).filter((k) => this.cardIsDue(st.cards[k]));
    }

    pickSpacedRepCard(st: SpacedRepState<content, timing, settings>): 
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
                        cardsLeft: newInds.length + st.newQueue.length,
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

        if (this.cardIsNew(cardState)) {
            if (!st.newQueue.includes(cardData.guid)) {
                st.newQueue.push(cardData.guid);
            }
            if (this.cardIsDue(cardNewState)) {
                st.newQueue = st.newQueue.filter((i) => i != cardData.guid);
            }
            if (st.studying == SpacedRepStudying.NewCards) {
                var maxNewQueueSize = Math.min(st.newQueueSize, this.getNew(st).length);
                st.newQueue = st.newQueue.slice(0, st.newQueueSize);
                st.newIndex += 1;
                if (st.newIndex >= maxNewQueueSize) {
                    st.newIndex = 0;
                }
            } 
        } 

        st.cards[cardGuid] = cardNewState;    
        return st;
    }

}
