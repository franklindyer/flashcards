import {
    recursiveRepairJSON,
    querySelectorTopLevel
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
        var menuTopEls = querySelectorTopLevel(this, "[is^='menu-']");
        menuTopEls.forEach((el) => {
            stateObj[el.getAttribute("name")!] = (<any>el).getState();
        });
        if (this.lastSetState !== undefined) {
            stateObj = recursiveRepairJSON(stateObj, this.lastSetState);
        }
        return stateObj;
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
                this.classList.add("list-entry-component-removed");
            } else {
                removeBtn.textContent = "remove";
                this.classList.remove("list-entry-component-removed");
            }
        };
        removeBtn.style.display = "inline-block";
        this.appendChild(removeBtn);
    }
    
    fieldName() {
        return this.getAttribute("name")!;
    }

    getState() {
        var menuElement = this.querySelector("[is^='menu-']");
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

        this.defaultEntry = this.querySelector("[is^='menu-']")!;
        this.innerHTML = "";
        
        this.entriesDiv = document.createElement("div");
        this.entriesDiv.classList.add("menu-list-entries-div");
        
        var _this = this;
        var addEntryButton = document.createElement("button");
        addEntryButton.textContent = "Add another";
        addEntryButton.onclick = (e) => {
            var listEntry = new ListEntryComponent<a>();
            listEntry.setAttribute("is", "menu-list-entry");
            var listEntryMenu = _this.defaultEntry!.cloneNode(true);
            listEntry.appendChild(listEntryMenu);
            _this.entriesDiv.prepend(listEntry);
        };
        
        this.appendChild(addEntryButton);
        this.appendChild(this.entriesDiv);

    }
    
    fieldName() {
        return this.getAttribute("name")!;
    }

    getState() {
        var fullList: a[] = [];
        var menuTopEls = querySelectorTopLevel(this.entriesDiv, "[is^='menu-']");
        [...menuTopEls].forEach((el: Element) => {
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
