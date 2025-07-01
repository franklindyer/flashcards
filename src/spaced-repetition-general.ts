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
import {
    SRNewQueue,
    chooseNext,
    incorporateLast
} from "./spaced-repetition-newqueue"

export enum SpacedRepStudying {
    NewCards = 1,
    DueCards,
    RandomCards
}

export type SpacedRepCard<content, auxdata> = {
    guid: string,
    content: content,   // A card's content can only be edited by the user
    due: Date,
    intervalMinutes: number,
    auxdata: auxdata    // A card's auxdata may contain stats that get updated each time it is answered
}

// Type encapsulating all of the data needed to render a card / determine its appearance
// May include both the card's content, and contextual info to be displayed on the card
export type SpacedRepCardPhysical<content, auxdata> = {
    data?: SpacedRepCard<content, auxdata>,
    context: {
        cardsLeft: number,
        isPractice: boolean
    }
}

export type SpacedRepState<content, auxdata, settings> = {
    cards: IDictionary<SpacedRepCard<content, auxdata>>,
    newQ: SRNewQueue,
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
    abstract nextCardAsyncPreprocessing(
        card: SpacedRepCardPhysical<content, auxdata>,
        st: SpacedRepState<content, auxdata, settings>
    ): Promise<SpacedRepCardPhysical<content, auxdata>>

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
        st: SpacedRepState<content, auxdata, settings>, 
        correct: FlashcardResult
    ): SpacedRepCard<content, auxdata> {
        // Physical card data could be modified by templating, so must get card data by guid from deck
        var cardData = st.cards[card.data!.guid];
        if (card.context.isPractice) {
            return cardData;
        }
        var isNew = cardData.intervalMinutes == 0;

        var newAuxData = this.updateAuxData(card, st.settings, correct);
        cardData.auxdata = newAuxData;
        var newInterval = this.updateInterval(card, st.settings, correct);
        cardData.intervalMinutes = newInterval;

        // Interval > 0 implies the card is no longer new
        // Only reschedule the card if it was answered correctly
        if (correct == FlashcardResult.Correct && newInterval > 0) {
            cardData.due = this.getDate();
            cardData.due.setHours(cardData.due!.getHours() + cardData.intervalMinutes/60);
        }

        return cardData;
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
        switch (st.studying) {
            case SpacedRepStudying.NewCards:
                var newGuid = chooseNext(st.newQ, newInds);
                if (newGuid === undefined) {
                    return this.nextCardAsyncPreprocessing({ 
                        data: undefined, 
                        context: { cardsLeft: 0, isPractice: false }
                    }, st);
                }
                return this.nextCardAsyncPreprocessing({
                    data: st.cards[newGuid],
                    context: {
                        cardsLeft: newInds.length,
                        isPractice: false
                    }
                }, st);
            case SpacedRepStudying.DueCards:
                if (dueInds.length == 0) {
                    return trivialPromise({ data: undefined, context: { cardsLeft: 0, isPractice: false } });
                } 
                var dueInd = dueInds[Math.floor(Math.random() * dueInds.length)];
                return this.nextCardAsyncPreprocessing({
                    data: st.cards[dueInd],
                    context: {
                        cardsLeft: dueInds.length,
                        isPractice: false
                    }
                }, st);
            case SpacedRepStudying.RandomCards:
                var ind = inds[Math.floor(Math.random() * inds.length)];
                return this.nextCardAsyncPreprocessing({
                    data: st.cards[ind],
                    context: {
                        cardsLeft: 0,
                        isPractice: true
                    }
                }, st);
        }
        return this.nextCardAsyncPreprocessing({
            data: undefined,
            context: {
                cardsLeft: 0,
                isPractice: false
            }
        }, st);
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

        var cardNewState = this.updateCard(card, st, result);

        // If card is still new, stick it back in the queue
        if (st.studying == SpacedRepStudying.NewCards) {
            st.newQ = incorporateLast(st.newQ, cardGuid, this.cardIsNew(cardNewState));
        } 

        st.cards[cardGuid] = cardNewState;    
        return trivialPromise(st);
    }

}

export abstract class AbstractSpacedRepGen<content, auxdata, settings>
    extends AbstractAsyncSpacedRepGen<content, auxdata, settings> {
    abstract generateCard(
        state: SpacedRepState<content, auxdata, settings>,
        data: SpacedRepCardPhysical<content, auxdata>
    ): Flashcard;
    abstract nextCardPreprocessing(
        data: SpacedRepCardPhysical<content, auxdata>
    ): SpacedRepCardPhysical<content, auxdata>
    abstract checkAnswer(
        answer: string,
        state: SpacedRepState<content, auxdata, settings>,
        data: SpacedRepCardPhysical<content, auxdata>
    ): boolean;

    nextCardAsyncPreprocessing(
        c: SpacedRepCardPhysical<content, auxdata>,
        state: SpacedRepState<content, auxdata, settings>
    ) {
        return trivialPromise(this.nextCardPreprocessing(c));
    }

    generateCardAsync(
        st: SpacedRepState<content, auxdata, settings>,
        data: SpacedRepCardPhysical<content, auxdata>): 
        Promise<Flashcard> {
        return new Promise((resolve, _) => { resolve(this.generateCard(st, data)); });
    }

    checkAnswerAsync(
        answer: string,
        state: SpacedRepState<content, auxdata, settings>,
        data: SpacedRepCardPhysical<content, auxdata>
    ): Promise<boolean> {
        return new Promise((resolve, _) => { resolve(this.checkAnswer(answer, state, data)); });
    }
}
