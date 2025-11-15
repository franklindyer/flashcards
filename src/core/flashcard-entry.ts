import {
    IDictionary,
    guidGenerator,
    trivialPromise,
    hideDetails,
    makeSubber
} from "utils/utils"
import {
    StateEditor,
    boolEditor,
    swappingTextEditor,
    singleTextFieldEditor,
    multipleEditors,
    doubleTextFieldEditor,
    textAreaEditor,
    htmlEditor,
    scrollNumberEditor
} from "core/editor"
import {
    TextFilterSettings,
    applyTextFilter,
    textFilterSelectionMenu,
    defaultTextFilterSettings
} from "utils/text-filters"
import {
    renderCard 
} from "core/flashcard-template"
import {
    randomizeStringSub
} from "utils/random-templating"
import {
    Preloader
} from "utils/generic-preloader"
import {
    defaultSpeechSettings,
    speechSettingsEditor,
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
    njClozeCard
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
    abstract makeEntryEditor(entry: E): StateEditor<E>;
    abstract makeSettingsEditor(settings: S): StateEditor<S>;

    abstract getDefaultEntry(): E;
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
        hint = data.answer[0];

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

    // abstract makeEntryEditor(entry: E): StateEditor<E>;
    makeEntryEditor(entry: SimpleCardEntry): StateEditor<SimpleCardEntry> {
        var edDetails = document.createElement("details");
        var edSummary = document.createElement("summary"); 
        edDetails.style.display = "inline-block";
        edDetails.appendChild(edSummary);
        edDetails.classList.add("cardlist-accordion");
        edDetails.onkeyup = function(e) {
            if (e.keyCode == 32) {
                e.preventDefault();
            }
        };

        var edMain = swappingTextEditor([entry.prompt.join('|'), entry.answer.join('|')]);
        edMain.element.style.display = "inline-block";
        edSummary.appendChild(edMain.element);

        var twoSideEd = boolEditor("Double-sided card?", entry.twoSided);
        edDetails.appendChild(twoSideEd.element);

        var readAloudEd = boolEditor("Reversed card can be read aloud?", entry.readAloud);
        edDetails.appendChild(readAloudEd.element);

        return {
            element: edDetails,
            menuToState: () => {
                let tp = edMain.menuToState();
                return {
                    prompt: tp[0].split('|'),
                    answer: tp[1].split('|'),
                    twoSided: twoSideEd.menuToState(),
                    readAloud: readAloudEd.menuToState()
                };
            }
        }; 
    }

    // abstract makeSettingsEditor(settings: S): StateEditor<S>;
    makeSettingsEditor(settings: SimpleCardSettings): StateEditor<SimpleCardSettings> {
        var contDiv = document.createElement("div");

        var reverseDetails = document.createElement("details");
        var reverseSummary = document.createElement("summary");
        reverseSummary.textContent = "Two-sided card settings";
        contDiv.appendChild(reverseDetails);
        reverseDetails.appendChild(reverseSummary);
        var twoSidedEditor = boolEditor("Study both sides of two-sided cards?", settings.doTwoSided);
        var twoSidedCont = document.createElement("div");
        twoSidedCont.appendChild(twoSidedEditor.element);
        reverseDetails.appendChild(twoSidedCont);

        var readAloudEditor = boolEditor("Read aloud two-sided cards with setting enabled?", settings.doReadAloud);
        var readAloudCont = document.createElement("div");
        readAloudCont.appendChild(readAloudEditor.element);
        reverseDetails.appendChild(readAloudCont);

        var pReversedEditor = scrollNumberEditor("Probability of card being reversed", settings.probReversed, 0.1, 0.9, 0.1);
        var pSpokenEditor = scrollNumberEditor("Probability of a reversed card using audio", settings.probSpoken, 0.1, 1.0, 0.1); 
        reverseDetails.appendChild(pReversedEditor.element);
        reverseDetails.appendChild(pSpokenEditor.element);

        var ssEditor = speechSettingsEditor(settings.speechSettings);
        var ssCont = document.createElement("div")
        ssCont.appendChild(ssEditor.element);
        contDiv.appendChild(ssCont);

        var subsEditor = multipleEditors(
            settings.substitutions,
            () => <[string, string]>["", ""],
            doubleTextFieldEditor
        );
        subsEditor.element = hideDetails(subsEditor.element, "Card substitution settings");
        contDiv.appendChild(subsEditor.element);

        var tplDetails = document.createElement("details");
        var tplSummary = document.createElement("summary");
        tplSummary.textContent = "Card template";
        var tplEditor = htmlEditor(settings.template);
        tplDetails.appendChild(tplSummary);
        tplDetails.appendChild(tplEditor.element);
        contDiv.appendChild(tplDetails);

        return {
            element: contDiv,
            menuToState: () => {
                return {
                    doTwoSided: twoSidedEditor.menuToState(),
                    doReadAloud: readAloudEditor.menuToState(),
                    probReversed: pReversedEditor.menuToState(),
                    probSpoken: pSpokenEditor.menuToState(), 
                    speechSettings: ssEditor.menuToState(),
                    substitutions: subsEditor.menuToState(),
                    template: tplEditor.menuToState() 
                };
            }
        }
    }

    // abstract getDefaultEntry(): E;
    getDefaultEntry(): SimpleCardEntry {
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
        answer: string,
        translation: string,
        group: string
    }
}

