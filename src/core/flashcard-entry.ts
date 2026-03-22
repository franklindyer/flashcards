import {
    IDictionary,
    trivialPromise,
    hideDetails,
    makeSubber
} from "utils/utils"
import {
    randomizeStringSub
} from "utils/random-templating"
import {
    Preloader
} from "utils/generic-preloader"
import {
    defaultSpeechSettings,
    SpeechSettings,
    utter,
    makeAudioButtons
} from "utils/speech"
import {
    Flashcard
} from "core/flashcard"
import {
    renderString
} from "nunjucks"
import {
    njSimpleCard,
    njClozeCard,
    njMultiSidedCard
} from "utils/nj-templates"

export const gCardTypeRegistry: IDictionary<FlashcardType<any, any, any>> = {};

export abstract class FlashcardType<E, D, S> {
    getTypeName(): string {
        throw new Error("getTypeName not implemented!");
    }
    getUserFriendlyName(): string {
        throw new Error("getUserFriendlyName not implemented!");
    }

    abstract preprocessEntry(entry: E, settings: S): void;
    abstract processEntry(entry: E, settings: S, context: any): Promise<D>;
    abstract getSearchableText(entry: E): string;
    abstract getSpeakableText(data: D): string;
    abstract generateCard(data: D, settings: S, externalParams: IDictionary<any>): Flashcard;
    abstract checkAnswer(answer: string, data: D, settings: S, tf: (s: string) => string): Promise<boolean>;

    abstract getDefaultEntry(settings?: S): E;
    abstract getDefaultSettings(): S;

    getMaybeSetting(key: string, settings: S): any {
        if (key in <Object>settings) {
            return (<any>settings)[key];
        } else {
            return null;
        }
    }

    speakCard(data: D, settings: S, resolve: () => void): void {
        var ss = this.getMaybeSetting("speechSettings", settings);
        if (ss == null) {
            console.log("SPEECH SETTINGS NOT FOUND");
            resolve();
        } else {
            utter(this.getSpeakableText(data), ss.voice, ss.rate, ss.pitch, resolve);
        }
    }
}

export function registerFlashcardType(ft: FlashcardType<any, any, any>) {
    gCardTypeRegistry[ft.getTypeName()] = ft;
}

/* Some specific types of cards are implemented below */

/* SIMPLE REVERSIBLE CARD TYPE */

export type SimpleCardEntry = {
    prompt: string[],
    answer: string[],
    twoSided: boolean,
    readAloud: boolean
}

export type SimpleCardData = {
    prompt: string[],
    answer: string[],
    reversed: boolean,
    spoken: boolean
}

export type SimpleCardSettings = {
    doTwoSided: boolean,
    doReadAloud: boolean,
    probReversed: number,
    probSpoken: number,
    speechSettings: SpeechSettings,
    substitutions: [string, string][],
    template: string
}

export class SimpleCardType extends FlashcardType<SimpleCardEntry, SimpleCardData, SimpleCardSettings> {
    getTypeName() {
        return "simple-card";
    }
    getUserFriendlyName() {
        return "Simple two-sided flashcards";
    }

    // abstract preprocessEntry(entry: E, settings: S): void;
    preprocessEntry(entry: SimpleCardEntry, settings: SimpleCardSettings) {
        return;
    }

    // abstract processEntry(entry: E, settings: S, context: any): Promise<D>;
    processEntry(entry: SimpleCardEntry, settings: SimpleCardSettings, context: any): Promise<SimpleCardData> {
        var preventReversedCard = context.preventReversedCard;
        var canBeReversed = !preventReversedCard && entry.twoSided && settings.doTwoSided;
        var reversed = canBeReversed && (Math.random() < settings.probReversed);
        var canBeSpoken = settings.doReadAloud && entry.readAloud;
        var spoken = reversed && canBeSpoken && (Math.random() < settings.probSpoken);

        var subber = makeSubber(settings.substitutions);
        var tpPrompt = [];
        var tpAnswers = [];
        var ctx = {};
        for (var i in Object.keys(entry.prompt)) {
            var res = randomizeStringSub(subber(entry.prompt[i]), ctx);
            ctx = res[1];
            tpPrompt.push(res[0]);
        }
        for (var i in Object.keys(entry.answer)) {
            var res = randomizeStringSub(subber(entry.answer[i]), ctx);
            ctx = res[1];
            tpAnswers.push(res[0]);
        }

        return trivialPromise({
            prompt: reversed ? tpAnswers : tpPrompt,
            answer: reversed ? tpPrompt : tpAnswers,
            reversed: reversed,
            spoken: spoken 
        });
    }

