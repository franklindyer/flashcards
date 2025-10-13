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
    AbstractAsyncSpacedRepGen,
    SpacedRepState,
    SpacedRepCard,
    SpacedRepCardPhysical,
    SpacedRepStudying,
    makeSpacedRepCardDict,
    makeCardsLeftSpan
} from "decks/spaced-repetition-general"
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
    infoWidgetSR,
    studyingEditorSR
} from "utils/shared-sr-menu-components"
import {
    renderCard
} from "core/flashcard-template"
import {
    registerDeckType
} from "core/flashcard-deck"
import {
    emptySRQueue,
    SRNewQueue
} from "utils/spaced-repetition-newqueue"
import {
    gCardTypeRegistry,
    FlashcardType
} from "core/flashcard-entry"

export type SRModularContent = {
    cardType: string,
    cardEntry: any,
    cardData?: any,
    tags: string[]
}

export type SRModularAuxData = {
    streak: number
}

export type SRModularSettings = {
    cardTypeSettings: IDictionary<any>,
    initialHours: number,
    correctFactor: number,
    incorrectFactor: number,
    inactiveTags: string[],
    readCorrectAnswers: boolean,
    speechSettings: SpeechSettings,
    filterSettings: TextFilterSettings
}

export const defaultSRModularSettings = {
    cardTypeSettings: {},
    initialHours: 8,
    correctFactor: 1.5,
    incorrectFactor: 0.5,
    inactiveTags: [],
    readCorrectAnswers: false,
    speechSettings: defaultSpeechSettings(),
    filterSettings: defaultTextFilterSettings
}

export const defaultSRModularState: SpacedRepState<SRModularContent, SRModularAuxData, SRModularSettings> = {
    cards: makeSpacedRepCardDict([], () => { return { streak: 0 }; }),
    newQ: emptySRQueue(10),
    studying: SpacedRepStudying.NewCards,
    settings: defaultSRModularSettings
};

function makeEmptyCard(cardType: string): SpacedRepCard<SRModularContent, SRModularAuxData> {
    return {
        guid: guidGenerator(),
        content: {
            cardType: cardType,
            cardEntry: gCardTypeRegistry[cardType].getDefaultEntry(),
            tags: []
        },
        due: new Date(),
        intervalMinutes: 0,
        auxdata: {
            streak: 0
        }
    }
}

