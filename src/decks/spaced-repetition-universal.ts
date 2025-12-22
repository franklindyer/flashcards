import {
    IDictionary,
    guidGenerator,
    makeDict,
    trivialPromise,
    getSRFutureDateInfo,
    recursiveRepairJSON,
    iconButton
} from "utils/utils"
import {
    Flashcard
} from "core/flashcard"
import {
    FlashcardGen,
    FlashcardResult
} from "core/flashcard-generator"
import {
    defaultSpeechSettings
} from "utils/speech"
import {
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
    multipleEditors
} from "core/editor"
import {
    MenuComponent
} from "menus/menus"
import {
    njNoCardsLeft
} from "utils/nj-templates"
import {
    renderString
} from "nunjucks"
import {
    registerDeckType
} from "core/flashcard-deck"
import {
    emptySRQueue,
    chooseNext,
    filterNewQueue,
    incorporateLast,
    refillNewQueue
} from "utils/spaced-repetition-newqueue"
import {
    gCardTypeRegistry
} from "core/flashcard-entry"
import {
    PushcardQueue,
    makePCQEditor,
    defaultPushcardQueue
} from "utils/pushcard-queue"
import {
    SRUniversalStats,
    SRUniversalCardVirtual,
    SRUniversalCardPhysical,
    SRStudying,
    SRUniversalSettings,
    SRUniversalState
} from "decks/spaced-repetition-universal-types"

/* --- USEFUL UTILITIES FOR DEFINING SR DECK --- */

export const defaultSRUniversalSettings = {
    cardTypeSettings: {},
    initialHours: 8,
    correctFactor: 1.5,
    incorrectFactor: 0.5,
    fillQOnlyWhenEmpty: true,
    inactiveTags: [],
    readCorrectAnswers: false,
    preventReversedNewCards: false,
    speechSettings: defaultSpeechSettings(),
    filterSettings: defaultTextFilterSettings,
    pushcardQueue: defaultPushcardQueue()
}

export function makeSRCardDict(cards: SRUniversalCardVirtual[])
    : IDictionary<SRUniversalCardVirtual> {
    var cardDict: IDictionary<SRUniversalCardVirtual> = {};
    for (var i in cards) {
        var c = cards[i];
        cardDict[c.guid] = c;
    }
    return cardDict;
}

export const defaultSRUniversalState: SRUniversalState = { 
    cards: {},
    newQ: emptySRQueue(10),
    studying: SRStudying.NewCards,
    settings: defaultSRUniversalSettings
};

function makeEmptyCard(cardType: string): SRUniversalCardVirtual {
    return {
        guid: guidGenerator(),
        cardType: cardType,
        cardEntry: gCardTypeRegistry[cardType].getDefaultEntry(),
        extraInfo: "",
        tags: [],
        due: new Date(),
        intervalMinutes: 0,
        stats: {
            created: new Date(),
            streak: 0
        }
    }
}

function infoWidgetSR(
    totalCards: number,
    newCards: number,
    dueCards: number
): HTMLElement {

    var contDiv = document.createElement("div");
    contDiv.classList.add("deck-menu-submenu");
    var totP = document.createElement("p");
    totP.textContent = `Total cards: ${totalCards}`;

    var newP = document.createElement("p");
    newP.textContent = `New cards: ${newCards}`;
    newP.style.color = "#9999ee";
    newP.style.fontWeight = "bold";

    var dueP = document.createElement("p");
    dueP.textContent = `Due cards: ${dueCards}`;
    dueP.style.color = "#ee9999";
    dueP.style.fontWeight = "bold";

    [totP, newP, dueP].map((el) => contDiv.appendChild(el));

    return contDiv;
}