    // abstract getSearchableText(entry: E): string;
    getSearchableText(entry: SimpleCardEntry): string {
        return entry.prompt.join(" ").concat(entry.answer.join(" "));
    }

    // abstract getSpeakableText(data: D): string;
    getSpeakableText(data: SimpleCardData): string {
        if (data.reversed)
            return data.prompt[0]
        else
            return data.answer[0];
    }

    // abstract generateCard(data: D, settings: S, externalParams: IDictionary<any>): Flashcard;
    generateCard(data: SimpleCardData, settings: SimpleCardSettings, externalParams: IDictionary<any> = {}): Flashcard {
        var a = document.createElement("div");
        var prompt = "";
        var answers: string[] = [];
        var hint = "";
        
        prompt = data.prompt[0];
        answers = data.answer;
        hint = data.answer.join(' | ');

        var fontSize = 100.0/(10.0*Math.log(10+prompt.length));
        
        var templateArgs = {
            prompts: data.prompt,
            fontSize: fontSize,
            reversed: data.reversed,
            spoken: data.spoken
        };
        templateArgs = Object.assign({}, templateArgs, externalParams);
        var tpl = settings.template;
        var el = <HTMLElement>(new DOMParser().parseFromString(renderString(tpl, templateArgs), "text/html").body.firstChild);
        el = makeAudioButtons(el, settings.speechSettings);

        return new Flashcard(el, hint);
    }

    // abstract checkAnswer(answer: string, data: D, settings: S): Promise<boolean>;
    checkAnswer(answer: string, data: SimpleCardData, settings: SimpleCardSettings, tf: (s: string) => string): Promise<boolean> {
        return trivialPromise(data.answer.map(tf).includes(tf(answer)));
    }

    // abstract getDefaultEntry(settings?: S): E;
    getDefaultEntry(settings?: SimpleCardSettings): SimpleCardEntry {
        return {
            prompt: [],
            answer: [],
            twoSided: false,
            readAloud: false
        };
    }

    // abstract getDefaultSettings(): S;
    getDefaultSettings(): SimpleCardSettings {
        return {
            doTwoSided: true,
            doReadAloud: true,
            probReversed: 0.5,
            probSpoken: 0.5,
            speechSettings: defaultSpeechSettings(),
            substitutions: [],
            template: njSimpleCard
        };
    }
}

registerFlashcardType(new SimpleCardType())

/* CLOZE CARD TYPE */

export type ClozeCardEntry = {
    key: string
}

export type ClozeCardData = {
    key: string,
    valid: boolean, 
    cloze?: {
        prompt: string,
        answers: string[],
        translation: string,
        group: string
    }
}

export type ClozeCardSettings = {
    clozeServerUrl: string,
    sourceLangs: string[],
    targetLang: string,
    clozeGroups: string[],
    maxLength: number,
    speechSettings: SpeechSettings,
    template: string
}

export class ClozeCardType extends FlashcardType<ClozeCardEntry, ClozeCardData, ClozeCardSettings> {
    getTypeName(): string {
        return "cloze-card"; 
    }
    getUserFriendlyName(): string {
        return "Cloze puzzle cards" 
    }

    cache: Preloader<any> = new Preloader(10);

    fetchCloze(key: string, settings: ClozeCardSettings) {
         return fetch(
            `${settings.clozeServerUrl}/cloze?` + new URLSearchParams({
                "srcs": settings.sourceLangs.join(","),
                "groups": settings.clozeGroups.join(","),
                "tgt": settings.targetLang,
                "lemma": key,
                "n": this.cache.numPreload.toString(),
                "maxlen": settings.maxLength.toString()
            }).toString()
        ).then((r) => r.json()).catch((e) => undefined);
   
    }

    // abstract preprocessEntry(entry: E, settings: S): void;
    preprocessEntry(entry: ClozeCardEntry, settings: ClozeCardSettings): void {
        this.cache.addKey(entry.key, (k) => this.fetchCloze(entry.key, settings));
    }