export class ModularSpacedRepGen
    extends AbstractAsyncSpacedRepGen<SRModularContent, SRModularAuxData, SRModularSettings> {

    getGenName(): string { return "modular-spaced-repetition"; }

    repairDeckState(st: any): any {
        st = recursiveRepairJSON(st, defaultSRModularState, ["cards", "cardTypeSettings"]);
        // st.cards = recursiveRepairEachValueJSON(st.cards, Object.values(defaultSRModularState.cards)[0]);
        if (st.settings.cardTypeSettings === undefined) {
            st.settings.cardTypeSettings = {};
        }
        for (var i in Object.keys(gCardTypeRegistry)) {
            var cardType = Object.keys(gCardTypeRegistry)[i];
            if (!Object.keys(st.settings.cardTypeSettings).includes(cardType)) {
                st.settings.cardTypeSettings[cardType] 
                    = gCardTypeRegistry[cardType].getDefaultSettings();
            }
        }
        this.preprocessAllCards(st);
        return st;
    }

    cardIsEnabled(
        card: SpacedRepCard<SRModularContent, SRModularAuxData>,
        st: SpacedRepState<SRModularContent, SRModularAuxData, SRModularSettings>
    ): boolean {
        return !card.content.tags.some((t) => st.settings.inactiveTags.includes(t));
    }

    correctEffect(
        st: SpacedRepState<SRModularContent, SRModularAuxData, SRModularSettings>,
        card: SpacedRepCardPhysical<SRModularContent, SRModularAuxData>,
        attempt: string,
        resolve: () => void
    ): void {
        var cardData = card.data!;
        if (st.settings.readCorrectAnswers) {
            var ss = st.settings.speechSettings;
            var spokenAnswer = gCardTypeRegistry[cardData.content.cardType].getSpeakableText(cardData.content.cardData);
            utter(spokenAnswer, ss.voice, ss.rate, ss.pitch, resolve);
        } else {
            resolve();
        }
    }

    updateInterval(
        card: SpacedRepCardPhysical<SRModularContent, SRModularAuxData>,
        settings: SRModularSettings,
        correct: FlashcardResult
    ): number {
        var cardData = card.data!;
        if (correct == FlashcardResult.Correct) {
            if (cardData.intervalMinutes == 0 && cardData.auxdata.streak >= 3) {
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

    updateAuxData(
        card: SpacedRepCardPhysical<SRModularContent, SRModularAuxData>,
        settings: SRModularSettings,
        correct: FlashcardResult
    ): SRModularAuxData {
        if (correct == FlashcardResult.Correct) {
            card.data!.auxdata.streak += 1;
        } else if (correct == FlashcardResult.Incorrect) {
            card.data!.auxdata.streak = 0;
        } 
        return card.data!.auxdata;
    }

    checkAnswerAsync(
        answer: string,
        st: SpacedRepState<SRModularContent, SRModularAuxData, SRModularSettings>,
        card: SpacedRepCardPhysical<SRModularContent, SRModularAuxData>
    ): Promise<boolean> {
        if (card.data === undefined) {
            return trivialPromise(false);
        }
        var cardType = card.data!.content.cardType;
        var cardData = card.data!.content.cardData;
        var tf = (s: string) => applyTextFilter(s, st.settings.filterSettings);
        return gCardTypeRegistry[cardType].checkAnswer(answer, cardData, st.settings.cardTypeSettings[cardType], tf);
    }

    preprocessAllCards(
        st: SpacedRepState<SRModularContent, SRModularAuxData, SRModularSettings>
    ): void {
        this.getNew(st).map((k) => {
            var c = st.cards[k].content;
            gCardTypeRegistry[c.cardType].preprocessEntry(c.cardEntry, st.settings.cardTypeSettings[c.cardType]);
        });
        this.getDue(st).map((k) => {
            var c = st.cards[k].content;
            gCardTypeRegistry[c.cardType].preprocessEntry(c.cardEntry, st.settings.cardTypeSettings[c.cardType]);
        });
    }

    nextCardAsyncPreprocessing(
        card: SpacedRepCardPhysical<SRModularContent, SRModularAuxData>,
        st: SpacedRepState<SRModularContent, SRModularAuxData, SRModularSettings>
    ): Promise<SpacedRepCardPhysical<SRModularContent, SRModularAuxData>> {
        if (card.data === undefined)
            return trivialPromise(card);

        var cardType = card.data!.content.cardType;
        var cardEntry = card.data!.content.cardEntry;
        var dp = gCardTypeRegistry[cardType].processEntry(cardEntry, st.settings.cardTypeSettings[cardType]);
    
        return dp.then((d) => {
            card.data!.content.cardData = d;
            return card;
        })
    }

    generateCardAsync(
        st: SpacedRepState<SRModularContent, SRModularAuxData, SRModularSettings>,
        card: SpacedRepCardPhysical<SRModularContent, SRModularAuxData>
    ): Promise<Flashcard> {
        if (card.data === undefined || card.data.content.cardData === undefined) {
            return trivialPromise(renderCard("noanswer-template",
                "No cards left to study."
            ));
        } 
        
        var cardType = card.data!.content.cardType;
        var cardEntry = card.data!.content.cardEntry;
        var cardData = card.data!.content.cardData;
        var fl = gCardTypeRegistry[cardType].generateCard(cardData, st.settings.cardTypeSettings[cardType]);
        fl.el.appendChild(makeCardsLeftSpan(card));
        return trivialPromise(fl);
    }

    makeEditor(st: SpacedRepState<SRModularContent, SRModularAuxData, SRModularSettings>):
        StateEditor<SpacedRepState<SRModularContent, SRModularAuxData, SRModularSettings>> {
        var contDiv = document.createElement("div");

        var infoWidget = infoWidgetSR((<any>this).gen, st);
        var studyingEditor = studyingEditorSR(st);
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

        var omitTagsEditor = singleTextFieldEditor(st.settings.inactiveTags.join(','));
        (<HTMLInputElement>omitTagsEditor.element).placeholder = "comma-separated tags...";
        var omitTagsCont = document.createElement("div");
        omitTagsCont.textContent = "Omit cards with the following tags: "
        omitTagsCont.appendChild(omitTagsEditor.element); 

        var filterEditor = textFilterSelectionMenu(st.settings.filterSettings);

        function makeCardEditor(c: SpacedRepCard<SRModularContent, SRModularAuxData>):
            StateEditor<SpacedRepCard<SRModularContent, SRModularAuxData>> {
            var cardType = c.content.cardType;
            var cardEntry = c.content.cardEntry;
            var ed = gCardTypeRegistry[cardType].makeEntryEditor(c.content.cardEntry);

            var tagsEd = singleTextFieldEditor(c.content.tags.join(','));
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
                return {
                    guid: c.guid,
                    content: {
                        cardType: c.content.cardType,
                        cardEntry: ed.menuToState(),
                        cardData: null,
                        tags: tagsEd.menuToState().split(",").filter((t) => t.length > 0)
                    },
                    due: c.due,
                    intervalMinutes: c.intervalMinutes,
                    auxdata: c.auxdata
                };
            };

            /* var cardMenuToPreview = () => {
                var cardState = <any>cardMenuToState();
                return (<any>this).gen.nextCardAsyncPreprocessing({
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
                    var cardPreviewDiv = (<any>this).gen.generateCard(
                        st,
                        cardMenuToPreview()
                    );
                    cardPreviewCont.innerHTML = ""; 
                    cardPreviewDiv.el.classList.add("flashcard");
                    cardPreviewDiv.el.classList.add("flashcard-preview");
                    cardPreviewCont.appendChild(cardPreviewDiv.el); 
                });
            });
            ed.element.appendChild(previewBtn);
            ed.element.appendChild(cardPreviewCont); */

            return {
                element: ed.element,
                menuToState: cardMenuToState
            };
        }
       
        var cardSettingsGroups: IDictionary<StateEditor<any>> = {}; 
        var cardEditorGroups: StateEditor<SpacedRepCard<SRModularContent, SRModularAuxData>[]>[] = [];
        for (var i in Object.keys(gCardTypeRegistry)) {
            var t = Object.keys(gCardTypeRegistry)[i];
            var cardsEditor = ((t) => multipleEditors(
                Object.values(st.cards).filter((c) => c.content.cardType == t),
                () => makeEmptyCard(t), 
                makeCardEditor,
                true,
                (s, cd) => gCardTypeRegistry[t].getSearchableText(cd.content.cardEntry).includes(s)
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
    new ModularSpacedRepGen(),
    "modular-spaced-repetition-deck",
    "Modular spaced repetition deck",
    defaultSRModularState,
    "#ffffdd"
);
