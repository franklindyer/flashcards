import {
    IDictionary,
    arrayReindex,
    guidGenerator
} from "./utils"

export type StateEditor<s> = {
    element: HTMLElement,
    menuToState: () => s
}

/* Some useful state editors */

export function boolEditor(label: string, val: boolean): StateEditor<boolean> {
    var checkbox = document.createElement("input");
    var editor: StateEditor<boolean> = {
        element: null!,
        menuToState: () => (<HTMLInputElement>checkbox).checked
    };
    (<HTMLInputElement>checkbox).type = "checkbox";
    (<HTMLInputElement>checkbox).checked = val;
    var guid = guidGenerator();
    checkbox.id = guid;
    var elementLabel = document.createElement("label");
    elementLabel.htmlFor = guid;
    elementLabel.textContent = label;
    var boxWithLabel = document.createElement("div");
    boxWithLabel.appendChild(checkbox);
    boxWithLabel.appendChild(elementLabel);
    editor.element = boxWithLabel;
    return editor;
}

export function radioEditor<a>(selected: a, options: a[], labels: string[]): StateEditor<a> {
    var container = document.createElement("div");
    var radioName = guidGenerator();
    var valueMap: IDictionary<a> = {};
    var radios: HTMLInputElement[] = [];
    for (var i in options) {
        var opt = options[i];
        var label = labels[i];
        var radioId = guidGenerator();
        var radioBtn = document.createElement("input");
        radioBtn.type = "radio";
        radioBtn.id = radioId;
        radioBtn.name = radioName;
        var radioLabel = document.createElement("label");
        radioLabel.textContent = label;
        radioLabel.htmlFor = radioId;
        var radioDiv = document.createElement("div");
        radioDiv.appendChild(radioBtn);
        radioDiv.appendChild(radioLabel);
        container.appendChild(radioDiv);
        radioBtn.value = radioId;
        valueMap[radioId] = opt;
        radioBtn.checked = (opt == selected);
        radios.push(radioBtn);
    }
    return {
        element: container,
        menuToState: () => {
            for (var i in radios) {
                var r = radios[i];
                if (r.checked) {
                    return valueMap[r.value];
                }
            }
            return null!;
        }
    }
}

export function scrollNumberEditor(label: string, val: number, min: number, max: number, step: number):
    StateEditor<number> {
    var scroller = document.createElement("input");
    scroller.type = "number";
    scroller.max = max.toString();
    scroller.min = min.toString();
    scroller.value = val.toString();
    scroller.step = step.toString();
    var scrollerLabel = document.createElement("a");
    scrollerLabel.textContent = label;
    var scrollerCont = document.createElement("div");
    scrollerCont.appendChild(scrollerLabel);
    scrollerCont.appendChild(scroller);
    scrollerCont.style.display = "block";
    return {
        element: scrollerCont,
        menuToState: () => parseFloat(scroller.value)
    }
}

export function singleTextFieldEditor(txt: string): StateEditor<string> {
    var editor: StateEditor<string> = {
        element: document.createElement("input"),
        menuToState: () => (<HTMLInputElement>editor.element).value
    };
    (<HTMLInputElement>editor.element).value = txt;
    return editor;
}

export function validatedTextFieldEditor(txt: string, pred: (s: string) => boolean = () => true):
    StateEditor<string> {
    var editor = singleTextFieldEditor(txt);
    editor.element.oninput = (e) => {
        if (!pred((<HTMLInputElement>editor.element).value)) {
            editor.element.style.backgroundColor = "#ffeeee";
        } else {
            editor.element.style.backgroundColor = "white";
        }
    }
    return editor;
}

export function doubleTextFieldEditor(txts: [string, string]): StateEditor<[string, string]> {
    var children = [singleTextFieldEditor(txts[0]), singleTextFieldEditor(txts[1])];
    var editor: StateEditor<[string, string]> = {
        element: document.createElement("div"),
        menuToState: () => <[string, string]>children.map((c) => c.menuToState())
    }
    editor.element.appendChild(children[0].element);
    editor.element.appendChild(children[1].element);
    return editor;
}

export function optionsEditor<a>(st: a, opts: a[], labels: (x: a) => string): StateEditor<a> {
    var pickerEl = document.createElement("select");
    var optDict: IDictionary<a> = {};
    for (var x of opts) {
        var optEl = document.createElement("option");
        var label = labels(x);
        optDict[label] = x;
        optEl.textContent = label;
        optEl.setAttribute("value", label);
        pickerEl.appendChild(optEl);
        if (label == labels(st)) {
            pickerEl.value = label;
        }
    }
    return {
        element: pickerEl,
        menuToState: () => optDict[pickerEl.selectedOptions[0].getAttribute("value")!] 
    }
}

