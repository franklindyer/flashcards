import {
    IDictionary,
    guidGenerator,
    makeDict,
    trivialPromise
} from "./utils"
import {
    Preloader
} from "./generic-preloader"
import {
    Flashcard
} from "./flashcard"
import {
    FlashcardGen,
    FlashcardResult
} from "./flashcard-generator"
import {
    AbstractAsyncSpacedRepGen,
    SpacedRepState,
    SpacedRepCard,
    SpacedRepCardPhysical,
    SpacedRepStudying,
    makeSpacedRepCardDict
} from "./spaced-repetition-general"
import {
    utter,
    speechSettingsEditor,
    defaultSpeechSettings,
    SpeechSettings
} from "./speech"
import {
    TextFilterSettings,
    applyTextFilter,
    textFilterSelectionMenu,
    defaultTextFilterSettings
} from "./text-filters"
import {
    StateEditor,
    boolEditor,
    scrollNumberEditor,
    singleTextFieldEditor,
    radioEditor,
    combineEditors,
    swappingTextEditor,
    multipleEditors
} from "./editor"
import {
    infoWidgetSR,
    studyingEditorSR
} from "./shared-sr-menu-components"
import {
    renderCard
} from "./flashcard-template"
import {
    registerDeckType
} from "./flashcard-deck"
import {
    emptySRQueue,
    SRNewQueue
} from "./spaced-repetition-newqueue"

export type SRClozeContent = {
    key: string,
    tags: string[]
}

export type SRClozeAuxData = {
    streak: number,
    invalid: boolean,
    cloze?: {
        prompt: string,
        answer: string,
        translation: string 
    }
}

export type SRClozeSettings = {
    clozeServerUrl: string,
    sourceLangs: string[],
    targetLang: string,
    initialHours: number,
    correctFactor: number,
    incorrectFactor: number,
    inactiveTags: string[],
    readCorrectAnswers: boolean,
    speechSettings: SpeechSettings,
    filterSettings: TextFilterSettings
}

export const defaultSRClozeSettings = {
    clozeServerUrl: "",
    sourceLangs: ["eng", "spa"],
    targetLang: "deu",
    initialHours: 8,
    correctFactor: 1.5,
    incorrectFactor: 0.5,
    inactiveTags: [],
    readCorrectAnswers: false,
    speechSettings: defaultSpeechSettings(),
    filterSettings: defaultTextFilterSettings
}

export const defaultSRClozeState: SpacedRepState<SRClozeContent, SRClozeAuxData, SRClozeSettings> = {
    cards: makeSpacedRepCardDict([
        { key: "Hund", tags: [] },
        { key: "Katze", tags: [] },
        { key: "Mensch", tags: [] }
    ], () => { return { streak: 0, invalid: false }; }),
    newQ: emptySRQueue(10),
    studying: SpacedRepStudying.NewCards,
    settings: defaultSRClozeSettings
};

function makeEmptyCard(): SpacedRepCard<SRClozeContent, SRClozeAuxData> {
    return {
        guid: guidGenerator(),
        content: {
            key: "",
            tags: []
        },
        due: new Date(),
        intervalMinutes: 0,
        auxdata: {
            streak: 0,
            invalid: false
        }
    }
}

