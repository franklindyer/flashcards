"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwappingButton = exports.GroupingComponent = exports.LazyGuidComponent = exports.NumberComponent = exports.TextboxListComponent = exports.TextboxComponent = exports.OptionsComponent = exports.CheckboxComponent = void 0;
/* UTILITY FUNCTIONS */
function guidGenerator() {
    var S4 = function () {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };
    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
}
function getMenuFieldName(el) {
    return el.getAttribute("name") || "";
}
function querySelectorTopLevel(el, q) {
    var res = [...el.querySelectorAll(q)];
    var resFilt = res.filter((el2) => !res.some((el3) => el3 !== el2 && el3.contains(el2)));
    return [...resFilt];
}
function getDeepKey(obj, ks) {
    if (ks.length == 0) {
        return obj;
    }
    else if (ks[0] in obj) {
        return getDeepKey(obj[ks[0]], ks.slice(1));
    }
    else {
        return undefined;
    }
}
function setDeepKey(obj, ks, value) {
    if (ks.length == 1) {
        obj[ks[0]] = value;
        return obj;
    }
    else {
        if (!(ks[0] in obj)) {
            obj[ks[0]] = {};
        }
        obj[ks[0]] = setDeepKey(obj[ks[0]], ks.slice(1), value);
        return obj;
    }
}
function getMenuRoot(menu) {
    var menu2 = undefined;
    while (menu !== menu2) {
        console.log(menu);
        menu2 = menu;
        menu = menu.root;
    }
    return menu;
}
/* CUSTOM MENU COMPONENTS */
class CheckboxComponent extends HTMLElement {
    root = this;
    inputElement = document.createElement("input");
    constructor() {
        super();
        this.inputElement.type = "checkbox";
    }
    connectedCallback() {
        this.innerHTML = "";
        this.appendChild(this.inputElement);
    }
    getState() {
        return this.inputElement.checked;
    }
    setState(b) {
        this.inputElement.checked = b;
    }
}
exports.CheckboxComponent = CheckboxComponent;
class OptionsComponent extends HTMLElement {
    root = this;
    state;
    inputElement = document.createElement("select");
    constructor() {
        super();
    }
    connectedCallback() {
        var options = this.querySelectorAll("option");
        this.innerHTML = "";
        options.forEach((el) => { this.inputElement.appendChild(el); });
        this.appendChild(this.inputElement);
        if (this.state) {
            this.setState(this.state);
        }
    }
    getState() {
        return this.inputElement.value;
    }
    setState(s) {
        this.state = s;
        this.inputElement.value = s;
    }
}
exports.OptionsComponent = OptionsComponent;
class TextboxComponent extends HTMLElement {
    root = this;
    inputElement = document.createElement("input");
    constructor() {
        super();
        this.inputElement.type = "text";
    }
    connectedCallback() {
        this.innerHTML = "";
        this.appendChild(this.inputElement);
        var placeholder = this.getAttribute("placeholder");
        if (placeholder) {
            this.inputElement.placeholder = placeholder;
        }
        if (this.getAttribute("disabled") == "true") {
            this.inputElement.disabled = true;
        }
    }
    getState() {
        return this.inputElement.value;
    }
    setState(s) {
        this.inputElement.value = s;
    }
}
exports.TextboxComponent = TextboxComponent;
class TextboxListComponent extends HTMLElement {
    root = this;
    inputElement = document.createElement("input");
    constructor() {
        super();
        this.inputElement.type = "text";
    }
    getSeparator() {
        if (this.getAttribute("sep")) {
            return this.getAttribute("sep");
        }
        return ",";
    }
    connectedCallback() {
        this.innerHTML = "";
        this.appendChild(this.inputElement);
        var placeholder = this.getAttribute("placeholder");
        if (placeholder) {
            this.inputElement.placeholder = placeholder;
        }
    }
    getState() {
        var separator = this.getSeparator();
        if (this.inputElement.value.length == 0) {
            return [];
        }
        return this.inputElement.value.split(separator);
    }
    setState(ss) {
        var separator = this.getSeparator();
        this.inputElement.value = ss.join(separator);
    }
}
exports.TextboxListComponent = TextboxListComponent;
class NumberComponent extends HTMLElement {
    root = this;
    inputElement = document.createElement("input");
    constructor() {
        super();
        this.inputElement.type = "number";
    }
    connectedCallback() {
        this.appendChild(this.inputElement);
        this.inputElement.min = this.getAttribute("min");
        this.inputElement.max = this.getAttribute("max");
        this.inputElement.step = this.getAttribute("step");
    }
    getState() {
        if (this.inputElement.value.length == 0) {
            return 0;
        }
        return parseFloat(this.inputElement.value);
    }
    setState(x) {
        console.log(x);
        if (x.toString() == '') {
            this.inputElement.value = "0";
        }
        else {
            this.inputElement.value = x.toString();
        }
        console.log(this.inputElement.value);
    }
}
exports.NumberComponent = NumberComponent;
class LazyGuidComponent extends HTMLElement {
    root = this;
    guid = guidGenerator();
    constructor() {
        super();
    }
    getState() {
        return this.guid;
    }
    setState(s) {
        this.guid = s;
    }
}
exports.LazyGuidComponent = LazyGuidComponent;
class GroupingComponent extends HTMLElement {
    root = this;
    isStateInit = false;
    state = {};
    subcomponents = {};
    preProc = (obj) => obj;
    postProc = (obj) => obj;
    constructor() {
        super();
    }
    connectedCallback() {
    }
    initComponents() {
        if (!this.isStateInit) {
            this.isStateInit = true;
            var childComps = querySelectorTopLevel(this, "[name]");
            childComps.forEach((el) => {
                el.root = this;
                this.subcomponents[el.getAttribute("name")] = el;
            });
        }
    }
    getState() {
        this.initComponents();
        Object.keys(this.subcomponents).forEach((k) => {
            var v = this.subcomponents[k].getState();
            this.state = setDeepKey(this.state, k.split("."), v);
            // this.state[k] = (<MenuComponent<any>>this.subcomponents[k]).getState();
        });
        return this.postProc(this.state);
    }
    setState(obj) {
        this.initComponents();
        this.state = this.preProc(obj);
        Object.keys(this.subcomponents).forEach((k) => {
            var deepVal = getDeepKey(this.state, k.split("."));
            if (deepVal) {
                this.subcomponents[k].setState(deepVal);
            }
        });
    }
}
exports.GroupingComponent = GroupingComponent;
class LazyListComponent extends HTMLElement {
    root = this;
    state = [];
    includedEntries = [];
    shownEntries = [];
    limit = -1;
    defaultStatePath = "";
    addAnotherButton;
    searchBar;
    entryContainer;
    defaultEntry;
    dynamicDefaultState;
    entryCallback = (el) => { };
    constructor() {
        super();
    }
    initComponents() {
        var _this = this;
        if (this.getAttribute("limit")) {
            this.limit = parseInt(this.getAttribute("limit"));
        }
        if (this.getAttribute("defaultStatePath")) {
            this.defaultStatePath = this.getAttribute("defaultStatePath");
        }
        if (!this.addAnotherButton) {
            this.addAnotherButton = querySelectorTopLevel(this, ".add-another-button")[0];
            if (this.addAnotherButton) {
                this.addAnotherButton.onclick = (e) => {
                    _this.state.push(_this.newEntryState());
                    var ind = _this.state.length - 1;
                    _this.includedEntries.push(ind);
                    _this.addElementForEntry(ind);
                };
            }
        }
        if (!this.searchBar) {
            this.searchBar = this.querySelector(".search-bar");
            if (this.searchBar) {
                this.searchBar.onchange = (e) => {
                    _this.rerunSearch();
                };
            }
        }
        if (!this.entryContainer) {
            this.entryContainer = this.querySelector(".list-entry-container");
        }
        if (!this.defaultEntry) {
            this.defaultEntry = querySelectorTopLevel(this, ".list-default-entry")[0];
            console.log(this.defaultEntry);
            if (this.defaultEntry) {
                this.defaultEntry.classList.remove("list-default-entry");
                this.defaultEntry.remove();
            }
        }
    }
    newEntryElement() {
        var entryEl = this.defaultEntry.cloneNode(true);
        return entryEl;
    }
    newEntryState() {
        var res = undefined;
        if (this.defaultStatePath) {
            res = getDeepKey(getMenuRoot(this).getState(), this.defaultStatePath.split(".")); // Could be made lazier?
        }
        else if (this.dynamicDefaultState) {
            res = this.dynamicDefaultState();
        }
        else {
            res = this.newEntryElement().getState();
        }
        res = JSON.parse(JSON.stringify(res));
        return res;
    }
    addElementForEntry(i) {
        var _this = this;
        var r = this.state[i];
        var entryEl = this.newEntryElement();
        entryEl.setState(r);
        entryEl.root = this;
        var entryRemoveBtn = entryEl.querySelector(".list-entry-remove-button");
        var entryRestoreBtn = entryEl.querySelector(".list-entry-restore-button");
        entryRemoveBtn.onclick = ((i) => (e) => {
            entryRemoveBtn.style.display = "none";
            entryRestoreBtn.style.display = "inline-block";
            entryEl.classList.add("deleted-list-entry");
            _this.includedEntries = [..._this.includedEntries.filter((j) => j !== i)];
        })(i);
        entryRestoreBtn.onclick = ((i) => (e) => {
            entryRemoveBtn.style.display = "inline-block";
            entryRestoreBtn.style.display = "none";
            entryEl.classList.remove("deleted-list-entry");
            if (!(this.includedEntries.includes(i))) {
                _this.includedEntries.unshift(i);
            }
        })(i);
        if (this.includedEntries.includes(i)) {
            entryRestoreBtn.click();
        }
        else {
            entryRemoveBtn.click();
        }
        this.entryCallback(entryEl);
        this.shownEntries.push([i, entryEl]);
        this.entryContainer.prepend(entryEl);
    }
    saveEdits() {
        this.shownEntries.forEach((r) => {
            this.state[r[0]] = r[1].getState();
        });
    }
    rerunSearch() {
        this.initComponents();
        this.saveEdits();
        var q = "";
        if (this.searchBar) {
            q = this.searchBar.value;
        }
        this.shownEntries = [];
        this.entryContainer.innerHTML = "";
        var resultInds = [...new Array(this.state.length).keys()]; // .reverse();
        if (q.length > 0) {
            resultInds = [...resultInds.filter((i) => JSON.stringify(this.state[i]).includes(q))];
        }
        if (this.limit > 0) {
            resultInds.reverse();
            resultInds = resultInds.slice(0, this.limit);
            resultInds.reverse();
        }
        var _this = this;
        resultInds.forEach((i) => {
            _this.addElementForEntry(i);
        });
    }
    getState() {
        this.initComponents();
        this.saveEdits();
        var result = this.includedEntries.map((i) => this.state[i]);
        return result;
    }
    setState(xs) {
        this.initComponents();
        this.state = xs;
        this.includedEntries = [...new Array(this.state.length).keys()];
        this.rerunSearch();
    }
}
/* OTHER CUSTOM COMPONENTS */
class SwappingButton extends HTMLElement {
    leftEl;
    rightEl;
    constructor() {
        super();
        var btn = document.createElement("button");
        btn.textContent = this.textContent;
        this.textContent = "";
        this.appendChild(btn);
        btn.onclick = (e) => {
            this.initComponents();
            var s = this.leftEl.getState();
            this.leftEl.setState(this.rightEl.getState());
            this.rightEl.setState(s);
        };
    }
    initComponents() {
        if (!this.leftEl || !this.rightEl) {
            var leftName = this.getAttribute("left");
            this.leftEl = this.parentNode.querySelector(`[name='${leftName}']`);
            var rightName = this.getAttribute("right");
            this.rightEl = this.parentNode.querySelector(`[name='${rightName}']`);
        }
    }
}
exports.SwappingButton = SwappingButton;
window.customElements.define("menu-checkbox", CheckboxComponent);
window.customElements.define("menu-options", OptionsComponent);
window.customElements.define("menu-textbox", TextboxComponent);
window.customElements.define("menu-textlist", TextboxListComponent);
window.customElements.define("menu-guid", LazyGuidComponent);
window.customElements.define("menu-number", NumberComponent);
window.customElements.define("menu-group", GroupingComponent);
window.customElements.define("menu-list", LazyListComponent);
window.customElements.define("swap-button", SwappingButton);
