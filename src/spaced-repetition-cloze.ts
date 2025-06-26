import {
    IDictionary,
    guidGenerator,
    makeDict,
    trivialPromise
} from "./utils"
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
    renderCard
} from "./flashcard-template"
import {
    registerDeckType
} from "./flashcard-deck"

export type SRClozeContent = {
    key: string,
    tags: string[],
    verified: boolean
}

export type SRClozeAuxData = {
    streak: number,
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
    sourceLangs: ["en", "es"],
    targetLang: "de",
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
        { key: "Hund", tags: [], verified: false },
        { key: "Katze", tags: [], verified: false },
        { key: "Mensch", tags: [], verified: false }
    ], () => { return { streak: 0 }; }),
    newIndex: 0,
    newQueue: [],
    newQueueSize: 10,
    studying: SpacedRepStudying.NewCards,
    settings: defaultSRClozeSettings
};

async function getClozePuzzle(key: string, serverUrl: string) {
    // return fetch(`${serverUrl}/key`)
    return null!
}

export class ClozeSpacedRepGen
    extends AbstractAsyncSpacedRepGen<SRClozeContent, SRClozeAuxData, SRClozeSettings> {

    getGenName(): string { return "cloze-spaced-repetition"; }

    repairDeckState(st: any): any {
        return st;
    }

    cardIsEnabled(
        card: SpacedRepCard<SRClozeContent, SRClozeAuxData>,
        st: SpacedRepState<SRClozeContent, SRClozeAuxData, SRClozeSettings>
    ): boolean {
        return true;
    }

    correctEffect(
        st: SpacedRepState<SRClozeContent, SRClozeAuxData, SRClozeSettings>,
        card: SpacedRepCardPhysical<SRClozeContent, SRClozeAuxData>,
        attempt: string,
        resolve: () => void
    ): void {
        var cardData = card.data!;
        if (st.settings.readCorrectAnswers) {
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
            card.data!.auxdata.streak += 1;
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
        console.log("CHECKING ANSWER");
        if (card.data === undefined || card.data!.auxdata.cloze === undefined) {
            return trivialPromise(false);
        }
        var tf = (s: string) => applyTextFilter(s, st.settings.filterSettings);
        return trivialPromise(tf(card.data!.auxdata.cloze!.answer) === tf(answer));
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
        return fetch(
            `${st.settings.clozeServerUrl}/cloze?` + new URLSearchParams({
                "srcs": st.settings.sourceLangs.join(","),
                "tgt": st.settings.targetLang,
                "lemma": card.data.content.key
            }).toString()
            ).then(
                (r) => r.json()
            ).then(
                (j) => {
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
                "Something is wrong with your Cloze puzzle server."
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

    return null!;
}

registerDeckType(
    new ClozeSpacedRepGen(),
    clozeSRMenu,
    "cloze-spaced-repetition-deck",
    "Cloze spaced repetition deck",
    defaultSRClozeState,
    "#ffffdd"
); 