export class ClozeSpacedRepGen
    extends AbstractAsyncSpacedRepGen<SRClozeContent, SRClozeAuxData, SRClozeSettings> {

    getGenName(): string { return "cloze-spaced-repetition"; }

    repairDeckState(st: any): any {
        this.preFetchClozes(st);
        if (st.newQ === undefined) {
            st.newQ = emptySRQueue(10);
        }
        return st;
    }

    cache: Preloader<any> = new Preloader(10);

    cardIsEnabled(
        card: SpacedRepCard<SRClozeContent, SRClozeAuxData>,
        st: SpacedRepState<SRClozeContent, SRClozeAuxData, SRClozeSettings>
    ): boolean {
        return !card.auxdata.invalid;
    }

    correctEffect(
        st: SpacedRepState<SRClozeContent, SRClozeAuxData, SRClozeSettings>,
        card: SpacedRepCardPhysical<SRClozeContent, SRClozeAuxData>,
        attempt: string,
        resolve: () => void
    ): void {
        var cardData = card.data!;
        if (st.settings.readCorrectAnswers && card.data!.auxdata.cloze !== undefined) {
            var ss = st.settings.speechSettings;
            if (attempt.length > 0) { 
                utter(attempt, ss.voice, ss.rate, ss.pitch, resolve);
            } else {
                utter(cardData.auxdata.cloze!.answer, ss.voice, ss.rate, ss.pitch, resolve);
            }
        } else {
            resolve();
        }
    }

    updateInterval(
        card: SpacedRepCardPhysical<SRClozeContent, SRClozeAuxData>,
        settings: SRClozeSettings,
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
        card: SpacedRepCardPhysical<SRClozeContent, SRClozeAuxData>,
        settings: SRClozeSettings,
        correct: FlashcardResult
    ): SRClozeAuxData {
        if (correct == FlashcardResult.Correct) {
            if (card.data!.auxdata.cloze == undefined) {
                // When a card with invalid cloze is overridden, mark it as invalid
                card.data!.auxdata.invalid = true;
            } else {
                card.data!.auxdata.streak += 1;
            }
        } else if (correct == FlashcardResult.Incorrect) {
            card.data!.auxdata.streak = 0;
        } 
        return card.data!.auxdata;
    }

    checkAnswerAsync(
        answer: string,
        st: SpacedRepState<SRClozeContent, SRClozeAuxData, SRClozeSettings>,
        card: SpacedRepCardPhysical<SRClozeContent, SRClozeAuxData>
    ): Promise<boolean> {
        if (card.data === undefined || card.data!.auxdata.cloze === undefined) {
            return trivialPromise(false);
        }
        var tf = (s: string) => applyTextFilter(s, st.settings.filterSettings);
        return trivialPromise(tf(card.data!.auxdata.cloze!.answer) === tf(answer));
    }

    fetchCloze(
        lemma: string, 
        settings: SRClozeSettings 
    ): Promise<any> {
        return fetch(
            `${settings.clozeServerUrl}/cloze?` + new URLSearchParams({ 
                "srcs": settings.sourceLangs.join(","),
                "tgt": settings.targetLang,
                "lemma": lemma
            }).toString()
        ).then((r) => r.json()).catch((e) => undefined);
    }

    preFetchClozes(
        st: SpacedRepState<SRClozeContent, SRClozeAuxData, SRClozeSettings>
    ): void {
        this.getNew(st).map((k) => {
            var key = st.cards[k].content.key;
            this.cache.addKey(key, (k: string) => this.fetchCloze(k, st.settings));
        });
        this.getDue(st).map((k) => {
            var key = st.cards[k].content.key;
            this.cache.addKey(key, (k: string) => this.fetchCloze(k, st.settings));
        });
    }

    nextCardAsyncPreprocessing(
        card: SpacedRepCardPhysical<SRClozeContent, SRClozeAuxData>,
        st: SpacedRepState<SRClozeContent, SRClozeAuxData, SRClozeSettings>
    ): Promise<SpacedRepCardPhysical<SRClozeContent, SRClozeAuxData>> {
        console.log("DOING PREPROCESSING");
        if (st.settings.clozeServerUrl.length == 0 || card.data === undefined) {
            // Returns with .cloze attribute undefined, indicating failure
            return trivialPromise(card);
        }
        return this.cache.getKey(
                card.data.content.key,
                (k: string) => this.fetchCloze(k, st.settings)
            ).then(
                (j) => {
                    if (j === undefined) {
                        return card;
                    }
                    card.data!.auxdata.cloze = {
                        prompt: j["puzzle"],
                        answer: j["target"],
                        translation: j["source"]
                    };
                    console.log(card);
                    return card;
                }
            ).catch((e) => {
                console.log(e);
                console.log(card);
                return card;
            });
    }

    generateCardAsync(
        card: SpacedRepCardPhysical<SRClozeContent, SRClozeAuxData>
    ): Promise<Flashcard> {
        console.log(card);
        if (card.data === undefined) {
            return trivialPromise(renderCard("noanswer-template",
                "No cards left to study."
            ));
        } else if (card.data!.auxdata.cloze === undefined) {
            return trivialPromise(renderCard("noanswer-template",
                `Could not get puzzle for card "${card.data!.content.key}".`
            ));
        }
        return trivialPromise(renderCard("cloze-template", {
            group: "", 
            guid: card.data!.guid,
            upper: card.data!.auxdata.cloze!.prompt,
            lower: card.data!.auxdata.cloze!.translation
        }));
    }
}