export function fileUploadEditor(label: string, callback: (s: string) => void): StateEditor<string> {
    var content: string = "";
    var container = document.createElement("div");
    var importBtn = document.createElement("button");
    importBtn.textContent = label;
    var fileUploadInput = document.createElement("input");
    fileUploadInput.type = "file";
    fileUploadInput.style.display = "none";
    container.appendChild(importBtn);
    container.appendChild(fileUploadInput);

    importBtn.onclick = (e) => {
        fileUploadInput.click();
        fileUploadInput.onchange = (e) => {
            var files = (<HTMLInputElement>fileUploadInput).files;
            if (files == null) return;
            var file = files[0];
            if (file == null) return;
            var reader = new FileReader();
            reader.onload = (e) => {
                content = <string>e.target!.result;
                callback(content);
            };
            reader.readAsText(file, "UTF-8");
        }
    };

    return {
        element: container,
        menuToState: () => content
    };
}

export function combineEditors<a, b>(
    st: [a, b], 
    gen1: (x: a) => StateEditor<a>,
    gen2: (x: b) => StateEditor<b>): 
    StateEditor<[a, b]> {
    var children = [gen1(st[0]), gen2(st[1])];
    var editor: StateEditor<[a, b]> = {
        element: document.createElement("div"),
        menuToState: () => [<a>children[0].menuToState(), <b>children[1].menuToState()]
    }
    editor.element.appendChild(children[0].element);
    editor.element.appendChild(children[1].element);
    return editor;
}

export function swappingTextEditor(spr: [string, string]):
    StateEditor<[string, string]> {
    var ed1 = singleTextFieldEditor(spr[0]);
    var ed2 = singleTextFieldEditor(spr[1]);
    var container = document.createElement("div");

    var btn = document.createElement("button");
    btn.onclick = () => {
        var tmp = (<HTMLInputElement>ed1.element).value;
        (<HTMLInputElement>ed1.element).value = (<HTMLInputElement>ed2.element).value;
        (<HTMLInputElement>ed2.element).value = tmp;
    };
    btn.textContent = "↔";

    container.appendChild(ed1.element);
    container.appendChild(btn);
    container.appendChild(ed2.element);

    return {
        element: container,
        menuToState: () => [ed1.menuToState(), ed2.menuToState()]
    };
}

export function makeTranslationEditor(ls: [string, string][], validator: (s: string) => boolean):
    StateEditor<[string, string][]> {
    return multipleEditors(
        ls,
        () => ["", ""],
        (item) => combineEditors(
            item,
            (s: string) => singleTextFieldEditor(s),
            (s: string) => validatedTextFieldEditor(s, validator),
        ),
        true,
        (s, cd) => cd[0].includes(s) || cd[1].includes(s)
    )
}

export function fixedNumEditors<a, b>(ls: a[], ed: (st: a) => StateEditor<b>):
    StateEditor<b[]> {
    var children: StateEditor<b>[] = [];
    var editor: StateEditor<b[]> = {
        element: document.createElement("div"),
        menuToState: () => arrayReindex(children.map((c) => c.menuToState()))
    }
    
    var statePartEditorFactory = (statePart: a) => {
        var newEditor = ed(statePart);
        children.push(newEditor);
        editor.element.appendChild(newEditor.element);
    }
    for (var i in ls) {
        statePartEditorFactory(ls[i])
    }

    return editor;

}

export function multipleEditors<a>(
    ls: a[], 
    empty: () => a, 
    ed: (st: a) => StateEditor<a>,
    includeSearch: boolean = false,
    searchFxn: (s: string, st: a) => boolean = (s: string, x: a) => true): 
    StateEditor<a[]> {
    var children: StateEditor<a>[] = [];
    var editor: StateEditor<a[]> = {
        element: document.createElement("div"),
        menuToState: () => arrayReindex(children.map((c) => c.menuToState()))
    }
    
    var addBtn = document.createElement("button");
    addBtn.classList.add("add-new-field-button");
    addBtn.textContent = "Add another";
    var listDiv = document.createElement("div");
    var statePartDivs: HTMLElement[] = [];
    var statePartEditorFactory = (statePart: a) => {
        var newEditor = ed(statePart);
        children.push(newEditor);
        var ind = children.length - 1;
        var statePartDiv = document.createElement("div");
        statePartDiv.appendChild(newEditor.element);
        newEditor.element.style.display = "inline-block";
        var delBtn = document.createElement("button");
        delBtn.classList.add("menu-remove-card-button");
        delBtn.textContent = "remove";
        delBtn.onclick = (e) => {
            delete children[ind];
            delete statePartDivs[ind];
            listDiv.removeChild(statePartDiv);
        }
        statePartDiv.appendChild(delBtn);
        listDiv.prepend(statePartDiv);
        statePartDivs.push(statePartDiv);
    }
    addBtn.onclick = (e) => { statePartEditorFactory(empty()); };
    editor.element.appendChild(addBtn);

    if (includeSearch) {
        var searchBar = document.createElement("input");
        searchBar.placeholder = "Search...";
        searchBar.oninput = (e) => {
            for (var i in children) {
                var ed = children[i];
                if (searchFxn(searchBar.value, ed.menuToState())) {
                    statePartDivs[i].style.display = "block";
                } else {
                    statePartDivs[i].style.display = "none";
                }
            }        
        }
        editor.element.appendChild(searchBar);
    }

    editor.element.appendChild(listDiv);
    for (var i in ls) {
        statePartEditorFactory(ls[i])
    }

    return editor;
}
