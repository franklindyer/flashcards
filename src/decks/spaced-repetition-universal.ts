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
    gSynth,
    defaultSpeechSettings
} from "utils/speech"
import {
    applyTextFilter,
    defaultTextFilterSettings
} from "utils/text-filters"
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
    defaultPushcardQueue
} from "utils/pushcard-queue"
import {
    SRUniversalStats,
    SRUniversalCardVirtual,
    SRUniversalCardPhysical,
    SRStudying,
    SRUniversalSettings,
    SRUniversalState,
    makeEmptyCard
} from "decks/spaced-repetition-universal-types"
import { srUniversalMenuTpl } from "decks/spaced-repetition-universal-menu"

/* --- USEFUL UTILITIES FOR DEFINING SR DECK --- */

export const defaultSRUniversalSettings = {
    cardTypeSettings: {},
    initialStreak: 3,
    initialHours: 24,
    minimumHours: 8,
    correctFactor: 1.5,
    incorrectFactor: 0.5,
    spreadingCoef: 0.1,
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
            var emptyCard = makeEmptyCard(st.cards[guid].cardType);
            if (!("extraInfo" in st.cards[guid]) || st.cards[guid].extraInfo === null)
                st.cards[guid].extraInfo = "";
            st.cards[guid].stats = recursiveRepairJSON(st.cards[guid].stats, emptyCard.stats);
        }

        this.preprocessAllCards(st);

        // Fill the new queue, in case it isn't full yet
        // st.newQ = refillNewQueue(st.newQ, this.getNew(st), st.settings.fillQOnlyWhenEmpty);

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
            if (cardData.intervalMinutes == 0 && cardData.stats.streak >= settings.initialStreak) {
                return settings.initialHours * 60;
            } else if (cardData.intervalMinutes != 0) {
                return Math.max(cardData.intervalMinutes * settings.correctFactor, settings.minimumHours * 60);
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
        if (correct !== FlashcardResult.Unanswered) {
            card.virtual!.stats.lastStudied = card.virtual!.stats.lastStudied.slice(1);
            card.virtual!.stats.lastStudied.unshift(this.getDate());
            card.virtual!.stats.lastStreak = card.virtual!.stats.streak;
            card.virtual!.stats.lastStreakWrong = card.virtual!.stats.streakWrong;
        }
 
        if (correct == FlashcardResult.Correct) {
            card.virtual!.stats.streak += 1;
            card.virtual!.stats.streakWrong = 0;
            card.virtual!.stats.numCorrect += 1;
        } else if (correct == FlashcardResult.Incorrect) {
            card.virtual!.stats.maxStreakBroken = Math.max(card.virtual!.stats.maxStreakBroken, card.virtual!.stats.streak);
            card.virtual!.stats.streak = 0;
            card.virtual!.stats.streakWrong += 1;
            card.virtual!.stats.numIncorrect += 1;
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

        var smoothedInterval = cardVirtual.intervalMinutes;
        smoothedInterval = (1 + st.settings.spreadingCoef*(2*Math.random()-1))*smoothedInterval;

        // Interval > 0 implies the card is no longer new
        // Only reschedule the card if it was answered correctly
        if (correct == FlashcardResult.Correct && newInterval > 0) {
            cardVirtual.due = this.getDate();
            cardVirtual.due.setHours(cardVirtual.due!.getHours() + smoothedInterval/60);
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
        // st.newQ = refillNewQueue(st.newQ, this.getNew(st), st.settings.fillQOnlyWhenEmpty);

        st.cards[cardGuid] = cardNewState;
        return trivialPromise(st);
    }

    reportableData(
        st: SRUniversalState,
        card: SRUniversalCardPhysical,
        result: FlashcardResult
    ): any {
        if (!card.virtual || result == FlashcardResult.Unanswered) {
            return {};
        }
        return {
            "guid": card.virtual!.guid,
            "stats": card.virtual!.stats, 
            "due": card.virtual!.due,
            "timestamp": this.getDate(),
            "interval": card.virtual!.intervalMinutes,
            "correct": result == FlashcardResult.Correct
        }
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
            var newGuid = chooseNext(st.newQ, newInds, st.settings.fillQOnlyWhenEmpty);
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
        var _this = this;

        var contDiv = document.createElement("div");

        var numDue = (<any>this).gen.getDue(st).length;
        var numNew = (<any>this).gen.getNew(st).length;
        var numTotal = Object.keys(st.cards).length;

        var menuTpl = srUniversalMenuTpl;
        var menuHTML = renderString(menuTpl, { 
            st: st,
            ttsVoices: [...gSynth().getVoices()],
            numDue: numDue,
            numNew: numNew,
            numTotal: numTotal
        });
        contDiv.innerHTML = menuHTML;
        var menu = <MenuComponent<SRUniversalState>><any>contDiv.children[0];

        var simpleCardsMenu = (<any>menu).querySelector("[name='simpleCards']")!;
        var clozeCardsMenu = (<any>menu).querySelector("[name='clozeCards']")!;
        var multiCardsMenu = (<any>menu).querySelector("[name='multiCards']")!;

        [[simpleCardsMenu, "simple-card"], 
            [clozeCardsMenu, "cloze-card"], 
            [multiCardsMenu, "multi-sided-card"]].forEach((m) => {
            var settingsMenu = (<any>menu).querySelector(`[name='${m[1]}']`)!;
            (<any>m[0]).dynamicDefaultState = () => {
                return makeEmptyCard(m[1], settingsMenu.getState());
            };
        });

        var cardPreviewState = (guid: string) => {
            return (<any>_this).gen.nextCardAsyncPreprocessing({
                virtual: menu.getState().cards[guid],
                context: {
                    cardsLeft: 0,
                    isPractice: false
                }
            }, menu.getState());
        }

        var cardPreviewCallback = (el: any) => {
            var guid = el.getState().guid;
            var previewDiv = el.querySelector(".flashcard-container");
            previewDiv.style.display = "none";
            var previewBtn = el.querySelector(".menu-preview-card-button")!;
            var prelistenBtn = el.querySelector(".menu-prelisten-card-button")!;
            previewBtn.onclick = (e: any) => {
                var cardStatePromise = cardPreviewState(guid);
                cardStatePromise.then((cs: any) => {
                    var cardDivPromise = (<any>_this).gen.generateCardAsync(
                        menu.getState(),
                        cs
                    );
                    cardDivPromise.then((cp: Flashcard) => {
                        cp.el.classList.add("flashcard");
                        cp.el.classList.add("flashcard-preview");
                        previewDiv.innerHTML = "";
                        previewDiv.style.display = "block";
                        previewDiv.appendChild(cp.el);
                        var detailsEl = previewDiv.closest("details");
                        if (detailsEl) { detailsEl.open = true; }
                    });
                });
            };
            prelistenBtn.onclick = (e: any) => {
                var cardStatePromise = cardPreviewState(guid);
                cardStatePromise.then((cs: any) => {
                    var cardTypeClass = gCardTypeRegistry[cs.virtual.cardType];
                    var cardTypeSettings = menu.getState().settings.cardTypeSettings[cs.virtual.cardType];
                    cardTypeClass.speakCard(cs.processed, cardTypeSettings, () => {});
                });
            };

            var swapperBtn = el.querySelector(".menu-swapper-button");
            if (swapperBtn) {
                var promptMenu = el.querySelector("[name='cardEntry.prompt']")!;
                var answerMenu = el.querySelector("[name='cardEntry.answer']")!;
                swapperBtn.onclick = (e: any) => {
                    var aux = promptMenu.value;
                    promptMenu.value = answerMenu.value;
                    answerMenu.value = aux; 
                };
            }
        };

        simpleCardsMenu.entryCallback = cardPreviewCallback;
        clozeCardsMenu.entryCallback = cardPreviewCallback;
        multiCardsMenu.entryCallback = cardPreviewCallback;
        
        (<any>menu).querySelector(".menu-pushcard-refresh-button")!.click();

        (<any>menu).preProc = (st: any) => {
            var cardsList = [...Object.values(st.cards)];
            st.settings.cardTypeSettings.simpleCards 
                = [...Object.values(st.cards).filter((c: any) => c.cardType == "simple-card")];
            st.settings.cardTypeSettings.clozeCards 
                = [...Object.values(st.cards).filter((c: any) => c.cardType == "cloze-card")];
            st.settings.cardTypeSettings.multiCards 
                = [...Object.values(st.cards).filter((c: any) => c.cardType == "multi-sided-card")];
            st.settings.cardTypeSettings.simpleCards.sort(
                (c1: any, c2: any) => (c1.stats.created < c2.stats.created) ? -1 : 1
            );            

            return st;
        };
        (<any>menu).postProc = (st: any) => {
            st.cards = [];
            st.cards = st.cards.concat(st.settings.cardTypeSettings["simpleCards"]);
            st.cards = st.cards.concat(st.settings.cardTypeSettings["clozeCards"]);
            st.cards = st.cards.concat(st.settings.cardTypeSettings["multiCards"]);
            st.cards = st.cards.concat([...st.settings.pushcardQueue.accepted.map((j: any) => recursiveRepairJSON(j.data, makeEmptyCard(j.data.cardType, st.settings)))]);
            for (var i = 0; i < st.cards.length; i++) {
                // Add any missing fields to new cards, e.g. guid and created timestamp 
                st.cards[i] = recursiveRepairJSON(st.cards[i], makeEmptyCard(st.cards[i].cardType, st.settings));
            } 
            st.settings.pushcardQueue.accepted = [];
            st.cards = makeSRCardDict(st.cards);

            delete st.settings.cardTypeSettings["simpleCards"];
            delete st.settings.cardTypeSettings["clozeCards"];
            delete st.settings.cardTypeSettings["multiCards"];

            return st;
        };

        menu.setState(st);
        return menu;
    }

}

registerDeckType(
    new UniversalSpacedRepGen(),
    "universal-spaced-repetition-deck",
    "Universal spaced repetition deck",
    defaultSRUniversalState,
    "#eaa9fc"
);