function clozeSRMenu(st: SpacedRepState<SRClozeContent, SRClozeAuxData, SRClozeSettings>):
    StateEditor<SpacedRepState<SRClozeContent, SRClozeAuxData, SRClozeSettings>> {
    var contDiv = document.createElement("div");

    var infoWidget = infoWidgetSR(st);
    var studyingEditor = studyingEditorSR(st);
    var newQueueSizeEditor = scrollNumberEditor("Max new cards to study at once: ", st.newQ.maxNewCards, 1, 100, 1);

    var clozeServerDiv = document.createElement("div");
    clozeServerDiv.classList.add("deck-menu-submenu");
    var clozeServerUrlEditor = singleTextFieldEditor(st.settings.clozeServerUrl)
    var clozeSourceLangEditor = singleTextFieldEditor(st.settings.sourceLangs.join(','));
    var clozeTargetLangEditor = singleTextFieldEditor(st.settings.targetLang);
    clozeServerDiv.appendChild(clozeServerUrlEditor.element);
    clozeServerDiv.appendChild(clozeSourceLangEditor.element);
    clozeServerDiv.appendChild(clozeTargetLangEditor.element);

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

    function makeCardEditor(c: SpacedRepCard<SRClozeContent, SRClozeAuxData>):
        StateEditor<SpacedRepCard<SRClozeContent, SRClozeAuxData>> {
        var ed = combineEditors(
            [c.content.key, c.content.tags.join(',')],
            (k) => {
                var ed2 = singleTextFieldEditor(k);
                ed2.element.style.display = "inline-block";
                return ed2;
            },
            (ts) => {
                var ed2 = singleTextFieldEditor(ts);
                (<HTMLInputElement>ed2.element).placeholder = "tags...";
                return ed2;
            }
        );
        var tf1 = ed.element.children[0];
        if (c.auxdata.invalid)
            (<HTMLElement>tf1).style.backgroundColor = "#ffeeee";
        var cardInfo = document.createElement("a");
        cardInfo.style.color = "lightgray";
        cardInfo.style.marginLeft = "10px";
        cardInfo.style.marginRight = "10px";
        cardInfo.style.verticalAlign = "middle";
        if (c.intervalMinutes == 0) {
            cardInfo.textContent = "not studied";
        } else {
            cardInfo.textContent = `due ${c.due!.toLocaleString().split('T')[0]}`;
        }
        ed.element.appendChild(cardInfo);
        return {
            element: ed.element,
            menuToState: () => {
                let tp = ed.menuToState();
                c.content.key = tp[0];
                c.content.tags = tp[1].split(",");
                return c;
            }
        }
    }
    var cardsEditor = multipleEditors(
        Object.values(st.cards),
        () => makeEmptyCard(),
        makeCardEditor,
        true,
        (s, cd) => cd.content.key.includes(s)
    );

    [
        infoWidget,
        studyingEditor.element,
        clozeServerDiv,
        initHoursEditor.element,
        newQueueSizeEditor.element,
        correctFactor.element,
        incorrectFactor.element,
        omitTagsCont,
        speechDiv,
        filterEditor.element,
        cardsEditor.element
    ].map((el) => {
        el.classList.add("deck-menu-submenu");
        contDiv.appendChild(el);
    });

    return {
        element: contDiv,
        menuToState: () => { return {
            studying: studyingEditor.menuToState(),
            settings: {
                clozeServerUrl: clozeServerUrlEditor.menuToState(),
                sourceLangs: clozeSourceLangEditor.menuToState().split(","),
                targetLang: clozeTargetLangEditor.menuToState(),
                initialHours: initHoursEditor.menuToState(),
                correctFactor: correctFactor.menuToState(),
                incorrectFactor: incorrectFactor.menuToState(),
                readCorrectAnswers: speechCheckbox.menuToState(),
                speechSettings: speechEditor.menuToState(),
                filterSettings: filterEditor.menuToState(),
                inactiveTags: omitTagsEditor.menuToState().split(",")
            },
            newQ: emptySRQueue(newQueueSizeEditor.menuToState()),
            cards: makeDict(cardsEditor.menuToState(), (c) => c.guid),
        }}
    };
}

registerDeckType(
    new ClozeSpacedRepGen(),
    clozeSRMenu,
    "cloze-spaced-repetition-deck",
    "Cloze spaced repetition deck",
    defaultSRClozeState,
    "#ffffdd"
); 
