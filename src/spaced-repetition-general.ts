import {
    IDictionary,
    guidGenerator,
    makeDict
} from "./utils"
import {
    FlashcardGen,
    FlashcardResult
} from "./flashcard-generator"

type SpacedRepCard<content, timing> = {
    guid: string,
    content: content,
    timing: timing
}

type SpacedRepCardPhysical<content, timing, style> = {
    data: SpacedRepCard<content, timing>,
    style: style
}

type SpacedRepState<content, timing, settings> = {
    cards: IDictionary<SpacedRepCard<content, timing>>,
    newIndex: number,
    newQueue: number,
    settings: settings
}

export abstract class AbstractSpacedRepGen<content, timing, settings, style>
    extends FlashcardGen<SpacedRepState<content, timing, settings>, SpacedRepCardPhysical<content, timing, style>> {

    abstract makeEmptyCard(): SpacedRepCard<content, timing>;
    abstract cardIsDue(card: SpacedRepCard<content, timing>): boolean;
    abstract updateCard(
        state: settings, 
        cardData: SpacedRepCardPhysical<content, timing, style>,
        correct: FlashcardResult
    ): SpacedRepCard<content, timing>;

}
