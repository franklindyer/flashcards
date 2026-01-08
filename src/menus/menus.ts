import {
    recursiveRepairJSON,
    querySelectorTopLevel,
    getDeepKey
} from "utils/utils"
import * as ace from 'brace';

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

class TextfieldComponent extends HTMLDivElement
                                 implements MenuComponent<string> {
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

    fieldName() {
        return this.getAttribute("name")!;
    }

    getState() {
        return this.getEditor().getValue();
    }

    setState(s: string) {
        this.getEditor().setValue(s);
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

    preProc: (x: any) => any = (x: any) => x;
    postProc: (x: any) => any = (x: any) => x;

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
        stateObj = this.postProc(stateObj);
        return stateObj;
    }

    setState(s: any) {
        s = this.preProc(s);
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
    removeBtn?: HTMLElement;
    removeEntry: boolean = false;

    constructor() {
        super();
    }
    
    lazyInit() {
        if (this.removeBtn) return;
        this.removeBtn = this.querySelector(".menu-list-remove-button")!;
        if (!this.removeBtn) {
            this.removeBtn = document.createElement("button");
            this.removeBtn.textContent = "delete";
            this.appendChild(this.removeBtn);
        }
        var _this = this;
        (<any>this.removeBtn).onclick = (e: any) => {
            _this.removeEntry = !_this.removeEntry;
            if (_this.removeEntry) {
                _this.removeBtn!.textContent = "restore";
                this.classList.add("list-entry-component-removed");
            } else {
                _this.removeBtn!.textContent = "delete";
                this.classList.remove("list-entry-component-removed");
            }
        };
        (<any>this.removeBtn).style.display = "inline-block";
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
        this.lazyInit();
        var menuElement = this.querySelector("[is^='menu-']");
        (<any>menuElement).setState(ls[0]);
    }

}

class ListComponent<a> extends HTMLDivElement
                       implements MenuComponent<a[]> {
    defaultEntry?: HTMLElement;
    entriesDiv: HTMLDivElement = document.createElement("div");

    entryCallback: (el: HTMLElement) => void = (el) => {};

    constructor() {
        super();

        this.defaultEntry = this.querySelector(".menu-list-default-entry")!;
        this.defaultEntry.remove();
        var addEntryButton = <HTMLButtonElement>this.querySelector("button.menu-add-another-button")!; 
        this.entriesDiv = <HTMLDivElement>this.querySelector(".menu-list-entries")!;
        
        var _this = this;
        addEntryButton.onclick = (e) => {
            var listEntry = new ListEntryComponent<a>();
            listEntry.setAttribute("is", "menu-list-entry");
            var listEntryMenu = _this.defaultEntry!.cloneNode(true);
            listEntry.appendChild(listEntryMenu);
            _this.entriesDiv.prepend(listEntry);
        };
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
            _this.entryCallback(<HTMLElement>listEntryMenu);
            this.entriesDiv.appendChild(listEntry); 
        });
    }
   
}

