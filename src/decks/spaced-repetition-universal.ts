import {
    IDictionary,
    guidGenerator,
    makeDict,
    trivialPromise,
    getSRFutureDateInfo,
    recursiveRepairJSON,
    recursiveRepairEachValueJSON,
    iconButton
} from "utils/utils"
import {
    Preloader
} from "utils/generic-preloader"
import {
    Flashcard
} from "core/flashcard"
import {
    FlashcardGen,
    FlashcardResult
} from "core/flashcard-generator"
import {
    utter,
    speechSettingsEditor,
    defaultSpeechSettings,
    SpeechSettings
} from "utils/speech"
import {
    TextFilterSettings,
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
    combineEditors,
    swappingTextEditor,
    multipleEditors
} from "core/editor"
import {
    renderCard
} from "core/flashcard-template"
import {
    registerDeckType
} from "core/flashcard-deck"
import {
    emptySRQueue,
    SRNewQueue,
    chooseNext,
    filterNewQueue,
    incorporateLast
} from "utils/spaced-repetition-newqueue"
import {
    gCardTypeRegistry,
    FlashcardType
} from "core/flashcard-entry"

/* --- CORE SPACED REPETITION TYPES --- */

export type SRUniversalStats = {
    created: Date,
    streak: number,
}

export type SRUniversalCardVirtual = {
    guid: string,
    due: Date,
    intervalMinutes: number,
    cardType: string,
    cardEntry: any,
    cardData?: any,
    tags: string[],
    stats: SRUniversalStats
}

export type SRUniversalCardPhysical = {
    virtual?: SRUniversalCardVirtual,
    context: {
        cardsLeft: number,
        isPractice: boolean
    }
}

export enum SRStudying {
    NewCards = 1,
    DueCards,
    RandomCards
}

export type SRUniversalSettings = {
    cardTypeSettings: IDictionary<any>,
    initialHours: number,
    correctFactor: number,
    incorrectFactor: number,
    inactiveTags: string[],
    readCorrectAnswers: boolean,
    preventReversedNewCards: boolean,
    speechSettings: SpeechSettings,
    filterSettings: TextFilterSettings
}

export type SRUniversalState = {
    cards: IDictionary<SRUniversalCardVirtual>,
    newQ: SRNewQueue,
    studying: SRStudying,
    settings: SRUniversalSettings
}

/* --- USEFUL UTILITIES FOR DEFINING SR DECK --- */

export const defaultSRUniversalSettings = {
    cardTypeSettings: {},
    initialHours: 8,
    correctFactor: 1.5,
    incorrectFactor: 0.5,
    inactiveTags: [],
    readCorrectAnswers: false,
    preventReversedNewCards: false,
    speechSettings: defaultSpeechSettings(),
    filterSettings: defaultTextFilterSettings
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
        tags: [],
        due: new Date(),
        intervalMinutes: 0,
        stats: {
            created: new Date(),
            streak: 0
        }
    }
}

