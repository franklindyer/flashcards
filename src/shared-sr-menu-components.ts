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

/* function simpleSRMenu(st: SpacedRepState<SRSimpleContent, SRSimpleAuxData, SRSimpleSettings>): 
    StateEditor<SpacedRepState<SRSimpleContent, SRSimpleAuxData, SRSimpleSettings>> {
    var contDiv = document.createElement("div");

    var totP = document.createElement("p");
    totP.textContent = `Total cards: ${Object.keys(st.cards).length}`;
    totP.style.color = "#666666";
    totP.style.fontWeight = "bold";
    var newP = document.createElement("p");
    newP.textContent = `New cards: ${Object.keys(st.cards).filter((i) => st.cards[i].intervalMinutes == 0).length}`;    
    newP.style.color = "#9999ee";
    newP.style.fontWeight = "bold";
    var dueP = document.createElement("p");
    dueP.textContent = `Due cards: ${Object.keys(st.cards).filter((i) => st.cards[i].intervalMinutes > 0 && new Date(st.cards[i].due) < new Date()).length}`;
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

    function makeCardEditor(c: SpacedRepCard<SRSimpleContent, SRSimpleAuxData>): 
        StateEditor<SpacedRepCard<SRSimpleContent, SRSimpleAuxData>> {
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
                return {
                    guid: c.guid,
                    content: {
                        prompt: tp[0][0],
                        answers: tp[0][1].split('|'),
                        tags: tp[1].split(',').filter((t) => t.length > 0)
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
) */
