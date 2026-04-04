import {
    MenuComponent
} from "menus/menus";

import * as ace from 'brace';

class TextfieldComponent extends HTMLElement
                         implements MenuComponent<string> {
    root = this;    
    ed: any;
    
    constructor() {
        super();
    }

    getEditor() {
        if (!this.ed) {
            this.ed = ace.edit(this);
            this.classList.add("menu-ace-textfield");
        }
        return this.ed;
    }

    getState() {
        return this.getEditor().getValue();
    }

    setState(s: string) {
        this.getEditor().setValue(s);
    }
}

window.customElements.define("menu-textfield", TextfieldComponent);
