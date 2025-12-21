export interface MenuComponent<a> {
    fieldName(): string;
    getState(): a;
    setState(s: a): void;
}

class CheckboxComponent extends HTMLInputElement
                        implements MenuComponent<boolean> {
    constructor() {
        super();
    }

    connectedCallback() {
        this.type = "checkbox";
    }
    
    fieldName() {
        return this.getAttribute("name")!; 
    }

    getState() {
        return this.checked;
    }

    setState(b: boolean) {
        this.checked = b;
    }
}

class TextboxComponent extends HTMLInputElement
                       implements MenuComponent<string> {
    constructor() {
        super();
    }

    fieldName() {
        return this.getAttribute("name")!;
    }

    getState() {
        return this.value;
    }

    setState(s: string) {
        this.value = s;
    }
}

class GroupingComponent extends HTMLDivElement
                        implements MenuComponent<any> {
    constructor() {
        super();
    }

    fieldName() {
        return this.getAttribute("name")!;
    }

    getState() {
        var stateObj: any = {};
        [...this.querySelectorAll("[is^='menu-']")].forEach((el) => {
            stateObj[el.getAttribute("name")!] = (<any>el).getState();
        });
        return stateObj;
    }

    setState(s: any) {
        [...this.querySelectorAll("[is^='menu-']")].forEach((el) => {
            var entryName = el.getAttribute("name")!;
            if (entryName in s) {
                (<any>el).setState(s[entryName]);
            }
        });
        return;
    }
}

window.customElements.define("menu-checkbox", CheckboxComponent, { extends: "input" });
window.customElements.define("menu-textbox", TextboxComponent, { extends: "input" });
window.customElements.define("menu-group", GroupingComponent, { extends: "div" });
