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
    SpacedRepCardPhysical
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

type SRContentType = {
    prompt: string,
    answer: string,
}

type SRTimingType = {
    streak: number,
    intervalMinutes: number,
    due: Date | undefined
}

type SRSettingsType = {
    initialHours: number,
    correctFactor: number,
    incorrectFactor: number,
}

export class ExampleSpacedRepGen
    extends AbstractSpacedRepGen<SRContentType, SRTimingType, SRSettingsType> {

    getGenName(): string { return "simple-spaced-repetition"; }

    makeEmptyCard() { return null!; }
    cardHint(card: SpacedRepCard<SRContentType, SRTimingType>): boolean { return null!; }
    cardIsDue(card: SpacedRepCard<SRContentType, SRTimingType>): boolean { return null!; }
    cardIsNew(card: SpacedRepCard<SRContentType, SRTimingType>): boolean { return null!; }
    updateCard(
        settings: SRSettingsType,
        cardData: SpacedRepCardPhysical<SRContentType, SRTimingType>,
        correct: FlashcardResult
    ): SpacedRepCard<SRContentType, SRTimingType> {
        return null!;
    }

    repairDeckState(st: any): any { return null!; }

    generateCard(data: SpacedRepCardPhysical<SRContentType, SRTimingType>): 
        Flashcard { 
        return null!; 
    }

    checkAnswer(
        answer: string, 
        st: SpacedRepState<SRContentType, SRTimingType, SRSettingsType>,
        data: SpacedRepCardPhysical<SRContentType, SRTimingType>
    ): boolean {
        return null!;
    }

    correctEffect(
        st: SpacedRepState<SRContentType, SRTimingType, SRSettingsType>,
        data: SpacedRepCardPhysical<SRContentType, SRTimingType>,
        attempt: string,
        resolve: () => void
    ): void {
        return null!;
    }

}