export type ClozeCardSettings = {
    clozeServerUrl: string,
    sourceLangs: string[],
    targetLang: string,
    clozeGroups: string[],
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
                "n": this.cache.numPreload.toString()
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
                return {
                    key: entry.key,
                    valid: true,
                    cloze: {
                        prompt: j["puzzle"],
                        answer: j["target"],
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
            return data.cloze!.answer;
        else
            return "";
    }

    // abstract generateCard(data: D, settings: S, externalParams: IDictionary<any>): Flashcard;
    generateCard(data: ClozeCardData, settings: ClozeCardSettings, externalParams: IDictionary<any> = {}): Flashcard {
        var fontSize = 5;
        if (data.valid) {
            var fontSize = 900.0/(10.0*Math.log(10+data.cloze!.prompt.length)); 
        }

        var prompt = data.cloze!.prompt.replaceAll(/\{\{([^\{\}]+)\}\}/g, "___"); 

        var templateArgs = {
            key: data.key,
            puzzleFound: data.valid,
            prompt: prompt, 
            translation: data.cloze!.translation,
            source: data.cloze!.group,
            fontSize: fontSize,
        };
        templateArgs = Object.assign({}, templateArgs, externalParams);
        var tpl = settings.template;
        var el = <HTMLElement>(new DOMParser().parseFromString(renderString(tpl, templateArgs), "text/html").body.firstChild);

        return new Flashcard(el, data.cloze!.answer);
    }

    // abstract checkAnswer(answer: string, data: D, settings: S, tf: (s: string) => string): Promise<boolean>;
    checkAnswer(answer: string, data: ClozeCardData, settings: ClozeCardSettings, tf: (s: string) => string) {
        return trivialPromise(data.valid && tf(answer) == tf(data.cloze!.answer));
    }

    // abstract makeEntryEditor(entry: E): StateEditor<E>;
    makeEntryEditor(entry: ClozeCardEntry): StateEditor<ClozeCardEntry> {
        var edDetails = document.createElement("details");
        var edSummary = document.createElement("summary");
        edDetails.appendChild(edSummary);
        edDetails.classList.add("cardlist-accordion");
        var keyEd = singleTextFieldEditor(entry.key);
        keyEd.element.style.display = "inline-block";
        edSummary.appendChild(keyEd.element);
        return {
            element: edDetails,
            menuToState: () => {
                return {
                    key: keyEd.menuToState()
                };
            }
        };
    }

    // abstract makeSettingsEditor(settings: S): StateEditor<S>;
    makeSettingsEditor(settings: ClozeCardSettings): StateEditor<ClozeCardSettings> {
        var clozeSettingsDiv = document.createElement("div");

        var clozeServerDiv = document.createElement("div");
        clozeServerDiv.classList.add("deck-menu-submenu"); 
        var clozeServerUrlEditor = singleTextFieldEditor(settings.clozeServerUrl)
        var clozeSourceLangEditor = singleTextFieldEditor(settings.sourceLangs.join(','));
        var clozeTargetLangEditor = singleTextFieldEditor(settings.targetLang);
        var clozeGroupsEditor = singleTextFieldEditor(settings.clozeGroups.join(','));
        (<HTMLInputElement>clozeGroupsEditor.element).placeholder = "allowed groups...";

        var ssEditor = speechSettingsEditor(settings.speechSettings);

        clozeServerDiv.appendChild(clozeServerUrlEditor.element);
        clozeServerDiv.appendChild(clozeSourceLangEditor.element);
        clozeServerDiv.appendChild(clozeTargetLangEditor.element);
        clozeServerDiv.appendChild(clozeGroupsEditor.element);

        clozeSettingsDiv.appendChild(clozeServerDiv);
        clozeSettingsDiv.appendChild(ssEditor.element);

        var tplDetails = document.createElement("details");
        var tplSummary = document.createElement("summary");
        tplSummary.textContent = "Card template";
        var tplEditor = htmlEditor(settings.template);
        tplDetails.appendChild(tplSummary);
        tplDetails.appendChild(tplEditor.element);
        clozeSettingsDiv.appendChild(tplDetails);

        return {
            element: clozeSettingsDiv,
            menuToState: () => {
                return {
                    clozeServerUrl: clozeServerUrlEditor.menuToState(),
                    sourceLangs: clozeSourceLangEditor.menuToState().split(','),
                    targetLang: clozeTargetLangEditor.menuToState(),
                    clozeGroups: clozeGroupsEditor.menuToState().split(',').filter((g) => g.length > 0),
                    speechSettings: ssEditor.menuToState(),
                    template: tplEditor.menuToState()
                }
            }
        }
    }

    // abstract getDefaultEntry(): E;
    getDefaultEntry(): ClozeCardEntry {
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
            speechSettings: defaultSpeechSettings(),
            template: njClozeCard
        }
    }
}

registerFlashcardType(new ClozeCardType())
