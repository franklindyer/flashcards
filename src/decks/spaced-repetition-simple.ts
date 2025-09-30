import {
    IDictionary,
    guidGenerator,
    makeDict,
    getSRFutureDateInfo,
    iconButton,
    trivialPromise,
    recursiveRepairJSON,
    recursiveRepairEachValueJSON
} from "utils/utils"
import {
    randomizeStringSub
} from "utils/random-templating"
import {
    Flashcard
} from "core/flashcard"
import {
    FlashcardGen,
    FlashcardResult
} from "core/flashcard-generator"
import {
    AbstractSpacedRepGen,
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
    registerDeckType
} from "core/flashcard-deck"
import {
    emptySRQueue,
    SRNewQueue
} from "utils/spaced-repetition-newqueue"
import {
    PushcardQueue,
    makePCQEditor,
    defaultPushcardQueue
} from "utils/pushcard-queue"

export type SRSimpleContent = {
    prompt: string[],
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
    doTwoSided: boolean,
    readCorrectAnswers: boolean,
    speechSettings: SpeechSettings,
    filterSettings: TextFilterSettings,
    pushcardQueue: PushcardQueue
}

export const defaultSimpleSRSettings = {
    initialHours: 6,
    correctFactor: 1.6,
    incorrectFactor: 0.5,
    inactiveTags: [],
    doTwoSided: true,
    readCorrectAnswers: false,
    speechSettings: defaultSpeechSettings(),
    filterSettings: defaultTextFilterSettings,
    pushcardQueue: defaultPushcardQueue()
};

export const defaultSimpleSRState: SpacedRepState<SRSimpleContent, SRSimpleAuxData, SRSimpleSettings> = {
    cards: makeSpacedRepCardDict([
        { prompt: ["the dog"], answers: ["le chien"], tags: [], twoSided: false },
        { prompt: ["the man"], answers: ["l'homme"], tags: [], twoSided: false },
        { prompt: ["the woman"], answers: ["la dame"], tags: [], twoSided: false }
    ], () => { return { streak: 0, intervalMinutes: 0 }; }),
    newQ: emptySRQueue(10),
    studying: SpacedRepStudying.NewCards,
    settings: defaultSimpleSRSettings,
};

