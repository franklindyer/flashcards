import {
    MenuComponent
} from "menus/menus"
import {
    DeepJSONComponent
} from "menus/deep-json-menu"
import {
    SRUniversalCardVirtual,
    makeEmptyCard 
} from "decks/spaced-repetition-universal-types"
import {
    recursiveRepairJSON
} from "utils/utils"

export class SRCardMenu extends DeepJSONComponent {
    constructor() {
        super();
        this.lastSetState = makeEmptyCard(this.getAttribute("cardtype")!);

        this.preprocMap = {
            "cardEntry.prompt": (ls: string[]) => ls.join("|"),
            "cardEntry.answer": (ls: string[]) => ls.join("|"),
            "tags": (ls: string[]) => ls.join(",")
        }

        this.postprocMap = {
            "cardEntry.prompt": (ls: string) => ls.split("|"),
            "cardEntry.answer": (ls: string) => ls.split("|"),
            "tags": (ls: string) => ls.length == 0 ? [] : ls.split(",")
        }
    }
}

window.customElements.define("menu-sr-card", SRCardMenu, { extends: "div" });
