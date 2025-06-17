import {
    IDictionary,
    guidGenerator,
    makeDict
} from "./utils"
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
    registerDeckType
} from "./flashcard-deck"

export type SRSimpleContent = {
    prompt: string,
    answers: string[],
    tags: string[]
}

export type SRSimpleTiming = {
    streak: number,
    intervalMinutes: number,
    due?: Date
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

export const defaultSimpleSRState: SpacedRepState<SRSimpleContent, SRSimpleTiming, SRSimpleSettings> = {
    cards: makeSpacedRepCardDict([
        { prompt: "the dog", answers: ["le chien"], tags: [] },
        { prompt: "the man", answers: ["l'homme"], tags: [] },
        { prompt: "the woman", answers: ["la dame"], tags: [] }
    ], () => { return { streak: 0, intervalMinutes: 0, due: undefined }; }),
    newIndex: 0,
    newQueue: [],
    newQueueSize: 10,
    studying: SpacedRepStudying.NewCards,
    settings: defaultSimpleSRSettings
};

export function makeEmptyCard(): SpacedRepCard<SRSimpleContent, SRSimpleTiming> { 
    return {
        guid: guidGenerator(),
        content: {
            prompt: "",
            answers: [""],
            tags: []
        },
        timing: {
            streak: 0,
            intervalMinutes: 0,
            due: undefined
        }
    };
}

export class SimpleSpacedRepGen
    extends AbstractSpacedRepGen<SRSimpleContent, SRSimpleTiming, SRSimpleSettings> {

    getGenName(): string { return "simple-spaced-repetition"; }

    cardIsDue(card: SpacedRepCard<SRSimpleContent, SRSimpleTiming>): boolean {
        return (card.timing.due != undefined) && (new Date(card.timing.due!) < this.getDate());
    }
    
    cardIsNew(card: SpacedRepCard<SRSimpleContent, SRSimpleTiming>): boolean {
        return card.timing.due == undefined;
    }
    
    updateCard(
        settings: SRSimpleSettings,
        card: SpacedRepCardPhysical<SRSimpleContent, SRSimpleTiming>,
        correct: FlashcardResult
    ): SpacedRepCard<SRSimpleContent, SRSimpleTiming> {
        var cardData = card.data!;
        var isNew = cardData.timing.due === undefined;
        if (card.context.isPractice) {
            return cardData;
        } 

        if (correct == FlashcardResult.Correct) {
            cardData.timing.streak += 1;
            if (isNew && cardData.timing.streak >= 3) {
                cardData.timing.intervalMinutes = settings.initialHours * 60;
                cardData.timing.due = this.getDate();
                cardData.timing.due!.setHours(cardData.timing.due!.getHours() + cardData.timing.intervalMinutes/60);
            } else if (!isNew) {
                cardData.timing.intervalMinutes = settings.correctFactor * cardData.timing.intervalMinutes;
                // Reschedule card if it came due
                cardData.timing.due = this.getDate();
                cardData.timing.due!.setHours(cardData.timing.due!.getHours() + cardData.timing.intervalMinutes/60);
            }
        } else if (correct == FlashcardResult.Incorrect) {
            cardData.timing.streak = 0;
            if (!isNew) {
                cardData.timing.intervalMinutes = settings.incorrectFactor * cardData.timing.intervalMinutes;
            }
        }
        cardData.timing.intervalMinutes = Math.max(cardData.timing.intervalMinutes, settings.initialHours * 60);

        return cardData;
    }

    repairDeckState(st: any): any {
        return st;
    }

    generateCard(card: SpacedRepCardPhysical<SRSimpleContent, SRSimpleTiming>): 
        Flashcard {
        var a = document.createElement("a");
        var prompt = "No cards left to study.";
        var hint = "You cannot continue studying until more cards become due."

        if (card.data !== undefined) {
            prompt = card.data!.content.prompt;
            hint = card.data!.content.answers[0];
        }

        var fontSize = 100.0/(10.0*Math.log(10+prompt.length));
        a.style.fontSize = `${fontSize}vw`;
        a.textContent = prompt;

        var fl = new Flashcard(a, hint);

        var infoText = document.createElement("span");
        infoText.classList.add("cards-left-span");
        if (card.context.isPractice) {
            infoText.textContent = "This is a practice card. It will not affect your progress.";
            fl.el.style.backgroundColor = "#ffffee";
        } else {
            infoText.textContent = `${card.context.cardsLeft} cards remaining`;
        }
        fl.el.appendChild(infoText);

        return fl; 
    }

    checkAnswer(
        answer: string, 
        st: SpacedRepState<SRSimpleContent, SRSimpleTiming, SRSimpleSettings>,
        card: SpacedRepCardPhysical<SRSimpleContent, SRSimpleTiming>
    ): boolean {
        if (card.data === undefined) 
            return false;
        var cardData = card.data!;
        var tf = (s: string) => applyTextFilter(s, st.settings.filterSettings);
        return cardData.content.answers.map(tf).includes(tf(answer));
    }

    correctEffect(
        st: SpacedRepState<SRSimpleContent, SRSimpleTiming, SRSimpleSettings>,
        card: SpacedRepCardPhysical<SRSimpleContent, SRSimpleTiming>,
        attempt: string,
        resolve: () => void
    ): void {
        var cardData = card.data!;
        if (st.settings.readCorrectAnswers) {
            var ss = st.settings.speechSettings;
            if (attempt.length > 0) { 
                utter(attempt, ss.voice, ss.rate, ss.pitch, resolve);
            } else {
                utter(cardData.content!.answers[0], ss.voice, ss.rate, ss.pitch, resolve);
            }
        } else {
            resolve();
        }
    }

}

function simpleSRMenu(st: SpacedRepState<SRSimpleContent, SRSimpleTiming, SRSimpleSettings>): 
    StateEditor<SpacedRepState<SRSimpleContent, SRSimpleTiming, SRSimpleSettings>> {
    var contDiv = document.createElement("div");

    var totP = document.createElement("p");
    totP.textContent = `Total cards: ${Object.keys(st.cards).length}`;
    totP.style.color = "#666666";
    totP.style.fontWeight = "bold";
    var newP = document.createElement("p");
    newP.textContent = `New cards: ${Object.keys(st.cards).filter((i) => st.cards[i].timing.due == undefined).length}`;    
    newP.style.color = "#9999ee";
    newP.style.fontWeight = "bold";
    var dueP = document.createElement("p");
    dueP.textContent = `Due cards: ${Object.keys(st.cards).filter((i) => st.cards[i].timing.due !== undefined).length}`;
    dueP.style.color = "#ee9999";
    dueP.style.fontWeight = "bold"; 
  
    var studyingEditor = radioEditor(
        st.studying,
        [SpacedRepStudying.NewCards, SpacedRepStudying.DueCards, SpacedRepStudying.RandomCards],
        ["Study new cards", "Study due cards", "Practice random cards"]
    );

    var settings = st.settings;
    var initHoursEditor = scrollNumberEditor("Initial interval (hours): ", settings.initialHours, 1, 240, 1);
    var newQueueSizeEditor = scrollNumberEditor("Max new cards to study at once: ", st.newQueueSize, 1, 100, 1);
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

    function makeCardEditor(c: SpacedRepCard<SRSimpleContent, SRSimpleTiming>): 
        StateEditor<SpacedRepCard<SRSimpleContent, SRSimpleTiming>> {
        var ed = combineEditors(
            [[c.content.prompt, c.content.answers.join('|')], c.content.tags.join(',')],
            (pr: any) => {
                var ed2 = swappingTextEditor(pr);
                ed2.element.style.display = "inline-block";
                return ed2;
            },
            (ts: string) => {
                var ed2 = singleTextFieldEditor(ts);
                (<HTMLInputElement>ed2.element).placeholder = "tags...";
                return ed2;
            }
        );
        var cardInfo = document.createElement("a");
        cardInfo.style.color = "lightgray";
        cardInfo.style.marginLeft = "10px";
        cardInfo.style.marginRight = "10px";
        cardInfo.style.verticalAlign = "middle";
        if (c.timing.due === undefined) {
            cardInfo.textContent = "not studied";
        } else {
            cardInfo.textContent = `due ${c.timing.due!.toLocaleString().split('T')[0]}`;
        }
        ed.element.appendChild(cardInfo);
        return {
            element: ed.element,
            menuToState: () => {
                let tp = ed.menuToState();
                return {
                    guid: c.guid,
                    content: {
                        prompt: tp[0][0],
                        answers: tp[0][1].split('|'),
                        tags: tp[1].split(',').filter((t) => t.length > 0)
                    },
                    timing: c.timing
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
        totP,
        newP,
        dueP,
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
            newQueue: st.newQueue,
            newIndex: st.newIndex,
            newQueueSize: newQueueSizeEditor.menuToState(),
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