class LazyListComponent<a> extends HTMLDivElement
                           implements MenuComponent<a[]> {
    defaultElement?: HTMLElement;
    searchBar?: HTMLInputElement;
    entriesDiv?: HTMLDivElement; 
    addAnotherButton?: HTMLDivElement; 
    shownEntries: [number, HTMLElement][] = [];

    st: a[] = [];
    includedEntries: number[] = [];
    maxElements: number = 0;
    searchableFields: string[] = [];

    entryCallback: (el: HTMLElement) => void = (el) => {};

    constructor() {
        super();
    }

    connectedCallback() {
    }

    findChildren() {
        var _this = this;
        this.maxElements = parseInt(this.getAttribute("max") || "10");
        this.searchableFields = (this.getAttribute("search") || "").split(",");
        if (!this.addAnotherButton) {
            this.addAnotherButton = this.querySelector("button.menu-add-another-button")!;
            if (this.addAnotherButton) {
                (<HTMLElement>this.addAnotherButton).onclick = (e) => {
                    _this.includedEntries.push(_this.st.length);
                    _this.st.push((<any>this.defaultElement).getState());
                    _this.rerunSearch();
                }
            }
        }
        if (!this.searchBar) {
            this.searchBar = <HTMLInputElement>this.querySelector("input.menu-search-bar");
            this.searchBar.onchange = (e) => {
                _this.rerunSearch();
            }
        }
        if (!this.entriesDiv) {
            this.entriesDiv = this.querySelector("div.menu-list-entries")!;
        }
        if (!this.defaultElement) {
            this.defaultElement = this.querySelector(".menu-list-default-entry")!;
            this.defaultElement.remove();
        }
    }

    fieldName() {
        return this.getAttribute("name")!;
    }

    getState() {
        this.saveChanges();
        return [...this.includedEntries.map((i) => this.st[i])];
    }

    setState(ls: a[]) {
        this.st = ls;
        this.includedEntries = Array.from(Array(this.st.length).keys());
        this.shownEntries = [];
        this.rerunSearch();
    }

    saveChanges() {
        this.shownEntries.forEach((r) => {
            this.st[r[0]] = (<any>r[1]).getState();
        });
    }

    rerunSearch() {
        this.findChildren();
        this.saveChanges();

        var _this = this;
        if (!this.searchBar) {
            return;
        }
        var q = this.searchBar!.value;

        var selectedEntries = Array.from(Array(this.st.length).keys());
        selectedEntries = selectedEntries.filter((i) => _this.searchableFields.some((fld) => JSON.stringify(getDeepKey(_this.st[i], fld.split("."))).includes(q)));
        selectedEntries = [...selectedEntries].reverse();
        selectedEntries = selectedEntries.slice(0, this.maxElements);

        this.entriesDiv!.innerHTML = "";
        this.shownEntries = [];
        selectedEntries.forEach((i) => {
            var entry = this.st[i];
            var listEntryMenu = <HTMLElement>_this.defaultElement!.cloneNode(true);
            (<any>listEntryMenu).setState(entry);
            this.entriesDiv!.appendChild(listEntryMenu);

            var removeBtn = (<any>listEntryMenu).querySelector("button.menu-remove-entry-button")!;
            var restoreBtn = (<any>listEntryMenu).querySelector("button.menu-restore-entry-button")!;
            removeBtn.onclick = ((k) => (e: any) => {
                _this.includedEntries = [...this.includedEntries.filter((j) => k != j)];
                removeBtn.style.display = "none";
                restoreBtn.style.display = "inline-block";
                (<HTMLElement>listEntryMenu).classList.add("list-entry-component-removed");
            })(i);
            restoreBtn.onclick = ((i) => (k: any) => {
                if (!_this.includedEntries.includes(i)) _this.includedEntries.push(i);
                restoreBtn.style.display = "none";
                removeBtn.style.display = "inline-block";
                (<HTMLElement>listEntryMenu).classList.remove("list-entry-component-removed");
            })(i);
            
            if (this.includedEntries.includes(i)) {
                restoreBtn.click();
            } else {
                removeBtn.click();
            }

            _this.entryCallback(listEntryMenu);
            _this.shownEntries.push([i, listEntryMenu]);
        });
    }
}

window.customElements.define("menu-checkbox", CheckboxComponent, { extends: "input" });
window.customElements.define("menu-textbox", TextboxComponent, { extends: "input" });
window.customElements.define("menu-textfield", TextfieldComponent, { extends: "div" });
window.customElements.define("menu-number", NumberComponent, { extends: "input" });
window.customElements.define("menu-select", SelectComponent, { extends: "select" });
window.customElements.define("menu-group", GroupingComponent, { extends: "div" });
window.customElements.define("menu-list-entry", ListEntryComponent, { extends: "div" });
window.customElements.define("menu-list", ListComponent, { extends: "div" });
window.customElements.define("menu-lazy-list", LazyListComponent, { extends: "div" });
