"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class WordRegisters {
    constructor() {
        this.words = {};
        for (var wt in WordRegisters.wordTypes) {
            this.words[wt] = [];
        }
    }
    static addWordType(wt) {
        WordRegisters.wordTypes.push(wt);
    }
    addW(wd, infl) {
        var wdType = typeof wd;
        if (!(wdType in WordRegisters.wordTypes))
            throw new TypeError(`${wdType} is not a registered word type`);
        this.words[wdType].push([wd, infl]);
    }
    get(t, id) {
        if (!(t in WordRegisters.wordTypes))
            throw new TypeError(`${t} is not a registered word type`);
        return this.words[t][id];
    }
}
WordRegisters.wordTypes = [];
WordRegisters.inflectors = {};
WordRegisters.agreers = {};
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
var DemoGender;
(function (DemoGender) {
    DemoGender[DemoGender["GenderM"] = 0] = "GenderM";
    DemoGender[DemoGender["GenderF"] = 1] = "GenderF";
})(DemoGender || (DemoGender = {}));
var DemoNumber;
(function (DemoNumber) {
    DemoNumber[DemoNumber["NumberS"] = 0] = "NumberS";
    DemoNumber[DemoNumber["NumberP"] = 1] = "NumberP";
})(DemoNumber || (DemoNumber = {}));
function demoAdjInflector(adj, infl) {
    var gchar = (infl.gender === DemoGender.GenderM) ? 'o' : 'a';
    gchar = (infl.number === DemoNumber.NumberS) ? gchar : `${gchar}${gchar}`;
    return [adj.enForm, `${gchar}${adj.xxForm}`];
}
