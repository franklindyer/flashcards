import {
    MenuComponent
} from "menus/menus"
import {
    IDictionary,
    setDeepKey,
    getDeepKey,
    recursiveRepairJSON,
    querySelectorTopLevel
} from "utils/utils"

export class DeepJSONComponent extends HTMLDivElement
                                 implements MenuComponent<any> {
    lastSetState: any = {};
    preprocMap: IDictionary<(x: any) => any> = {}       // Applied to values before setState
    postprocMap: IDictionary<(x: any) => any> = {}      // Applied to values after getState

    constructor() {
        super();
    }

    fieldName() {
        return this.getAttribute("name")!;
    }

    getTopLevelComponents() {
        var menuTopEls = querySelectorTopLevel(this, "[is^='menu-']");
        menuTopEls = [...menuTopEls.filter((el) => el.getAttribute("name"))];
        return menuTopEls;
    }

    getState() {
        var st = {};
        var menuComps = this.getTopLevelComponents();
        menuComps.forEach((m) => {
            var mKey = m.getAttribute("name")!;
            var mState = (<any>m).getState();
            if (mKey in this.postprocMap) {
                mState = this.postprocMap[mKey](mState);
            }
            st = setDeepKey(st, mKey.split("."), mState);
        });
        st = recursiveRepairJSON(st, this.lastSetState, [], false);
        return st;
    }

    setState(st: any) {
        this.lastSetState = st;
        var menuComps = this.getTopLevelComponents();
        menuComps.forEach((m) => {
            var mKey = m.getAttribute("name")!;
            var mState = getDeepKey(st, m.getAttribute("name")!.split("."));
            if (mKey in this.preprocMap) {
                mState = this.preprocMap[mKey](mState);
            }
            (<any>m).setState(mState);
        });        
    }
}

window.customElements.define("menu-deep-json", DeepJSONComponent, { extends: "div" });
