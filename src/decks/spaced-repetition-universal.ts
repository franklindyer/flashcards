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
    SRCardMenu
} from "menus/sr-card-menus"
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
        var _this = this;

        var contDiv = document.createElement("div");
        var menuTpl = `
            <div is="menu-group">
                <label for="studying">Studying cards in the order:</label>
                <select is="menu-select" name="studying">
                    <option value=1>New cards</option>
                    <option value=2>Due cards</option>
                    <option value=3>Random practice cards</option>
                    <option value=4>Due then new cards</option>
                    <option value=5>New then due cards</option>
                </select>
                <div is="menu-group" name="settings">
                    <input is="menu-number" name="initialHours" min=1 max=1024 step=1/>
                    <label for="initialHours">Initial interval (hours)</label> <br />
                    <input is="menu-number" name="correctFactor" min="1" max="10" step="0.1"/>
                    <label for="correctFactor">Correct factor</label> <br />
                    <input is="menu-number" name="incorrectFactor" min="0.1" max="1" step="0.01"/>
                    <label for="incorrectFactor">Incorrect factor</label> <br />
                    <input is="menu-checkbox" name="fillQOnlyWhenEmpty"/>
                    <label for="fillQOnlyWhenEmpty">Refill new queue only when it is empty</label> <br />
                    <input is="menu-checkbox" name="preventReversedNewCards"/>
                    <label for="preventReversedNewCards">Don't reverse new cards during initial study</label> <br />
                    <input is="menu-checkbox" name="readCorrectAnswers"/>
                    <label for="readCorrectAnswers">Speak correct answers using text-to-speech</label> <br />
                    <input is="menu-textbox" name="inactiveTags"/>
                    <label for="inactiveTags">Deactivated tags</label> <br />
                    <div is="menu-group" name="filterSettings">
                        <input is="menu-checkbox" name="noPunctuation"/>
                        <label for="noPunctuation">Ignore punctuation</label> <br />
                        <input is="menu-checkbox" name="noCaps"/>
                        <label for="noCaps">Ignore capitalization</label> <br />
                        <input is="menu-checkbox" name="smartQuotes"/>
                        <label for="smartQuotes">Ignore smart quotes</label> <br />
                        <input is="menu-checkbox" name="doubleSpaces"/>
                        <label for="doubleSpaces">Ignore multiple spaces in a row</label> <br />
                        <input is="menu-checkbox" name="trimSpaces"/>
                        <label for="trimSpaces">Ignore leading and trailing spaces</label> <br />
                        <input is="menu-checkbox" name="nfc"/>
                        <label for="nfc">NFC-normalize Unicode text</label> <br />
                        <input is="menu-checkbox" name="removeParenDelimited"/>
                        <label for="removeParenDelimited">Ignore substrings enclosed in (parentheses)</label> <br />
                        <input is="menu-checkbox" name="removeSqDelimited"/>
                        <label for="removeSqDelimited">Ignore substrings enclosed in [square brackets]</label> <br />
                    </div>

                    <div is="menu-group" name="cardTypeSettings">
                        <div>
                            <h3>Simple two-sided card</h3>
                            <div is="menu-deep-json" name="simple-card">
                                <details>
                                    <summary>Two-sided card settings</summary>
                                    <input is="menu-checkbox" name="doTwoSided" />
                                    <label for="doTwoSided">Quiz on cards back-to-front sometimes</label> <br />
                                    <input is="menu-checkbox" name="doReadAloud" />
                                    <label for="doReadAloud">Read aloud back-to-front cards for which the setting is enabled</label> <br />
                                    <input is="menu-number" name="probReversed" min="0" max="1" step="0.01" />
                                    <label for="probReversed">Probability of card being reversed</label> <br />
                                    <input is="menu-number" name="probSpoken" min="0" max="1" step="0.01" />
                                    <label for="probSpoken">Probability of a reversed card being spoken</label> <br />
                                </details>
                                <details>
                                    <summary>Text-to-speech settings</summary>
                                    <input is="menu-number" name="speechSettings.rate" min="0" max="2" step="0.05" />
                                    <label for="speechSettings.rate">Speech rate</label> <br />
                                    <input is="menu-number" name="speechSettings.pitch" min="0" max="2" step="0.05" />
                                    <label for="speechSettings.pitch">Speech pitch</label> <br />
                                    <select is="menu-select" name="voice">
                                        {% for v in ttsVoices %}
                                        <option value="{{ v }}">{{ v }}</option>
                                        {% endfor %}
                                    </select>
                                </details>
                                <details>
                                    <summary>Text substitutions</summary>
                                    <div is="menu-list" name="substitutions">
                                        <button class="menu-add-another-button">Add another</button>
                                        <div class="menu-list-entries"></div>
                                        <div class="menu-list-default-entry" is="menu-group">
                                            <input is="menu-textbox" name="0" />
                                            <input is="menu-textbox" name="1" />
                                        </div>
                                    </div>
                                </details>
                                <details>
                                    <summary>Card template</summary>
                                    <div is="menu-textfield" name="template"></tpl>
                                </details>
                            </div>
                            <div is="menu-lazy-list" name="simpleCards" search="cardEntry.prompt,cardEntry.answer">
                                <button class="menu-add-another-button">Add another</button>
                                <input type="text" class="menu-search-bar" placeholder="search cards..." />
                                <div class="menu-list-entries"></div>
                                <div class="menu-list-default-entry" is="menu-sr-card" cardtype="simple-card">
                                    <input is="menu-textbox" name="cardEntry.prompt" />
                                    <button class="menu-swapper-button">↔</button>
                                    <input is="menu-textbox" name="cardEntry.answer" />
                                    <input is="menu-checkbox" name="cardEntry.twoSided" />
                                    <input is="menu-checkbox" name="cardEntry.readAloud" />
                                    <input is="menu-textbox" name="tags" placeholder="tags..." />
                                    <input is="menu-textbox" name="extraInfo" placeholder="extra info..." />
                                    <button class="menu-preview-card-button">view</button>
                                    <button class="menu-prelisten-card-button">listen</button>
                                    <button class="menu-remove-entry-button">remove</button>
                                    <button class="menu-restore-entry-button">restore</button>
                                    <div class="flashcard-container"></div>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h3>Cloze cards</h3>
                            <div is="menu-deep-json" name="cloze-card">
                                <input is="menu-textbox" name="clozeServerUrl" placeholder="cloze server URL..." />
                                <input is="menu-textbox" name="sourceLangs" placeholder="source langs..." />
                                <input is="menu-textbox" name="targetLang" placeholder="target lang..." />
                                <input is="menu-textbox" name="clozeGroups" placeholder="puzzle groups..." />
                                <details>
                                    <summary>Text-to-speech settings</summary>
                                    <input is="menu-number" name="speechSettings.rate" min="0" max="2" step="0.05" />
                                    <label for="speechSettings.rate">Speech rate</label> <br />
                                    <input is="menu-number" name="speechSettings.pitch" min="0" max="2" step="0.05" />
                                    <label for="speechSettings.pitch">Speech pitch</label> <br />
                                    <select is="menu-select" name="voice">
                                        {% for v in ttsVoices %}
                                        <option value="{{ v }}">{{ v }}</option>
                                        {% endfor %}
                                    </select>
                                </details>
                                <details>
                                    <summary>Card template</summary>
                                    <div is="menu-textfield" name="template"></tpl>
                                </details>
                            </div>
                            <div is="menu-lazy-list" name="clozeCards" search="cardEntry.key">
                                <button class="menu-add-another-button">Add another</button>
                                <input type="text" class="menu-search-bar" placeholder="search cards..." />
                                <div class="menu-list-entries"></div>
                                <div class="menu-list-default-entry" is="menu-sr-card" cardtype="cloze-card">
                                    <input is="menu-textbox" name="cardEntry.key" />
                                    <input is="menu-textbox" name="tags" placeholder="tags..." />
                                    <input is="menu-textbox" name="extraInfo" placeholder="extra info..." />
                                    <button class="menu-preview-card-button">view</button>
                                    <button class="menu-prelisten-card-button">listen</button>
                                    <button class="menu-remove-entry-button">remove</button>
                                    <button class="menu-restore-entry-button">restore</button>
                                    <div class="flashcard-container"></div>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h3>Suggested 3rd-party cards</h3>
                            <div is="menu-pushcard" name="pushcardQueue">
                                <input is="menu-textbox" class="menu-pushcard-server-url" />
                                <input is="menu-textbox" class="menu-pushcard-server-key" />
                                <button class="menu-pushcard-refresh-button">Refresh</button>
                                <div class="menu-pushcard-entries-div"></div>
                                <div class="menu-pushcard-default-entry">
                                    <b class="menu-pushcard-entry-label"></b>
                                    <select is="menu-select" class="menu-pushcard-accept-select">
                                        <option value="pending">Choose to accept or reject...</option>
                                        <option value="accept">Accept</option>
                                        <option value="reject">Reject</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        </div>
                    </div>
                </div>
            </div> 
        `;
        var menuHTML = renderString(menuTpl, { 
            st: st,
            ttsVoices: [...gSynth().getVoices().map((v) => v.name)] 
        });
        contDiv.innerHTML = menuHTML;
        var menu = <MenuComponent<SRUniversalState>><any>contDiv.children[0];

        var simpleCardsMenu = (<any>menu).querySelector("[name='simpleCards']")!;
        var clozeCardsMenu = (<any>menu).querySelector("[name='clozeCards']")!;

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

        (<any>menu).querySelector(".menu-pushcard-refresh-button")!.click();

        (<any>menu).preProc = (st: any) => {
            st.settings.inactiveTags = st.settings.inactiveTags.join(",");
            var cardsList = [...Object.values(st.cards)];
            st.settings.cardTypeSettings.simpleCards 
                = [...Object.values(st.cards).filter((c: any) => c.cardType == "simple-card")];
            st.settings.cardTypeSettings.clozeCards 
                = [...Object.values(st.cards).filter((c: any) => c.cardType == "cloze-card")];
            st.settings.cardTypeSettings.simpleCards.sort(
                (c1: any, c2: any) => (c1.stats.created < c2.stats.created) ? -1 : 1
            );            

            st.settings.cardTypeSettings["cloze-card"].sourceLangs
                = st.settings.cardTypeSettings["cloze-card"].sourceLangs.join(",");
            
            st.settings.cardTypeSettings["cloze-card"].clozeGroups
                = st.settings.cardTypeSettings["cloze-card"].clozeGroups.join(",");
            
            return st;
        };
        (<any>menu).postProc = (st: any) => {
            st.settings.inactiveTags = st.settings.inactiveTags.length == 0
                ? [] : st.settings.inactiveTags.split(",");
            st.cards = [];
            st.cards = st.cards.concat(st.settings.cardTypeSettings["simpleCards"]);
            st.cards = st.cards.concat(st.settings.cardTypeSettings["clozeCards"]);
            st.cards = st.cards.concat([...st.settings.pushcardQueue.accepted.map((j: any) => recursiveRepairJSON(j.data, makeEmptyCard(j.data.cardType)))]);
            st.settings.pushcardQueue.accepted = [];
            st.cards = makeSRCardDict(st.cards);
            delete st.settings.cardTypeSettings["simpleCards"];
            delete st.settings.cardTypeSettings["clozeCards"];
            st.settings.cardTypeSettings["cloze-card"].sourceLangs
                = st.settings.cardTypeSettings["cloze-card"].sourceLangs.length == 0
                    ? [] : st.settings.cardTypeSettings["cloze-card"].sourceLangs.split(",")
            st.settings.cardTypeSettings["cloze-card"].clozeGroups
                = st.settings.cardTypeSettings["cloze-card"].clozeGroups.length == 0
                    ? [] : st.settings.cardTypeSettings["cloze-card"].clozeGroups.split(",");
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
