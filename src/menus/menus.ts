import {
    recursiveRepairJSON
} from "utils/utils"

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

class NumberComponent extends HTMLInputElement
                      implements MenuComponent<number> {
    constructor() {
        super();
    }

    connectedCallback() {
        this.type = "number";
    }
    
    fieldName() {
        return this.getAttribute("name")!;
    }

    getState() {
        return Number(this.value);
    }

    setState(x: number) {
        this.value = x.toString();
    }
}

class SelectComponent extends HTMLSelectElement
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
    lastSetState: any;

    constructor() {
        super();
    }

    fieldName() {
        return this.getAttribute("name")!;
    }

    getState() {
        var stateObj: any = {};
        var menuEls: Element[] = [...this.querySelectorAll("[is^='menu-']")];
        var menuTopEls = [...menuEls.filter((el) => !menuEls.some((el2) => el2 != el && el2.contains(el)))];
        menuTopEls.forEach((el) => {
            stateObj[el.getAttribute("name")!] = (<any>el).getState();
        });
        return recursiveRepairJSON(stateObj, this.lastSetState);
    }

    setState(s: any) {
        this.lastSetState = s;
        var menuEls = [...this.querySelectorAll("[is^='menu-']")];
        menuEls.forEach((el) => {
            var entryName = el.getAttribute("name")!;
            if (entryName in s) {
                (<any>el).setState(s[entryName]);
            }
        });
        return;
    }
}

class ListEntryComponent<a> extends HTMLDivElement
                            implements MenuComponent<a[]> {
    removeEntry: boolean = false;

    constructor() {
        super();
    }
    
    connectedCallback() {
        var removeBtn = document.createElement("button");
        removeBtn.textContent = "remove";
        var _this = this;
        removeBtn.onclick = (e) => {
            _this.removeEntry = !_this.removeEntry;
            if (_this.removeEntry) {
                removeBtn.textContent = "restore";
            } else {
                removeBtn.textContent = "remove";
            }
        };
    }
    
    fieldName() {
        return this.getAttribute("name")!;
    }

    getState() {
        var menuElement = this.querySelectorAll("[is^='menu-']");
        if (this.removeEntry) {
            return [];
        } else {
            return [(<any>menuElement).getState()];
        }
    }

    setState(ls: a[]) {
        var menuElement = this.querySelector("[is^='menu-']");
        (<any>menuElement).setState(ls[0]);
    }

}

class ListComponent<a> extends HTMLDivElement
                       implements MenuComponent<a[]>{
    defaultEntry?: HTMLElement;
    entriesDiv: HTMLDivElement = document.createElement("div");

    constructor() {
        super();
    }
    
    connectedCallback() {
        this.defaultEntry = this.querySelector("[is^='menu-']")!;
        this.innerHTML = "";
        
        this.entriesDiv = document.createElement("div");
        this.entriesDiv.classList.add("menu-list-entries-div");
        
        var _this = this;
        var addEntryButton = document.createElement("button");
        addEntryButton.textContent = "Add another";
        addEntryButton.onclick = (e) => {
            _this.entriesDiv.appendChild(_this.defaultEntry!.cloneNode(true));
        };
        
        this.appendChild(addEntryButton);
        this.appendChild(this.entriesDiv);
    }
    
    fieldName() {
        return this.getAttribute("name")!;
    }

    getState() {
        var fullList: a[] = [];
        [...this.entriesDiv.children].forEach((el: Element) => {
            fullList = fullList.concat((<any>el).getState());
        });
        return fullList;
    }

    setState(ls: a[]) {
        this.entriesDiv.innerHTML = "";
       
        var _this = this; 
        ls.forEach((st: a) => {
            var listEntry = new ListEntryComponent<a>();
            listEntry.setAttribute("is", "menu-list-entry");
            var listEntryMenu = _this.defaultEntry!.cloneNode(true);
            listEntry.appendChild(listEntryMenu);
            console.log(listEntry);
            console.log(st);
            listEntry.setState([st]);
            this.entriesDiv.appendChild(listEntry); 
        });
    }
   
}

window.customElements.define("menu-checkbox", CheckboxComponent, { extends: "input" });
window.customElements.define("menu-textbox", TextboxComponent, { extends: "input" });
window.customElements.define("menu-number", NumberComponent, { extends: "input" });
window.customElements.define("menu-select", SelectComponent, { extends: "select" });
window.customElements.define("menu-group", GroupingComponent, { extends: "div" });
window.customElements.define("menu-list-entry", ListEntryComponent, { extends: "div" });
window.customElements.define("menu-list", ListComponent, { extends: "div" });
