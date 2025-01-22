import {
    IDictionary
} from './lib'

interface Inflector<a, b> {
    (wd: a, infl: b): [string, string];
}

interface Agreer<a1, b1, b2> {
    (strongWd: a1, strongInfl: b1, weakInfl: b2): b2;
}

class WordRegisters {
    static wordTypes: string[] = [];
    static inflectors: IDictionary<Inflector<any, any>> = {};
    static agreers: IDictionary<Agreer<any, any, any>> = {};

    words: IDictionary<any[]>;

    constructor() {
        this.words = {};
        for (var wt in WordRegisters.wordTypes) {
            this.words[wt] = [];
        }
    }

    static addWordType(wt: string) {
        WordRegisters.wordTypes.push(wt);
    }

    addW<a, b>(wd: a, infl: b): void {
        var wdType = typeof wd;
        if (!(wdType in WordRegisters.wordTypes)) 
            throw new TypeError(`${wdType} is not a registered word type`);
        this.words[wdType].push([wd, infl]);
    }

    get(t: string, id: number) {
        if (!(t in WordRegisters.wordTypes)) 
            throw new TypeError(`${t} is not a registered word type`);
        return this.words[t][id];
    }
}

// DEMO LANGUAGE

// NOUNS
// "baga" (f) = "apple"
// "wago" (m) = "banana"
// "pago" (m) = "pear"
// "swaga" (f) = "orange"
// "moogo" (m) = "man"
// "wooga" (f) = "woman"

// ADJECTIVES
// First letter of adjective must agree with gender of noun in applies to
// Add that letter TWICE for plural nouns
// "-zoop" = "spicy"
// "-booga" = "sweet"
// "-gug" = "good"
// "-peepo" = "fresh"

// ARTICLES
// "po" = definite singular masculine
// "pa" = definite singular feminine
// "pepo" = indefinite singular masculine
// "pepa" = indefinite singular feminine

// EXAMPLE PHRASES:
// "abooga baga" = "sweet apple"
// "pa abooga baga" = "the sweet apple"
// "pepa abooga baga" = "a sweet apple"
// "pepo ogug moogo" = "a good man"
// "pa agug wooga" = "the good woman"

enum DemoGender {
    GenderM,
    GenderF
}

enum DemoNumber {
    NumberS,
    NumberP
}

type DemoNoun = {
    enForm: string,
    xxForm: string,
    gender: DemoGender,
    number: DemoNumber,
    tags: IDictionary<string[]>
}

type DemoAdj = {
    enForm: string,
    xxForm: string,
    tags: IDictionary<string[]>
}

type DemoAdjInflector = {
    gender: DemoGender,
    number: DemoNumber
}

function demoAdjInflector(adj: DemoAdj, infl: DemoAdjInflector): [string, string] {
    var gchar = (infl.gender === DemoGender.GenderM) ? 'o' : 'a';
    gchar = (infl.number === DemoNumber.NumberS) ? gchar : `${gchar}${gchar}`;
    return [adj.enForm, `${gchar}${adj.xxForm}`];
}