export class UniversalSpacedRepGen
    extends FlashcardGen<SRUniversalState, SRUniversalCardPhysical> {

    getGenName(): string { return "universal-spaced-repetition"; }

    // mock-up datetime function for unit testing purposes
    getDate: () => Date = () => new Date();
    setDate(newDt: Date) { this.getDate = () => newDt; }

    repairDeckState(st: any): any {
        st = recursiveRepairJSON(st, defaultSRUniversalState, ["cards", "cardTypeSettings"]);
        // st.cards = recursiveRepairEachValueJSON(st.cards, Object.values(defaultSRModularState.cards)[0]);
        if (st.settings.cardTypeSettings === undefined) {
            st.settings.cardTypeSettings = {};
        }
        for (var i in Object.keys(gCardTypeRegistry)) {
            var cardType = Object.keys(gCardTypeRegistry)[i];
            if (!Object.keys(st.settings.cardTypeSettings).includes(cardType)) {
                st.settings.cardTypeSettings[cardType] 
                    = gCardTypeRegistry[cardType].getDefaultSettings();
            } else {
                var currentSettings = st.settings.cardTypeSettings[cardType]
                var repairedSettings = recursiveRepairJSON(currentSettings, gCardTypeRegistry[cardType].getDefaultSettings());
                st.settings.cardTypeSettings[cardType] = repairedSettings;
            }
        }
        for (var i in Object.keys(st.cards)) {
            var guid = Object.keys(st.cards)[i];
            if (!("extraInfo" in st.cards[guid]) || st.cards[guid].extraInfo === null)
                st.cards[guid].extraInfo = "";
        }

        this.preprocessAllCards(st);

        // Fill the new queue, in case it isn't full yet
        st.newQ = refillNewQueue(st.newQ, this.getNew(st), true);

        return st;
    }

    cardIsDue(card: SRUniversalCardVirtual) {
        return (card.intervalMinutes > 0 && new Date(card.due).valueOf() < this.getDate().valueOf());
    }

    cardIsNew(card: SRUniversalCardVirtual) {
        return (card.intervalMinutes == 0);
    }

    getDue(st: SRUniversalState): string[] {
        return Object.keys(st.cards).filter((k) => this.cardIsDue(st.cards[k]) && this.cardIsEnabled(st.cards[k], st));
    }

    getNew(st: SRUniversalState): string[] {
        return Object.keys(st.cards).filter((k) => this.cardIsNew(st.cards[k]) && this.cardIsEnabled(st.cards[k], st));
    }

    cardIsEnabled(
        card: SRUniversalCardVirtual, 
        st: SRUniversalState 
    ): boolean {
        return !card.tags.some((t) => st.settings.inactiveTags.includes(t));
    }

    // A pure effect that should be triggered when a card is finally answered correctly
    correctEffect(
        st: SRUniversalState,
        card: SRUniversalCardPhysical, 
        attempt: string,
        resolve: () => void
    ): void {
        var cardVirtual = card.virtual!;
        var cardTypeSettings = st.settings.cardTypeSettings[cardVirtual.cardType];
        if (st.settings.readCorrectAnswers) {
            gCardTypeRegistry[cardVirtual.cardType].speakCard(
                card.processed,
                cardTypeSettings,
                resolve
            );
        } else {
            resolve();
        }
    }

    // Update a card's interval based on settings and the attempt's success/failure
    updateInterval(
        card: SRUniversalCardPhysical,
        settings: SRUniversalSettings,
        correct: FlashcardResult
    ): number {
        var cardData = card.virtual!;
        if (correct == FlashcardResult.Correct) {
            if (cardData.intervalMinutes == 0 && cardData.stats.streak >= 3) {
                return settings.initialHours * 60;
            } else if (cardData.intervalMinutes != 0) {
                return cardData.intervalMinutes * settings.correctFactor;
            } else {
                return 0;
            }
        } else if (correct == FlashcardResult.Incorrect && cardData.intervalMinutes > 0) {
            return cardData.intervalMinutes * settings.incorrectFactor;
        } else {
            return cardData.intervalMinutes;
        } 
    }

    updateStats(
        card: SRUniversalCardPhysical, 
        settings: SRUniversalSettings,
        correct: FlashcardResult
    ): SRUniversalStats {
        if (correct == FlashcardResult.Correct) {
            card.virtual!.stats.streak += 1;
        } else if (correct == FlashcardResult.Incorrect) {
            card.virtual!.stats.streak = 0;
        } 
        return card.virtual!.stats;
    }

    updateCard(
        card: SRUniversalCardPhysical,
        st: SRUniversalState,
        correct: FlashcardResult
    ): SRUniversalCardVirtual {
        // Physical card data may be affected by templating or other modifications, so must get card data from deck by its GUID
        var cardVirtual = st.cards[card.virtual!.guid];

        if (card.context.isPractice) {
            return cardVirtual;
        }
        var isNew = cardVirtual.intervalMinutes == 0;

        var newStats = this.updateStats(card, st.settings, correct);
        cardVirtual.stats = newStats;
        var newInterval = this.updateInterval(card, st.settings, correct);
        cardVirtual.intervalMinutes = newInterval;

        // Interval > 0 implies the card is no longer new
        // Only reschedule the card if it was answered correctly
        if (correct == FlashcardResult.Correct && newInterval > 0) {
            cardVirtual.due = this.getDate();
            cardVirtual.due.setHours(cardVirtual.due!.getHours() + cardVirtual.intervalMinutes/60);
        }

        return cardVirtual;
    }

    updateStateAsync(
        st: SRUniversalState,
        card: SRUniversalCardPhysical,
        result: FlashcardResult
    ): Promise<SRUniversalState> {
        if (result == FlashcardResult.Unanswered || st.studying == SRStudying.RandomCards) {
            return trivialPromise(st);
        }

        var cardGuid = card.virtual!.guid;
        var cardNewState = this.updateCard(card, st, result);

        // If card is still new, stick it back in the queue
        if (card.context.studying === "new") {
            st.newQ = incorporateLast(st.newQ, cardGuid, this.cardIsNew(cardNewState));
        }
        st.newQ = filterNewQueue(st.newQ, (id: string) => this.cardIsEnabled(st.cards[id], st));
        st.newQ = refillNewQueue(st.newQ, this.getNew(st), true);

        st.cards[cardGuid] = cardNewState;
        return trivialPromise(st);
    }

    getNextCardAsync(st: SRUniversalState): Promise<SRUniversalCardPhysical> {
        var inds = Object.keys(st.cards);
        var newInds = this.getNew(st);
        var dueInds = this.getDue(st);
        var emptyCard = this.nextCardAsyncPreprocessing({
            virtual: undefined,
            context: { cardsLeft: 0, isPractice: false, studying: "" }
        }, st);

        if (inds.length == 0) {
            return emptyCard;
        }

        if ((st.studying == SRStudying.NewCards) || 
                (st.studying == SRStudying.NewThenDueCards && newInds.length > 0) ||
                (st.studying == SRStudying.DueThenNewCards && dueInds.length == 0)) {
            var newGuid = chooseNext(st.newQ, newInds);
            if (newGuid === undefined) {
                return emptyCard;     
            }
            return this.nextCardAsyncPreprocessing({
                virtual: st.cards[newGuid],
                context: {
                    cardsLeft: newInds.length,
                    isPractice: false,
                    studying: "new"
                }
            }, st);
        } else if ((st.studying == SRStudying.DueCards) ||
                    (st.studying == SRStudying.DueThenNewCards) ||
                    (st.studying == SRStudying.NewThenDueCards && newInds.length == 0)) {
            if (dueInds.length == 0) {
                return emptyCard;
            }
            var dueInd = dueInds[Math.floor(Math.random() * dueInds.length)];
            return this.nextCardAsyncPreprocessing({
                virtual: st.cards[dueInd],
                context: {
                    cardsLeft: dueInds.length,
                    isPractice: false,
                    studying: "due"
                }
            }, st);
        } else if (st.studying == SRStudying.RandomCards) {
            if (inds.length == 0) {
                return emptyCard;
            }
            var ind = inds[Math.floor(Math.random() * inds.length)];
            return this.nextCardAsyncPreprocessing({
                virtual: st.cards[ind],
                context: {
                    cardsLeft: 0,
                    isPractice: true,
                    studying: "random"
                }
            }, st); 
        }
        return this.nextCardAsyncPreprocessing({
            virtual: undefined,
            context: {
                cardsLeft: 0,
                isPractice: false,
                studying: ""
            }
        }, st);
    }

    checkAnswerAsync(
        answer: string,
        st: SRUniversalState, 
        card: SRUniversalCardPhysical 
    ): Promise<boolean> {
        if (card.virtual === undefined) {
            return trivialPromise(false);
        }
        var cardType = card.virtual!.cardType;
        var cardData = card.processed!;
        var tf = (s: string) => applyTextFilter(s, st.settings.filterSettings);
        return gCardTypeRegistry[cardType].checkAnswer(answer, cardData, st.settings.cardTypeSettings[cardType], tf);
    }

    preprocessAllCards(
        st: SRUniversalState 
    ): void {
        this.getNew(st).map((k) => {
            var c = st.cards[k];
            gCardTypeRegistry[c.cardType].preprocessEntry(c.cardEntry, st.settings.cardTypeSettings[c.cardType]);
        });
        this.getDue(st).map((k) => {
            var c = st.cards[k];
            gCardTypeRegistry[c.cardType].preprocessEntry(c.cardEntry, st.settings.cardTypeSettings[c.cardType]);
        });
    }

    nextCardAsyncPreprocessing(
        card: SRUniversalCardPhysical,
        st: SRUniversalState 
    ): Promise<SRUniversalCardPhysical> {
        if (card.virtual === undefined) { return trivialPromise(card); }

        var cardType = card.virtual!.cardType;
        var cardEntry = card.virtual!.cardEntry;
        var context = { preventReversedCard: card.virtual!.intervalMinutes == 0 && st.settings.preventReversedNewCards };
        var dp = gCardTypeRegistry[cardType].processEntry(cardEntry, st.settings.cardTypeSettings[cardType], context);
    
        return dp.then((d) => {
            card.processed = d;
            return card;
        })
    }

    generateCardAsync(
        st: SRUniversalState,
        card: SRUniversalCardPhysical 
    ): Promise<Flashcard> {
        if (card.virtual === undefined || card.processed === undefined) {
            var htmlString = renderString(njNoCardsLeft, {});
            var el = <HTMLElement>(new DOMParser().parseFromString(htmlString, "text/html").body.firstChild);
            return trivialPromise(new Flashcard(el, ""));
        } 
        
        var cardType = card.virtual!.cardType;
        var cardEntry = card.virtual!.cardEntry;
        var cardProcessed = card.processed;
        var contextDict: IDictionary<any> = { ...card.context };
        contextDict["extra"] = card.virtual.extraInfo;

        var fl = gCardTypeRegistry[cardType].generateCard(cardProcessed, st.settings.cardTypeSettings[cardType], contextDict);
        return trivialPromise(fl);
    }

    makeEditor(st: SRUniversalState): MenuComponent<SRUniversalState> {
        return null!;
    }

}

registerDeckType(
    new UniversalSpacedRepGen(),
    "universal-spaced-repetition-deck",
    "Universal spaced repetition deck",
    defaultSRUniversalState,
    "#eaa9fc"
);
