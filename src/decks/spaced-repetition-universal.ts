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

/* --- USEFUL UTILITIES FOR DEFINING SR DECK --- */

export const defaultSRUniversalSettings = {
    cardTypeSettings: {},
    initialStreak: 3,
    initialHours: 24,
    minimumHours: 8,
    correctFactor: 1.5,
    incorrectFactor: 0.5,
    spreadingCoef: 0.0,
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

        if (correct !== FlashcardResult.Unanswered) {
            card.virtual!.stats.lastStudied = card.virtual!.stats.lastStudied.slice(1);
            card.virtual!.stats.lastStudied.unshift(this.getDate());
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

        var menuTpl = `
            <menu-group class="sr-menu">
                <div class="sr-menu-header">
                    <div class="sr-menu-header-stats">
                        <span class="sr-menu-stat">{{ numTotal }} total cards</span>
                        <span class="sr-menu-stat">{{ numDue }} due</span>
                        <span class="sr-menu-stat">{{ numNew }} new</span>
                    </div>
                    <div class="sr-menu-header-mode">
                        <label class="sr-menu-label" for="studying">Study order</label>
                        <menu-options name="studying">
                            <option value=1>New cards</option>
                            <option value=2>Due cards</option>
                            <option value=3>Random practice</option>
                            <option value=4>Due then new</option>
                            <option value=5>New then due</option>
                        </menu-options>
                    </div>
                </div>
                <menu-group name="settings" class="sr-menu-settings">
                    <div class="sr-menu-section">
                        <h3 class="sr-menu-section-title">Scheduling</h3>
                        <div class="sr-menu-field-row">
                            <menu-number name="initialHours" min=1 max=1024 step=1></menu-number>
                            <label class="sr-menu-label" for="initialHours">Initial interval (hours)</label>
                        </div>
                        <div class="sr-menu-field-row">
                            <menu-number name="minimumHours" min=1 max=1024 step=1></menu-number>
                            <label class="sr-menu-label" for="minimumHours">Minimum interval (hours)</label>
                        </div>
                        <div class="sr-menu-field-row">
                            <menu-number name="initialStreak" min=1 max=10 step=1></menu-number>
                            <label class="sr-menu-label" for="initialStreak">Streak needed to complete new card</label>
                        </div>
                        <div class="sr-menu-field-row">
                            <menu-number name="correctFactor" min="1" max="10" step="0.1"></menu-number>
                            <label class="sr-menu-label" for="correctFactor">Correct factor</label>
                        </div>
                        <div class="sr-menu-field-row">
                            <menu-number name="incorrectFactor" min="0.1" max="1" step="0.01"></menu-number>
                            <label class="sr-menu-label" for="incorrectFactor">Incorrect factor</label>
                        </div>
                        <div class="sr-menu-field-row">
                            <menu-number name="spreadingCoef" min="0.0" max="0.9" step="0.01"></menu-number>
                            <label class="sr-menu-label" for="spreadingCoef">Spreading coefficient</label>
                        </div>
                        <div class="sr-menu-toggle-row">
                            <menu-checkbox name="fillQOnlyWhenEmpty"></menu-checkbox>
                            <label for="fillQOnlyWhenEmpty">Refill new queue only when empty</label>
                        </div>
                        <div class="sr-menu-toggle-row">
                            <menu-checkbox name="preventReversedNewCards"></menu-checkbox>
                            <label for="preventReversedNewCards">Don't reverse cards during initial study</label>
                        </div>
                        <div class="sr-menu-toggle-row">
                            <menu-checkbox name="readCorrectAnswers"></menu-checkbox>
                            <label for="readCorrectAnswers">Speak correct answers</label>
                        </div>
                        <div class="sr-menu-field-row">
                            <menu-textlist name="inactiveTags"></menu-textlist>
                            <label class="sr-menu-label" for="inactiveTags">Deactivated tags</label>
                        </div>
                    </div>

                    <menu-group name="filterSettings" class="sr-menu-section">
                        <h3 class="sr-menu-section-title">Answer matching</h3>
                        <div class="sr-menu-toggle-grid">
                            <div class="sr-menu-toggle-row">
                                <menu-checkbox name="noPunctuation"></menu-checkbox>
                                <label for="noPunctuation">Ignore punctuation</label>
                            </div>
                            <div class="sr-menu-toggle-row">
                                <menu-checkbox name="noCaps"></menu-checkbox>
                                <label for="noCaps">Ignore capitalization</label>
                            </div>
                            <div class="sr-menu-toggle-row">
                                <menu-checkbox name="smartQuotes"></menu-checkbox>
                                <label for="smartQuotes">Ignore smart quotes</label>
                            </div>
                            <div class="sr-menu-toggle-row">
                                <menu-checkbox name="doubleSpaces"></menu-checkbox>
                                <label for="doubleSpaces">Ignore multiple spaces</label>
                            </div>
                            <div class="sr-menu-toggle-row">
                                <menu-checkbox name="trimSpaces"></menu-checkbox>
                                <label for="trimSpaces">Ignore edge spaces</label>
                            </div>
                            <div class="sr-menu-toggle-row">
                                <menu-checkbox name="nfc"></menu-checkbox>
                                <label for="nfc">Normalize Unicode (NFC)</label>
                            </div>
                            <div class="sr-menu-toggle-row">
                                <menu-checkbox name="removeParenDelimited"></menu-checkbox>
                                <label for="removeParenDelimited">Ignore (parenthesized) text</label>
                            </div>
                            <div class="sr-menu-toggle-row">
                                <menu-checkbox name="removeSqDelimited"></menu-checkbox>
                                <label for="removeSqDelimited">Ignore [bracketed] text</label>
                            </div>
                        </div>
                    </menu-group>

                    <menu-group name="cardTypeSettings" class="sr-menu-section-group">
                        <div class="sr-menu-section">
                            <h3 class="sr-menu-section-title">Simple two-sided cards</h3>
                            <menu-group name="simple-card">
                                <details class="sr-details">
                                    <summary>Two-sided card behavior</summary>
                                    <div class="sr-details-body">
                                        <div class="sr-menu-toggle-row">
                                            <menu-checkbox name="doTwoSided" ></menu-checkbox>
                                            <label for="doTwoSided">Quiz cards in both directions</label>
                                        </div>
                                        <div class="sr-menu-toggle-row">
                                            <menu-checkbox name="doReadAloud" ></menu-checkbox>
                                            <label for="doReadAloud">Read aloud reversed cards</label>
                                        </div>
                                        <div class="sr-menu-field-row">
                                            <menu-number name="probReversed" min="0" max="1" step="0.01" ></menu-number>
                                            <label class="sr-menu-label" for="probReversed">Probability of reversal</label>
                                        </div>
                                        <div class="sr-menu-field-row">
                                            <menu-number name="probSpoken" min="0" max="1" step="0.01" ></menu-number>
                                            <label class="sr-menu-label" for="probSpoken">Probability of speaking</label>
                                        </div>
                                    </div>
                                </details>
                                <details class="sr-details">
                                    <summary>Text-to-speech</summary>
                                    <div class="sr-details-body">
                                        <div class="sr-menu-field-row">
                                            <menu-number name="speechSettings.rate" min="0" max="2" step="0.05" ></menu-number>
                                            <label class="sr-menu-label" for="speechSettings.rate">Speech rate</label>
                                        </div>
                                        <div class="sr-menu-field-row">
                                            <menu-number name="speechSettings.pitch" min="0" max="2" step="0.05" ></menu-number>
                                            <label class="sr-menu-label" for="speechSettings.pitch">Speech pitch</label>
                                        </div>
                                        <div class="sr-menu-field-row">
                                            <menu-options name="speechSettings.voice">
                                                {% for v in ttsVoices %}
                                                <option value="{{ v.name }}">{{ v.name }} ({{ v.lang }})</option>
                                                {% endfor %}
                                            </menu-options>
                                        </div>
                                    </div>
                                </details>
                                <details class="sr-details">
                                    <summary>Text substitutions</summary>
                                    <div class="sr-details-body">
                                        <menu-list name="substitutions">
                                            <button class="add-another-button">Add another</button>
                                            <div class="list-entry-container"></div>
                                            <menu-group class="list-default-entry">
                                                <menu-textbox name="0" ></menu-textbox>
                                                <menu-textbox name="1" ></menu-textbox>
                                                <button class="list-entry-remove-button">remove</button>
                                                <button class="list-entry-restore-button">restore</button>
                                            </menu-group>
                                        </menu-list>
                                    </div>
                                </details>
                                <details class="sr-details">
                                    <summary>Card template</summary>
                                    <div class="sr-details-body">
                                        <menu-textfield name="template"></menu-textfield>
                                    </div>
                                </details>
                            </menu-group>
                            <menu-list name="simpleCards" limit=10>
                                <button class="add-another-button">Add another</button>
                                <input type="text" class="search-bar" placeholder="search cards..." />
                                <div class="list-entry-container"></div>
                                <menu-group class="list-default-entry">
                                    <details class="sr-details">
                                        <summary>
                                            <menu-guid name="guid" style="display: none" ></menu-guid>
                                            <menu-textlist name="cardEntry.prompt" sep="|"></menu-textlist>
                                            <swap-button left="cardEntry.prompt" right="cardEntry.answer">↔</swap-button>
                                            <menu-textlist name="cardEntry.answer" sep="|"></menu-textlist>
                                        </summary>
                                        <div class="sr-menu-toggle-row">
                                            <menu-checkbox name="cardEntry.twoSided" ></menu-checkbox>
                                            <label for="cardEntry.twoSided">Card is two-sided</label>
                                        </div>
                                        <div class="sr-menu-toggle-row">
                                            <menu-checkbox name="cardEntry.readAloud" ></menu-checkbox>
                                            <label for="cardEntry.twoSided">Read aloud reversed card</label>
                                        </div>
                                        <menu-textlist name="tags" placeholder="tags..." ></menu-textlist>
                                        <menu-textlist name="extraInfo" placeholder="extra info..." ></menu-textlist>
                                        <div class="sr-menu-inline-actions">
                                            <button class="menu-preview-card-button">view</button>
                                            <button class="menu-prelisten-card-button">listen</button>
                                            <button class="list-entry-remove-button">remove</button>
                                            <button class="list-entry-restore-button">restore</button>
                                        </div>
                                        <div class="flashcard-container"></div>
                                    </details>
                                </menu-group>
                            </menu-list>
                        </div>

                        <div class="sr-menu-section">
                            <h3 class="sr-menu-section-title">Multi-sided cards</h3>
                            <menu-group name="multi-sided-card">
                                <div class="sr-menu-field-row">
                                    <menu-options name="quizzingStyle">
                                        <option value=1>Answer with any other side</option>
                                        <option value=2>Answer with a random side (given one)</option>
                                        <option value=3>Answer with all other sides</option>
                                        <option value=4>Answer with a random side (given all)</option>
                                    </menu-options>
                                </div>
                                <div class="sr-menu-field-row">
                                    <menu-textlist name="sideNames" placeholder="names for card sides..." ></menu-textlist>
                                </div>
                                <div class="sr-menu-field-row">
                                    <menu-number name="speakableSide" min=0 max=10 step=1 ></menu-number>
                                    <label class="sr-menu-label" for="speakableSide">Side to be read aloud</label>
                                </div>
                                <details class="sr-details">
                                    <summary>Text-to-speech</summary>
                                    <div class="sr-details-body">
                                        <div class="sr-menu-field-row">
                                            <menu-number name="speechSettings.rate" min="0" max="2" step="0.05" ></menu-number>
                                            <label class="sr-menu-label" for="speechSettings.rate">Speech rate</label>
                                        </div>
                                        <div class="sr-menu-field-row">
                                            <menu-number name="speechSettings.pitch" min="0" max="2" step="0.05" ></menu-number>
                                            <label class="sr-menu-label" for="speechSettings.pitch">Speech pitch</label>
                                        </div>
                                        <div class="sr-menu-field-row">
                                            <menu-options name="speechSettings.voice">
                                                {% for v in ttsVoices %}
                                                <option value="{{ v.name }}">{{ v.name }} ({{ v.lang }})</option>
                                                {% endfor %}
                                            </menu-options>
                                        </div>
                                    </div>
                                </details>
                                <details class="sr-details">
                                    <summary>Card template</summary>
                                    <div class="sr-details-body">
                                        <menu-textfield name="template"></menu-textfield>
                                    </div>
                                </details>
                            </menu-group>
                            <menu-list name="multiCards" limit=10>
                                <button class="add-another-button">Add another</button>
                                <input type="text" class="search-bar" placeholder="search cards..." />
                                <div class="list-entry-container"></div>
                                <menu-group class="list-default-entry" cardtype="multi-sided-card">
                                    <menu-guid name="guid" style="display: none" ></menu-guid>
                                     
                                    <menu-textlist type="text" name="cardEntry.sides" class="list-default-entry"></menu-textlist>

                                    <div class="sr-menu-inline-actions">
                                        <button class="menu-preview-card-button">view</button>
                                        <button class="menu-prelisten-card-button">listen</button>
                                        <button class="list-entry-remove-button">remove</button>
                                        <button class="list-entry-restore-button">restore</button>
                                    </div>
                                    <div class="flashcard-container"></div>
                                    <br />
                                </menu-group>
                            </menu-list>
                        </div>

                        <div class="sr-menu-section">
                            <h3 class="sr-menu-section-title">Cloze cards</h3>
                            <menu-group name="cloze-card">
                                <div class="sr-menu-field-row">
                                    <menu-textbox name="clozeServerUrl" placeholder="cloze server URL..." ></menu-textbox>
                                </div>
                                <div class="sr-menu-field-row">
                                    <menu-textlist name="sourceLangs" placeholder="source langs..." ></menu-textlist>
                                </div>
                                <div class="sr-menu-field-row">
                                    <menu-textbox name="targetLang" placeholder="target lang..." ></menu-textbox>
                                </div>
                                <div class="sr-menu-field-row">
                                    <menu-textlist name="clozeGroups" placeholder="puzzle groups..." ></menu-textlist>
                                </div>
                                <details class="sr-details">
                                    <summary>Text-to-speech</summary>
                                    <div class="sr-details-body">
                                        <div class="sr-menu-field-row">
                                            <menu-number name="speechSettings.rate" min="0" max="2" step="0.05" ></menu-number>
                                            <label class="sr-menu-label" for="speechSettings.rate">Speech rate</label>
                                        </div>
                                        <div class="sr-menu-field-row">
                                            <menu-number name="speechSettings.pitch" min="0" max="2" step="0.05" ></menu-number>
                                            <label class="sr-menu-label" for="speechSettings.pitch">Speech pitch</label>
                                        </div>
                                        <div class="sr-menu-field-row">
                                            <menu-options name="speechSettings.voice">
                                                {% for v in ttsVoices %}
                                                <option value="{{ v.name }}">{{ v.name }} ({{ v.lang }})</option>
                                                {% endfor %}
                                            </menu-options>
                                        </div>
                                    </div>
                                </details>
                                <details class="sr-details">
                                    <summary>Card template</summary>
                                    <div class="sr-details-body">
                                        <menu-textfield name="template"></menu-textfield>
                                    </div>
                                </details>
                            </menu-group>
                            <menu-list name="clozeCards" limit=10>
                                <button class="add-another-button">Add another</button>
                                <input type="text" class="search-bar" placeholder="search cards..." />
                                <div class="list-entry-container"></div>
                                <menu-group class="list-default-entry">
                                    <menu-guid name="guid" style="display: none" ></menu-guid>
                                    <menu-textbox name="cardEntry.key" ></menu-textbox>
                                    <menu-textlist name="tags" placeholder="tags..." ></menu-textlist>
                                    <menu-textlist name="extraInfo" placeholder="extra info..." ></menu-textlist>
                                    <div class="sr-menu-inline-actions">
                                        <button class="menu-preview-card-button">view</button>
                                        <button class="menu-prelisten-card-button">listen</button>
                                        <button class="list-entry-remove-button">remove</button>
                                        <button class="list-entry-restore-button">restore</button>
                                    </div>
                                    <div class="flashcard-container"></div>
                                    <br/>
                                </menu-group>
                            </menu-list>
                        </div>
                        <div class="sr-menu-section">
                            <h3 class="sr-menu-section-title">Suggested 3rd-party cards</h3>
                            <menu-pushcard name="pushcardQueue">
                                <menu-textbox class="menu-pushcard-server-url" ></menu-textbox>
                                <menu-textbox class="menu-pushcard-server-key" ></menu-textbox>
                                <button class="menu-pushcard-refresh-button">Refresh</button>
                                <div class="menu-pushcard-entries-div"></div>
                                <div class="menu-pushcard-default-entry">
                                    <b class="menu-pushcard-entry-label"></b>
                                    <menu-options class="menu-pushcard-accept-select">
                                        <option value="pending">Choose to accept or reject...</option>
                                        <option value="accept">Accept</option>
                                        <option value="reject">Reject</option>
                                    </menu-options>
                                </div>
                            </menu-pushcard>
                        </div>
                        </div>
                    </menu-group>
                </menu-group>
            </menu-group> 
        `;
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