export function makeEmptyCard(): SpacedRepCard<SRSimpleContent, SRSimpleAuxData> { 
    return {
        guid: guidGenerator(),
        content: {
            prompt: [""],
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
        st = recursiveRepairJSON(st, defaultSimpleSRState, ["cards"]);
        st.cards = recursiveRepairEachValueJSON(st.cards, Object.values(defaultSimpleSRState.cards)[0]); 
        return st;
    }

    applyCardTemplating(card: SpacedRepCardPhysical<SRSimpleContent, SRSimpleAuxData>):
        SpacedRepCardPhysical<SRSimpleContent, SRSimpleAuxData> {
        // Random substitution card templating
        var new_prompt = [];
        var new_answers = [];
        var ctx = {};
        for (var i in Object.keys(card.data!.content.prompt)) {
            var res = randomizeStringSub(card.data!.content.prompt[i], ctx);
            ctx = res[1];
            new_prompt.push(res[0]);
        }
        for (var i in Object.keys(card.data!.content.answers)) {
            var res = randomizeStringSub(card.data!.content.answers[i], ctx);
            ctx = res[1];
            new_answers.push(res[0]);
        }
        card.data!.content.prompt = new_prompt; 
        card.data!.content.answers = new_answers;
        return card;
    }

    nextCardPreprocessing(
        card: SpacedRepCardPhysical<SRSimpleContent, SRSimpleAuxData>,
        st: SpacedRepState<SRSimpleContent, SRSimpleAuxData, SRSimpleSettings>
        ) : SpacedRepCardPhysical<SRSimpleContent, SRSimpleAuxData> {
        // Clone the card so we don't mess with its state in the deck
        var card = <SpacedRepCardPhysical<SRSimpleContent, SRSimpleAuxData>>JSON.parse(JSON.stringify(card));
        if (card.data !== undefined) {
            card = this.applyCardTemplating(card);
            if (card.data!.content.twoSided && st.settings.doTwoSided) {
                card.data!.content.reversed = (Math.random() < 0.5);
            }
        }
        return card;
    }

    generateCard(
        st: SpacedRepState<SRSimpleContent, SRSimpleAuxData, SRSimpleSettings>,
        card: SpacedRepCardPhysical<SRSimpleContent, SRSimpleAuxData>
        ): Flashcard {
        var a = document.createElement("div");
        var prompt = "No cards left to study.";
        var answers: string[] = [];
        var hint = "You cannot continue studying until more cards become due."

        if (card.data !== undefined) {
            if (card.data!.content.reversed) {
                prompt = card.data!.content.answers[0];
                answers = card.data!.content.prompt;
                hint = card.data!.content.prompt[0];
            } else {
                prompt = card.data!.content.prompt[0];
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
            return cardData.content.prompt.map(tf).includes(tf(answer));  
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

    makeEditor(st: SpacedRepState<SRSimpleContent, SRSimpleAuxData, SRSimpleSettings>): 
        StateEditor<SpacedRepState<SRSimpleContent, SRSimpleAuxData, SRSimpleSettings>> {
        var contDiv = document.createElement("div");

        var infoWidget = infoWidgetSR((<any>this).gen, st);
      
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

        var twoSidedEditor = boolEditor("Study both sides of two-sided cards?", settings.doTwoSided);
        var twoSidedCont = document.createElement("div");
        twoSidedCont.appendChild(twoSidedEditor.element);

        var filterEditor = textFilterSelectionMenu(settings.filterSettings);

        var pcqEditor = makePCQEditor(settings.pushcardQueue);

        [
            studyingEditor.element,
            initHoursEditor.element,
            correctFactor.element,
            incorrectFactor.element,
            newQueueSizeEditor.element,
            omitTagsCont,
            twoSidedCont,
            speechDiv,
            filterEditor.element,
            pcqEditor.element,
        ].map((el) => el.classList.add("deck-menu-submenu"));

        var _this = this;
        var makeCardEditor = (c: SpacedRepCard<SRSimpleContent, SRSimpleAuxData>) => { 
//            StateEditor<SpacedRepCard<SRSimpleContent, SRSimpleAuxData>> => {
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

            var edMain = swappingTextEditor([c.content.prompt.join('|'), c.content.answers.join('|')]);
            edMain.element.style.display = "inline-block";
            edSummary.appendChild(edMain.element);

            var tagsEd = singleTextFieldEditor(c.content.tags.join(','));
            (<HTMLInputElement>tagsEd.element).placeholder = "tags...";
            edDetails.appendChild(tagsEd.element);

            var twoSideEd = boolEditor("Double-sided card?", c.content.twoSided);
            edDetails.appendChild(twoSideEd.element);

            var cardInfo = document.createElement("a");
            cardInfo.classList.add("sr-card-due-date");
            if (c.intervalMinutes == 0) {
                cardInfo.textContent = "not studied";
            } else {
                cardInfo.textContent = `due ${getSRFutureDateInfo(c.due!)}`;
            }

            var cardMenuToState = ((edMain) => () => {
                let tp = edMain.menuToState();
                 return {
                    guid: c.guid,
                    content: {
                        prompt: tp[0].split('|'),
                        answers: tp[1].split('|'),
                        tags: tagsEd.menuToState().split(',').filter((t) => t.length > 0),
                        twoSided: twoSideEd.menuToState()
                    },
                    due: c.due,
                    intervalMinutes: c.intervalMinutes,
                    auxdata: c.auxdata
                }
            })(edMain)

            var cardMenuToPreview = () => {
                var cardState = cardMenuToState();
                return (<any>this).gen.nextCardPreprocessing({
                    data: cardState,
                    context: {
                        cardsLeft: 0,
                        isPractice: false
                    }
                }, st);
            }

            var listenBtn = ((ed) => iconButton("speaker.png", () => {
                var ss = speechEditor.menuToState();
                var tgtText = cardMenuToPreview().data.content.answers[0];
                utter(tgtText, ss.voice, ss.rate, ss.pitch, () => {}); 
            }))(edMain);
            listenBtn.style.float = "";

            var cardPreviewCont = document.createElement("div");
            var previewBtn = iconButton("eyeball.png", () => {
                var cardData = cardMenuToState();
                var cardPreviewDiv = (<any>this).gen.generateCard(
                    st,
                    cardMenuToPreview()
                );
                cardPreviewCont.innerHTML = "";
                cardPreviewDiv.el.classList.add("flashcard");
                cardPreviewDiv.el.classList.add("flashcard-preview");
                cardPreviewCont.appendChild(cardPreviewDiv.el);
            });
            previewBtn.style.float = "";
            cardPreviewCont.classList.add("card-preview-container");
 
            var cardBottomDiv = document.createElement("div");
            // cardBottomDiv.style.overflow = "auto";
            edDetails.appendChild(cardBottomDiv);
            cardBottomDiv.appendChild(cardInfo);
            cardBottomDiv.appendChild(listenBtn);
            cardBottomDiv.appendChild(previewBtn);
            edDetails.appendChild(cardPreviewCont);

            return {
                element: edDetails,
                menuToState: cardMenuToState
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
            twoSidedCont,
            speechDiv,
            filterEditor.element,
            pcqEditor.element,
            cardsEditor.element,
        ];
        components.map((el) => contDiv.appendChild(el));

        return {
            element: contDiv,
            menuToState: () => { 
                var pcq = pcqEditor.menuToState();
                var pushedCards = pcq.accepted.map((content) => {
                    var c = makeEmptyCard();
                    c.content = content;
                    return c;
                });
                pcq.accepted = [];
                return {
                    studying: studyingEditor.menuToState(),
                    settings: {
                        initialHours: initHoursEditor.menuToState(),
                        correctFactor: correctFactor.menuToState(),
                        incorrectFactor: incorrectFactor.menuToState(),
                        readCorrectAnswers: speechCheckbox.menuToState(),
                        speechSettings: speechEditor.menuToState(),
                        filterSettings: filterEditor.menuToState(),
                        pushcardQueue: pcq, 
                        inactiveTags: omitTagsEditor.menuToState().split(','),
                        doTwoSided: twoSidedEditor.menuToState()
                    },
                    newQ: emptySRQueue(newQueueSizeEditor.menuToState()),
                    cards: makeDict(pushedCards.concat(cardsEditor.menuToState()), (c) => c.guid),
                };
            }
        } 
    }

}

registerDeckType(
    new SimpleSpacedRepGen(),
    "simple-spaced-repetition-deck",
    "Simple spaced repetition deck",
    defaultSimpleSRState,
    "#ffffdd"
)
