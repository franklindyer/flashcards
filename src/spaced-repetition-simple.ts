import {
    IDictionary,
    guidGenerator,
    makeDict,
    getSRFutureDateInfo,
    iconButton,
    trivialPromise
} from "./utils"
import {
    randomizeStringSub
} from "./random-templating"
import {
    Flashcard
} from "./flashcard"
import {
    FlashcardGen,
    FlashcardResult
} from "./flashcard-generator"
import {
    AbstractSpacedRepGen,
    SpacedRepState,
    SpacedRepCard,
    SpacedRepCardPhysical,
    SpacedRepStudying,
    makeSpacedRepCardDict,
    makeCardsLeftSpan
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
    registerDeckType
} from "./flashcard-deck"
import {
    emptySRQueue,
    SRNewQueue
} from "./spaced-repetition-newqueue"

export type SRSimpleContent = {
    prompt: string,
    answers: string[],
    tags: string[],
    twoSided: boolean,
    reversed?: boolean // This variable is only set during preprocessing
}

export type SRSimpleAuxData = {
    streak: number
}

export type SRSimpleSettings = {
    initialHours: number,
    correctFactor: number,
    incorrectFactor: number,
    inactiveTags: string[],
    readCorrectAnswers: boolean,
    speechSettings: SpeechSettings,
    filterSettings: TextFilterSettings
}

export const defaultSimpleSRSettings = {
    initialHours: 6,
    correctFactor: 1.6,
    incorrectFactor: 0.5,
    inactiveTags: [],
    readCorrectAnswers: false,
    speechSettings: defaultSpeechSettings(),
    filterSettings: defaultTextFilterSettings
};

export const defaultSimpleSRState: SpacedRepState<SRSimpleContent, SRSimpleAuxData, SRSimpleSettings> = {
    cards: makeSpacedRepCardDict([
        { prompt: "the dog", answers: ["le chien"], tags: [], twoSided: false },
        { prompt: "the man", answers: ["l'homme"], tags: [], twoSided: false },
        { prompt: "the woman", answers: ["la dame"], tags: [], twoSided: false }
    ], () => { return { streak: 0, intervalMinutes: 0, due: undefined }; }),
    newQ: emptySRQueue(10),
    studying: SpacedRepStudying.NewCards,
    settings: defaultSimpleSRSettings
};

export function makeEmptyCard(): SpacedRepCard<SRSimpleContent, SRSimpleAuxData> { 
    return {
        guid: guidGenerator(),
        content: {
            prompt: "",
            answers: [""],
            tags: [],
            twoSided: false
        },
        due: new Date(),
        intervalMinutes: 0,
        auxdata: {
            streak: 0
        }
    };
}