function makeCardsLeftSpan(card: SRUniversalCardPhysical) {
    var infoText = document.createElement("span");
    infoText.classList.add("cards-left-span");
    if (card.context.isPractice) {  
        infoText.textContent = "This is a practice card. It will not affect your progress.";
    } else {
        infoText.textContent = `${card.context.cardsLeft} cards remaining`;
    }
    return infoText;
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
        this.preprocessAllCards(st);
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
        var cardData = card.virtual!;
        if (st.settings.readCorrectAnswers) {
            var ss = st.settings.speechSettings;
            var spokenAnswer = gCardTypeRegistry[cardData.cardType].getSpeakableText(cardData.cardData);
            utter(spokenAnswer, ss.voice, ss.rate, ss.pitch, resolve);
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
        if (st.studying == SRStudying.NewCards) {
            st.newQ = incorporateLast(st.newQ, cardGuid, this.cardIsNew(cardNewState));
        }
        st.newQ = filterNewQueue(st.newQ, (id: string) => this.cardIsEnabled(st.cards[id], st));

        st.cards[cardGuid] = cardNewState;
        return trivialPromise(st);
    }

    getNextCardAsync(st: SRUniversalState): Promise<SRUniversalCardPhysical> {
        var inds = Object.keys(st.cards);
        var newInds = this.getNew(st);
        var dueInds = this.getDue(st);
        var emptyCard = this.nextCardAsyncPreprocessing({
            virtual: undefined,
            context: { cardsLeft: 0, isPractice: false }
        }, st);
        switch (st.studying) {
            case SRStudying.NewCards:
                var newGuid = chooseNext(st.newQ, newInds);
                if (newGuid === undefined) {
                    return emptyCard;     
                }
                return this.nextCardAsyncPreprocessing({
                    virtual: st.cards[newGuid],
                    context: {
                        cardsLeft: newInds.length,
                        isPractice: false
                    }
                }, st);
            case SRStudying.DueCards:
                if (dueInds.length == 0) {
                    return emptyCard;
                }
                var dueInd = dueInds[Math.floor(Math.random() * dueInds.length)];
                return this.nextCardAsyncPreprocessing({
                    virtual: st.cards[dueInd],
                    context: {
                        cardsLeft: dueInds.length,
                        isPractice: false
                    }
                }, st);
            case SRStudying.RandomCards:
                if (inds.length == 0) {
                    return emptyCard;
                }
                var ind = inds[Math.floor(Math.random() * inds.length)];
                return this.nextCardAsyncPreprocessing({
                    virtual: st.cards[ind],
                    context: {
                        cardsLeft: 0,
                        isPractice: true
                    }
                }, st); 
        }
        return this.nextCardAsyncPreprocessing({
            virtual: undefined,
            context: {
                cardsLeft: 0,
                isPractice: false
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
        var cardData = card.virtual!.cardData;
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
            card.virtual!.cardData = d;
            return card;
        })
    }

    generateCardAsync(
        st: SRUniversalState,
        card: SRUniversalCardPhysical 
    ): Promise<Flashcard> {
        if (card.virtual === undefined || card.virtual.cardData === undefined) {
            return trivialPromise(renderCard("noanswer-template",
                "No cards left to study."
            ));
        } 
        
        var cardType = card.virtual!.cardType;
        var cardEntry = card.virtual!.cardEntry;
        var cardData = card.virtual!.cardData;
        var fl = gCardTypeRegistry[cardType].generateCard(cardData, st.settings.cardTypeSettings[cardType]);
        fl.el.appendChild(makeCardsLeftSpan(card));
        return trivialPromise(fl);
    }

    makeEditor(st: SRUniversalState):
        StateEditor<SRUniversalState> {
        var _this = this;

        var contDiv = document.createElement("div");

        var totCards = Object.keys(st.cards).length;
        var newCards = Object.keys(st.cards).filter((i) => (<any>this).gen.cardIsNew(st.cards[i]) && (<any>this).gen.cardIsEnabled(st.cards[i], st)).length;
        var dueCards = Object.keys(st.cards).filter((i) => (<any>this).gen.cardIsDue(st.cards[i]) && (<any>this).gen.cardIsEnabled(st.cards[i], st)).length;
        var infoWidget = infoWidgetSR(
            totCards,
            newCards,
            dueCards
        );

        var studyingEditor = radioEditor(
            st.studying,
            [SRStudying.NewCards, SRStudying.DueCards, SRStudying.RandomCards],
            ["Study new cards", "Study due cards", "Practice random cards"]
        );
        var newQueueSizeEditor = scrollNumberEditor("Max new cards to study at once: ", st.newQ.maxNewCards, 1, 100, 1);

        var initHoursEditor = scrollNumberEditor("Initial interval (hours): ", st.settings.initialHours, 1, 240, 1);
        var correctFactor = scrollNumberEditor("Correct factor: ", st.settings.correctFactor, 1, 10, 0.1);
        var incorrectFactor = scrollNumberEditor("Incorrect factor: ", st.settings.incorrectFactor, 0, 1.0, 0.01);

        var omitTagsEditor = singleTextFieldEditor(st.settings.inactiveTags.join(','));
        (<HTMLInputElement>omitTagsEditor.element).placeholder = "comma-separated tags...";
        var omitTagsCont = document.createElement("div");
        omitTagsCont.textContent = "Omit cards with the following tags: "
        omitTagsCont.appendChild(omitTagsEditor.element);

        var speechCheckbox = boolEditor("Speak correct answers using text-to-speech?", st.settings.readCorrectAnswers);
        var speechEditor = speechSettingsEditor(st.settings.speechSettings);
        var speechDiv = document.createElement("div");
        speechDiv.appendChild(speechCheckbox.element);
        speechDiv.appendChild(speechEditor.element);

        var preventReversedNewCardsCheckbox = boolEditor("Don't reverse two-sided cards during initial study", st.settings.preventReversedNewCards);

        var omitTagsEditor = singleTextFieldEditor(st.settings.inactiveTags.join(','));
        (<HTMLInputElement>omitTagsEditor.element).placeholder = "comma-separated tags...";
        var omitTagsCont = document.createElement("div");
        omitTagsCont.textContent = "Omit cards with the following tags: "
        omitTagsCont.appendChild(omitTagsEditor.element); 

        var filterEditor = textFilterSelectionMenu(st.settings.filterSettings);

        function makeCardEditor(c: SRUniversalCardVirtual):
            StateEditor<SRUniversalCardVirtual> {
            var cardType = c.cardType;
            var cardEntry = c.cardEntry;
            var cardTypeClass = gCardTypeRegistry[cardType];
            var ed = cardTypeClass.makeEntryEditor(c.cardEntry);

            var tagsEd = singleTextFieldEditor(c.tags.join(','));
            (<HTMLInputElement>tagsEd.element).placeholder = "tags...";
            ed.element.appendChild(tagsEd.element);

            var cardInfo = document.createElement("a");
            cardInfo.classList.add("sr-card-due-date");
            if (c.intervalMinutes == 0) {
                cardInfo.textContent = "not studied";
            } else {
                cardInfo.textContent = `due ${getSRFutureDateInfo(c.due!)}`;
            }
            ed.element.appendChild(cardInfo);

            var cardMenuToState = () => {
                return <SRUniversalCardVirtual>{
                    guid: c.guid,
                    cardType: c.cardType,
                    cardEntry: ed.menuToState(),
                    cardData: null,
                    tags: tagsEd.menuToState().split(",").filter((t) => t.length > 0),
                    due: c.due,
                    intervalMinutes: c.intervalMinutes,
                    stats: c.stats
                };
            };

            var cardMenuToPreview = () => {
                var cardState = <any>cardMenuToState();
                return (<any>_this).gen.nextCardAsyncPreprocessing({
                    data: cardState,
                    context: {
                        cardsLeft: 0,
                        isPractice: false
                    }
                }, st);
            };

            var cardPreviewCont = document.createElement("div");
            var previewBtn = iconButton("eyeball.png", () => {
                var cardDataPromise = cardMenuToPreview();
                cardDataPromise.then((d: any) => {
                    console.log(_this);
                    var cardPreviewDivPromise = (<any>_this).gen.generateCardAsync(
                        st,
                        d
                    );
                    console.log(d);
                    cardPreviewDivPromise.then((cardPreviewDiv: any) => {
                        console.log(cardPreviewDiv);
                        cardPreviewCont.innerHTML = ""; 
                        cardPreviewDiv.el.classList.add("flashcard");
                        cardPreviewDiv.el.classList.add("flashcard-preview");
                        cardPreviewCont.appendChild(cardPreviewDiv.el); 
                    });
                });
            });
            ed.element.appendChild(previewBtn);

            var listenBtn = iconButton("speaker.png", () => {
                var cardDataPromise = cardMenuToPreview();
                var ss = speechEditor.menuToState();
                cardDataPromise.then((c: any) => {
                    var d = c.data.cardData;
                    utter(cardTypeClass.getSpeakableText(d), ss.voice, ss.rate, ss.pitch, () => {});
                });
            });
            ed.element.appendChild(listenBtn);
            
           
            ed.element.appendChild(cardPreviewCont);
 
            return {
                element: ed.element,
                menuToState: cardMenuToState
            };
        }
       
        var cardSettingsGroups: IDictionary<StateEditor<any>> = {}; 
        var cardEditorGroups: StateEditor<SRUniversalCardVirtual[]>[] = [];
        for (var i in Object.keys(gCardTypeRegistry)) {
            var t = Object.keys(gCardTypeRegistry)[i];
            var cardsEditor = ((t) => multipleEditors(
                Object.values(st.cards).filter((c) => c.cardType == t),
                () => makeEmptyCard(t), 
                makeCardEditor,
                true,
                (s, cd) => gCardTypeRegistry[t].getSearchableText(cd.cardEntry).includes(s)
            ))(t);
            var cardsEditorCont = document.createElement("div");
            var cardsEditorDetails = document.createElement("details");
            var cardsEditorSummary = document.createElement("summary");
            cardsEditorSummary.textContent = "Add, edit and remove cards";
            cardsEditorDetails.appendChild(cardsEditorSummary);
            cardsEditorDetails.appendChild(cardsEditor.element);
            cardsEditorCont.appendChild(cardsEditorDetails);
            cardsEditor.element = cardsEditorCont;
            cardEditorGroups.push(cardsEditor);
            cardSettingsGroups[t] 
                = gCardTypeRegistry[t].makeSettingsEditor(st.settings.cardTypeSettings[t]);
            var header = document.createElement("h2");
            header.textContent = gCardTypeRegistry[t].getUserFriendlyName();
            cardsEditor.element.prepend(cardSettingsGroups[t].element);
            cardsEditor.element.prepend(header);
        }
        function getAllCardSettings() {
            var d: IDictionary<any> = {}
            for (var i in Object.keys(gCardTypeRegistry)) {
                var t = Object.keys(gCardTypeRegistry)[i];
                d[t] = cardSettingsGroups[t].menuToState();
            }
            return d;
        }       
 
        [
            infoWidget, 
            studyingEditor.element,
            initHoursEditor.element,
            newQueueSizeEditor.element,
            correctFactor.element,
            incorrectFactor.element,
            omitTagsCont,
            preventReversedNewCardsCheckbox.element,
            speechDiv,
            filterEditor.element
        ].concat(cardEditorGroups.map((ed) => ed.element)).map((el) => {
            el.classList.add("deck-menu-submenu");
            contDiv.appendChild(el);
        });

        return {
            element: contDiv,
            menuToState: () => { return {
                studying: studyingEditor.menuToState(),
                settings: {
                    cardTypeSettings: getAllCardSettings(), 
                    initialHours: initHoursEditor.menuToState(),
                    correctFactor: correctFactor.menuToState(),
                    incorrectFactor: incorrectFactor.menuToState(),
                    readCorrectAnswers: speechCheckbox.menuToState(),
                    preventReversedNewCards: preventReversedNewCardsCheckbox.menuToState(),
                    speechSettings: speechEditor.menuToState(),
                    filterSettings: filterEditor.menuToState(),
                    inactiveTags: omitTagsEditor.menuToState().split(",")
                },
                newQ: emptySRQueue(newQueueSizeEditor.menuToState()),
                cards: makeDict(
                    cardEditorGroups.map((e) => e.menuToState()).flat(1), 
                    (c) => c.guid
                ),
            }}
        };
    }

}

registerDeckType(
    new UniversalSpacedRepGen(),
    "universal-spaced-repetition-deck",
    "Universal spaced repetition deck",
    defaultSRUniversalState,
    "#eaa9fc"
);
