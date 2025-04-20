"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.boolEditor = boolEditor;
exports.singleTextFieldEditor = singleTextFieldEditor;
exports.validatedTextFieldEditor = validatedTextFieldEditor;
exports.doubleTextFieldEditor = doubleTextFieldEditor;
exports.combineEditors = combineEditors;
exports.makeTranslationEditor = makeTranslationEditor;
exports.multipleEditors = multipleEditors;
const utils_1 = require("./utils");
/* Some useful state editors */
function boolEditor(label, val) {
    var checkbox = document.createElement("input");
    var editor = {
        element: null,
        menuToState: () => checkbox.checked
    };
    checkbox.type = "checkbox";
    checkbox.checked = val;
    var guid = (0, utils_1.guidGenerator)();
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
function singleTextFieldEditor(txt) {
    var editor = {
        element: document.createElement("input"),
        menuToState: () => editor.element.value
    };
    editor.element.value = txt;
    return editor;
}
function validatedTextFieldEditor(txt, pred = () => true) {
    var editor = singleTextFieldEditor(txt);
    editor.element.oninput = (e) => {
        if (!pred(editor.element.value)) {
            editor.element.style.backgroundColor = "#ffeeee";
        }
        else {
            editor.element.style.backgroundColor = "white";
        }
    };
    return editor;
}
function doubleTextFieldEditor(txts) {
    var children = [singleTextFieldEditor(txts[0]), singleTextFieldEditor(txts[1])];
    var editor = {
        element: document.createElement("div"),
        menuToState: () => children.map((c) => c.menuToState())
    };
    editor.element.appendChild(children[0].element);
    editor.element.appendChild(children[1].element);
    return editor;
}
function combineEditors(st, gen1, gen2) {
    var children = [gen1(st[0]), gen2(st[1])];
    var editor = {
        element: document.createElement("div"),
        menuToState: () => [children[0].menuToState(), children[1].menuToState()]
    };
    editor.element.appendChild(children[0].element);
    editor.element.appendChild(children[1].element);
    return editor;
}
function makeTranslationEditor(ls, validator) {
    return multipleEditors(ls, ["", ""], (item) => combineEditors(item, (s) => singleTextFieldEditor(s), (s) => validatedTextFieldEditor(s, validator)), true, (s, cd) => cd[0].includes(s) || cd[1].includes(s));
}
function multipleEditors(ls, empty, ed, includeSearch = false, searchFxn = (s, x) => true) {
    var children = [];
    var editor = {
        element: document.createElement("div"),
        menuToState: () => (0, utils_1.arrayReindex)(children.map((c) => c.menuToState()))
    };
    var addBtn = document.createElement("button");
    addBtn.classList.add("add-new-field-button");
    addBtn.textContent = "Add another";
    var listDiv = document.createElement("div");
    var statePartDivs = [];
    var statePartEditorFactory = (statePart) => {
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
        };
        statePartDiv.appendChild(delBtn);
        listDiv.prepend(statePartDiv);
        statePartDivs.push(statePartDiv);
    };
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
                }
                else {
                    statePartDivs[i].style.display = "none";
                }
            }
        };
        editor.element.appendChild(searchBar);
    }
    editor.element.appendChild(listDiv);
    for (var i in ls) {
        statePartEditorFactory(ls[i]);
    }
    return editor;
}