export class SimpleSpacedRepGen
    extends AbstractSpacedRepGen<SRSimpleContent, SRSimpleAuxData, SRSimpleSettings> {

    getGenName(): string { return "simple-spaced-repetition"; }

    cardIsEnabled(
        card: SpacedRepCard<SRSimpleContent, SRSimpleAuxData>,
        st: SpacedRepState<SRSimpleContent, SRSimpleAuxData, SRSimpleSettings>
    ) {
        return !card.content.tags.some((t) => st.settings.inactiveTags.some((s) => t === s)); 
    }

    updateInterval(
        card: SpacedRepCardPhysical<SRSimpleContent, SRSimpleAuxData>,
        settings: SRSimpleSettings,
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
        card: SpacedRepCardPhysical<SRSimpleContent, SRSimpleAuxData>,
        settings: SRSimpleSettings,
        correct: FlashcardResult
    ): SRSimpleAuxData {
        if (correct == FlashcardResult.Correct) {
            card.data!.auxdata.streak += 1;
        } else if (correct == FlashcardResult.Incorrect) {
            card.data!.auxdata.streak = 0;
        }
        return card.data!.auxdata;
    }

    repairDeckState(st: any): any {
        if (st.newQ === undefined) {
            st.newQ = emptySRQueue(10);
        }
        for (var i in Object.keys(st.cards)) {
            var k = Object.keys(st.cards)[i]; 
            if (!("twoSided" in st.cards[k])) {
                st.cards[k]["twoSided"] = false;
            }
        }
        return st;
    }

    applyCardTemplating(card: SpacedRepCardPhysical<SRSimpleContent, SRSimpleAuxData>):
        SpacedRepCardPhysical<SRSimpleContent, SRSimpleAuxData> {
        // Random substitution card templating
        var res = randomizeStringSub(card.data!.content.prompt, {});
        card.data!.content.prompt = res[0];
        card.data!.content.answers = card.data!.content.answers.map((a) => randomizeStringSub(a, res[1])[0]);
        return card;
    }

    nextCardPreprocessing(card: SpacedRepCardPhysical<SRSimpleContent, SRSimpleAuxData>)
        : SpacedRepCardPhysical<SRSimpleContent, SRSimpleAuxData> {
        // Clone the card so we don't mess with its state in the deck
        var card = <SpacedRepCardPhysical<SRSimpleContent, SRSimpleAuxData>>JSON.parse(JSON.stringify(card));
        if (card.data !== undefined) {
            card = this.applyCardTemplating(card);
            if (card.data!.content.twoSided) {
                card.data!.content.reversed = (Math.random() < 0.5);
            }
        }
        return card;
    }

    generateCard(
        st: SpacedRepState<SRSimpleContent, SRSimpleAuxData, SRSimpleSettings>,
        card: SpacedRepCardPhysical<SRSimpleContent, SRSimpleAuxData>
        ): Flashcard {
        var a = document.createElement("a");
        var prompt = "No cards left to study.";
        var answers: string[] = [];
        var hint = "You cannot continue studying until more cards become due."

        if (card.data !== undefined) {
            if (card.data!.content.reversed) {
                prompt = card.data!.content.answers[0];
                answers = [card.data!.content.prompt];
                hint = card.data!.content.prompt;
            } else {
                prompt = card.data!.content.prompt;
                answers = card.data!.content.answers;
                hint = card.data!.content.answers[0];
            }
        }

        var fontSize = 100.0/(10.0*Math.log(10+prompt.length));
        a.style.fontSize = `${fontSize}vw`;
        a.textContent = prompt;

        var fl = new Flashcard(a, hint);

        if (card.context.isPractice) {
            fl.el.style.backgroundColor = "#ffffee";
        } 
        fl.el.appendChild(makeCardsLeftSpan(card));

        return fl; 
    }

    checkAnswer(
        answer: string, 
        st: SpacedRepState<SRSimpleContent, SRSimpleAuxData, SRSimpleSettings>,
        card: SpacedRepCardPhysical<SRSimpleContent, SRSimpleAuxData>
    ): boolean {
        if (card.data === undefined) 
            return false;
        var cardData = card.data!;
        var tf = (s: string) => applyTextFilter(s, st.settings.filterSettings);

        // When verifying the answer, check if the card has been reversed
        if (cardData.content.twoSided && cardData.content.reversed)
            return tf(cardData.content.prompt) == tf(answer);
        else
            return cardData.content.answers.map(tf).includes(tf(answer));
    }

    correctEffect(
        st: SpacedRepState<SRSimpleContent, SRSimpleAuxData, SRSimpleSettings>,
        card: SpacedRepCardPhysical<SRSimpleContent, SRSimpleAuxData>,
        attempt: string,
        resolve: () => void
    ): void {
        var cardData = card.data!;
        if (st.settings.readCorrectAnswers) {
            var ss = st.settings.speechSettings;
            if (attempt.length > 0 && !(cardData.content.reversed)) { 
                utter(attempt, ss.voice, ss.rate, ss.pitch, resolve);
            } else {
                utter(cardData.content!.answers[0], ss.voice, ss.rate, ss.pitch, resolve);
            }
        } else {
            resolve();
        }
    }

}

