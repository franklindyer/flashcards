import {
    IDictionary
} from "utils/utils"
import {
    Flashcard
} from "core/flashcard"

export abstract class FlashcardTemplate<D> {
    abstract getName(): string;
    abstract render(data: D): Flashcard;
}

export const gTemplateRegistry: IDictionary<FlashcardTemplate<any>> = {};

export function registerTemplate<D>(tpl: FlashcardTemplate<D>) {
    gTemplateRegistry[tpl.getName()] = tpl;
}

export function renderCard<D>(tplName: string, cardData: D): Flashcard {
    if (tplName in gTemplateRegistry) {
        return gTemplateRegistry[tplName].render(<any>cardData);
    }
    throw new Error(`Unrecognized card template ${tplName}`) 
}