    // abstract processEntry(entry: E, settings: S, context: any): Promise<D>;
    processEntry(entry: ClozeCardEntry, settings: ClozeCardSettings, context: any): Promise<ClozeCardData> {
        return this.cache.getKey(
            entry.key,
            (k) => this.fetchCloze(entry.key, settings)    
        ).then(
            (j) => {
                if (j === undefined) {
                    return { valid: false, key: entry.key };
                }
                var shortAnswer = "";
                j["puzzle"].match(/\{\{([^\{\}]+)\}\}/g)!.forEach((m: string) => {
                    if (shortAnswer !== "") shortAnswer = shortAnswer.concat(", ");
                    shortAnswer = shortAnswer.concat(m.slice(2, -2));
                });
                return {
                    key: entry.key,
                    valid: true,
                    cloze: {
                        prompt: j["puzzle"],
                        answers: [j["target"], shortAnswer],
                        translation: j["source"],
                        group: j["group"]
                    }
                };
            }
        ).catch((e) => {
            return { valid: false, key: entry.key };
        });
    }

    // abstract getSearchableText(entry: E): string;
    getSearchableText(entry: ClozeCardEntry): string {
        return entry.key;
    }

    // abstract getSpeakableText(data: D): string;
    getSpeakableText(data: ClozeCardData): string {
        if (data.valid)
            return data.cloze!.answers[0];
        else
            return "";
    }

    // abstract generateCard(data: D, settings: S, externalParams: IDictionary<any>): Flashcard;
    generateCard(data: ClozeCardData, settings: ClozeCardSettings, externalParams: IDictionary<any> = {}): Flashcard {
        if (!data.valid) {
            
        }

        var fontSize = 20;
        var prompt = "";
        if (data.valid) {
            var fontSize = 900.0/(10.0*Math.log(10+data.cloze!.prompt.length)); 
            prompt = data.cloze!.prompt.replaceAll(/\{\{([^\{\}]+)\}\}/g, "___"); 
        }


        var templateArgs = {
            key: data.key,
            puzzleFound: data.valid,
            prompt: prompt, 
            translation: data.valid ? data.cloze!.translation : undefined,
            source: data.valid ? data.cloze!.group : undefined,
            fontSize: fontSize,
        };
        templateArgs = Object.assign({}, templateArgs, externalParams);
        var tpl = settings.template;
        var el = <HTMLElement>(new DOMParser().parseFromString(renderString(tpl, templateArgs), "text/html").body.firstChild);

        return new Flashcard(el, data.valid ? data.cloze!.answers[0] : "no answer, press up or down arrow to skip");
    }

    // abstract checkAnswer(answer: string, data: D, settings: S, tf: (s: string) => string): Promise<boolean>;
    checkAnswer(answer: string, data: ClozeCardData, settings: ClozeCardSettings, tf: (s: string) => string) {
        return trivialPromise(data.valid && data.cloze!.answers.map(tf).includes(tf(answer)));
    }

    // abstract getDefaultEntry(settings?: S): E;
    getDefaultEntry(settings?: ClozeCardSettings): ClozeCardEntry {
        return {
            key: ""
        };
    }

    // abstract getDefaultSettings(): S;
    getDefaultSettings(): ClozeCardSettings {
        return {
            clozeServerUrl: "",
            sourceLangs: [],
            targetLang: "",
            clozeGroups: [],
            maxLength: 150,
            speechSettings: defaultSpeechSettings(),
            template: njClozeCard
        }
    }
}

registerFlashcardType(new ClozeCardType())

/* MULTI-SIDED CARD TYPE */

export type MultiSidedCardEntry = {
    sides: string[]
}

export type MultiSidedCardData = {
    prompts: string[],
    answers: string[][],
    promptNames: string[],
    answersNames: string[],
    spokenText: string,
    allAnswersRequired: boolean
}

export enum MultiSidedCardQStyle {
    AllowAnySide = 1,           // Given 1 side, provide any other side
    AskRandomSide,              // Given 1 side, provide a randomly chosen other side
    AskAllSides,                // Given 1 side, provide all other sides
    AskOneSideGivenAllOthers    // Given all sides but one, provide the missing side
}

export type MultiSidedCardSettings = {
    sideNames: string[],
    speakableSide: number,
    quizzingStyle: MultiSidedCardQStyle, 
    speechSettings: SpeechSettings,
    template: string
}