function simpleSRMenu(st: SpacedRepState<SRSimpleContent, SRSimpleAuxData, SRSimpleSettings>): 
    StateEditor<SpacedRepState<SRSimpleContent, SRSimpleAuxData, SRSimpleSettings>> {
    var contDiv = document.createElement("div");

    var infoWidget = infoWidgetSR(st);
  
    var studyingEditor = studyingEditorSR(st); 

    var settings = st.settings;
    var initHoursEditor = scrollNumberEditor("Initial interval (hours): ", settings.initialHours, 1, 240, 1);
    var newQueueSizeEditor = scrollNumberEditor("Max new cards to study at once: ", st.newQ.maxNewCards, 1, 100, 1);
    var correctFactor = scrollNumberEditor("Correct factor: ", settings.correctFactor, 1, 10, 0.1);
    var incorrectFactor = scrollNumberEditor("Incorrect factor: ", settings.incorrectFactor, 0, 1.0, 0.01);

    var speechCheckbox = boolEditor("Speak correct answers using text-to-speech?", settings.readCorrectAnswers);
    var speechEditor = speechSettingsEditor(settings.speechSettings);
    var speechDiv = document.createElement("div");
    speechDiv.appendChild(speechCheckbox.element);
    speechDiv.appendChild(speechEditor.element);

    var omitTagsEditor = singleTextFieldEditor(settings.inactiveTags.join(','));
    (<HTMLInputElement>omitTagsEditor.element).placeholder = "comma-separated tags...";
    var omitTagsCont = document.createElement("div");
    omitTagsCont.textContent = "Omit cards with the following tags: "
    omitTagsCont.appendChild(omitTagsEditor.element);

    var filterEditor = textFilterSelectionMenu(settings.filterSettings);

    [
        studyingEditor.element,
        initHoursEditor.element,
        correctFactor.element,
        incorrectFactor.element,
        newQueueSizeEditor.element,
        omitTagsCont,
        speechDiv,
        filterEditor.element
    ].map((el) => el.classList.add("deck-menu-submenu"));

    function makeCardEditor(c: SpacedRepCard<SRSimpleContent, SRSimpleAuxData>): 
        StateEditor<SpacedRepCard<SRSimpleContent, SRSimpleAuxData>> {
        var edDetails = document.createElement("details");
        var edSummary = document.createElement("summary");
        edDetails.style.display = "inline-block";
        edDetails.appendChild(edSummary);
        edDetails.classList.add("cardlist-accordion");
        edDetails.onkeyup = function(e) {
            // The default behavior for SPACE in a <details> element is to toggle its openness.
            // We need to disable this since the user may be typing in an <input> inside this element.
            if (e.keyCode == 32) {
                e.preventDefault();
            }
        };

        var edMain = swappingTextEditor([c.content.prompt, c.content.answers.join('|')]);
        edMain.element.style.display = "inline-block";
        edSummary.appendChild(edMain.element);

        var tagsEd = singleTextFieldEditor(c.content.tags.join(','));
        (<HTMLInputElement>tagsEd.element).placeholder = "tags...";
        edDetails.appendChild(tagsEd.element);

        var twoSideEd = boolEditor("Double-sided card?", c.content.twoSided);
        edDetails.appendChild(twoSideEd.element);

        var cardInfo = document.createElement("a");
        cardInfo.classList.add("sr-card-due-date");
        cardInfo.style.color = "lightgray";
        cardInfo.style.marginLeft = "10px";
        cardInfo.style.marginRight = "10px";
        cardInfo.style.verticalAlign = "middle";
        if (c.intervalMinutes == 0) {
            cardInfo.textContent = "not studied";
        } else {
            cardInfo.textContent = `due ${getSRFutureDateInfo(c.due!)}`;
        }
        cardInfo.style.display = "block";
        edDetails.appendChild(cardInfo);

        var listenBtn = ((ed) => iconButton("speaker.png", () => {
            var ss = speechEditor.menuToState();
            var tgtText = ed.menuToState()[1];
            utter(tgtText, ss.voice, ss.rate, ss.pitch, () => {}); 
        }))(edMain);
        listenBtn.style.float = "";
        var listenDiv = document.createElement("div");
        listenDiv.style.overflowY = "visible";
        listenDiv.appendChild(listenBtn);
        edDetails.appendChild(listenDiv);

        return {
            element: edDetails,
            menuToState: () => {
                let tp = edMain.menuToState();
                return {
                    guid: c.guid,
                    content: {
                        prompt: tp[0],
                        answers: tp[1].split('|'),
                        tags: tagsEd.menuToState().split(',').filter((t) => t.length > 0),
                        twoSided: twoSideEd.menuToState()
                    },
                    due: c.due,
                    intervalMinutes: c.intervalMinutes,
                    auxdata: c.auxdata
                }
            }
        };
    };
    var cardsEditor = multipleEditors(
        Object.values(st.cards),
        () => makeEmptyCard(),
        makeCardEditor,
        true,
        (s, cd) => cd.content.prompt.includes(s) || cd.content.answers.some((a) => a.includes(s))
    );
    var cardsEditorTitle = document.createElement("h3");
    cardsEditorTitle.textContent = "Cards";
    cardsEditor.element.prepend(cardsEditorTitle);
    cardsEditor.element.classList.add("deck-menu-submenu");

    var components = [
        infoWidget,
        studyingEditor.element,
        initHoursEditor.element,
        correctFactor.element,
        incorrectFactor.element,
        newQueueSizeEditor.element,
        omitTagsCont,
        speechDiv,
        filterEditor.element,
        cardsEditor.element,
    ];
    components.map((el) => contDiv.appendChild(el));

    return {
        element: contDiv,
        menuToState: () => { return {
            studying: studyingEditor.menuToState(),
            settings: {
                initialHours: initHoursEditor.menuToState(),
                correctFactor: correctFactor.menuToState(),
                incorrectFactor: incorrectFactor.menuToState(),
                readCorrectAnswers: speechCheckbox.menuToState(),
                speechSettings: speechEditor.menuToState(),
                filterSettings: filterEditor.menuToState(),
                inactiveTags: omitTagsEditor.menuToState().split(',')
            },
            newQ: emptySRQueue(newQueueSizeEditor.menuToState()),
            cards: makeDict(cardsEditor.menuToState(), (c) => c.guid),
        }}
    } 
}

registerDeckType(
    new SimpleSpacedRepGen(),
    simpleSRMenu,
    "simple-spaced-repetition-deck",
    "Simple spaced repetition deck",
    defaultSimpleSRState,
    "#ffffdd"
)
