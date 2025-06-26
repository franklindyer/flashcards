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

export class ClozeSpacedRepGen
    extends AbstractAsyncSpacedRepGen<SRClozeContent, SRClozeAuxData, SRClozeSettings> {

    getGenName(): string { return "cloze-spaced-repetition"; }

    repairDeckState(st: any): any {
        return st;
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
        return null!;
    }

    updateAuxData(
        card: SpacedRepCardPhysical<SRClozeContent, SRClozeAuxData>,
        settings: SRClozeSettings,
        correct: FlashcardResult
    ): SRClozeAuxData {
        return null!;
    }

    checkAnswerAsync(
        answer: string,
        state: SpacedRepState<SRClozeContent, SRClozeAuxData, SRClozeSettings>,
        data: SpacedRepCardPhysical<SRClozeContent, SRClozeAuxData>
    ): Promise<boolean> {
        return null!;
    }

    generateCardAsync(
        data: SpacedRepCardPhysical<SRClozeContent, SRClozeAuxData>
    ): Promise<Flashcard> {
        return null!;
    }
}