export class MultiSidedCardType extends FlashcardType<MultiSidedCardEntry, MultiSidedCardData, MultiSidedCardSettings> {
    getTypeName(): string {
        return "multi-sided-card";
    }
    getUserFriendlyName(): string {
        return "Multi-sided flashcards";
    }

    // abstract preprocessEntry(entry: E, settings: S): void;
    preprocessEntry(entry: MultiSidedCardEntry, settings: MultiSidedCardSettings) {}

    // abstract processEntry(entry: E, settings: S, context: any): Promise<D>;
    processEntry(entry: MultiSidedCardEntry, settings: MultiSidedCardSettings, context: any): Promise<MultiSidedCardData> {
        var n: number = entry.sides.length;
        var chosenSides = [];
        var availableSides = [...new Array(n).keys()];
        var k = 1;
        if (settings.quizzingStyle == MultiSidedCardQStyle.AskOneSideGivenAllOthers) {
            k = n-1;
        }
       
        for (var i = 0; i < k; i++) {
            var ind = Math.floor(Math.random() * availableSides.length);
            ind = availableSides[ind];
            chosenSides.push(ind);
            availableSides = [...availableSides.filter((j) => j != ind)];
        }

        if (settings.quizzingStyle === MultiSidedCardQStyle.AskRandomSide) {
            var ind = Math.floor(Math.random() * availableSides.length);
            ind = availableSides[ind];
            availableSides = [ind];
        }

        var prompts = [...chosenSides.map((ind) => entry.sides[ind].split("|")[0])];
        var promptNames = [...chosenSides.map((ind) => settings.sideNames[ind])];

        var answers = [...availableSides.map((ind) => entry.sides[ind].split("|"))];
        var answerNames = [...availableSides.map((ind) => settings.sideNames[ind])];

        var res: MultiSidedCardData = {
            prompts: prompts,
            promptNames: promptNames,
            answers: answers,
            answersNames: answerNames,
            spokenText: entry.sides[settings.speakableSide],
            allAnswersRequired: settings.quizzingStyle !== MultiSidedCardQStyle.AllowAnySide
        };
        return trivialPromise(res);
    } 
 
    // abstract getSearchableText(entry: E): string;
    getSearchableText(entry: MultiSidedCardEntry): string {
        return entry.sides.join(" ");
    }    

    // abstract getSpeakableText(data: D): string;
    getSpeakableText(data: MultiSidedCardData): string {
        return data.spokenText;
    } 

    // abstract generateCard(data: D, settings: S, externalParams: IDictionary<any>): Flashcard;
    generateCard(data: MultiSidedCardData, settings: MultiSidedCardSettings, externalParams: IDictionary<any>) {
        var templateArgs = {
            fontSize: 25
        };
        templateArgs = Object.assign({}, templateArgs, data, externalParams);
        var tpl = settings.template;
        var el = <HTMLElement>(new DOMParser().parseFromString(renderString(tpl, templateArgs), "text/html").body.firstChild);
        return new Flashcard(el, data.answers.map((a) => a[0]).join(", "));
    }

    // abstract checkAnswer(answer: string, data: D, settings: S, tf: (s: string) => string): Promise<boolean>;
    checkAnswer(answer: string, data: MultiSidedCardData, settings: MultiSidedCardSettings, tf: (s: string) => string): Promise<boolean> {
        var answerParts = answer.split(",");
        if (answerParts.length < data.answers.length) {
            return trivialPromise(false);
        }
        for (var i = 0; i < data.answers.length; i++) {
            if (!data.answers[i].map(tf).includes(tf(answerParts[i]))) {
                return trivialPromise(false);
            }
        }
        return trivialPromise(true);
    }

    // abstract getDefaultEntry(settings?: S): E;
    getDefaultEntry(settings?: MultiSidedCardSettings): MultiSidedCardEntry {
        return {
            "sides": ["", ""]
        };
    }

    // abstract getDefaultSettings(): S;
    getDefaultSettings(): MultiSidedCardSettings {
        return {
            sideNames: ["first side", "second side"],
            speakableSide: 0,
            quizzingStyle: MultiSidedCardQStyle.AskAllSides,
            speechSettings: defaultSpeechSettings(),
            template: njMultiSidedCard
        }

    }

}

registerFlashcardType(new MultiSidedCardType())
