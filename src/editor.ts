import {
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

export function makeTranslationEditor(ls: [string, string][], validator: (s: string) => boolean):
    StateEditor<[string, string][]> {
    return multipleEditors(
        ls,
        ["", ""],
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
    empty: a, 
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
    addBtn.onclick = (e) => { statePartEditorFactory(empty); };
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
