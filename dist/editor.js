"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.boolEditor = boolEditor;
exports.radioEditor = radioEditor;
exports.scrollNumberEditor = scrollNumberEditor;
exports.singleTextFieldEditor = singleTextFieldEditor;
exports.validatedTextFieldEditor = validatedTextFieldEditor;
exports.doubleTextFieldEditor = doubleTextFieldEditor;
exports.optionsEditor = optionsEditor;
exports.fileUploadEditor = fileUploadEditor;
exports.combineEditors = combineEditors;
exports.swappingTextEditor = swappingTextEditor;
exports.makeTranslationEditor = makeTranslationEditor;
exports.fixedNumEditors = fixedNumEditors;
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
function radioEditor(selected, options, labels) {
    var container = document.createElement("div");
    var radioName = (0, utils_1.guidGenerator)();
    var valueMap = {};
    var radios = [];
    for (var i in options) {
        var opt = options[i];
        var label = labels[i];
        var radioId = (0, utils_1.guidGenerator)();
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
            return null;
        }
    };
}
function scrollNumberEditor(label, val, min, max, step) {
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
    };
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
function optionsEditor(st, opts, labels) {
    var pickerEl = document.createElement("select");
    var optDict = {};
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
        menuToState: () => optDict[pickerEl.selectedOptions[0].getAttribute("value")]
    };
}
function fileUploadEditor(label, callback) {
    var content = "";
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
            var files = fileUploadInput.files;
            if (files == null)
                return;
            var file = files[0];
            if (file == null)
                return;
            var reader = new FileReader();
            reader.onload = (e) => {
                content = e.target.result;
                callback(content);
            };
            reader.readAsText(file, "UTF-8");
        };
    };
    return {
        element: container,
        menuToState: () => content
    };
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
function swappingTextEditor(spr) {
    var ed1 = singleTextFieldEditor(spr[0]);
    var ed2 = singleTextFieldEditor(spr[1]);
    var container = document.createElement("div");
    var btn = document.createElement("button");
    btn.onclick = () => {
        var tmp = ed1.element.value;
        ed1.element.value = ed2.element.value;
        ed2.element.value = tmp;
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
function makeTranslationEditor(ls, validator) {
    return multipleEditors(ls, () => ["", ""], (item) => combineEditors(item, (s) => singleTextFieldEditor(s), (s) => validatedTextFieldEditor(s, validator)), true, (s, cd) => cd[0].includes(s) || cd[1].includes(s));
}
function fixedNumEditors(ls, ed) {
    var children = [];
    var editor = {
        element: document.createElement("div"),
        menuToState: () => (0, utils_1.arrayReindex)(children.map((c) => c.menuToState()))
    };
    var statePartEditorFactory = (statePart) => {
        var newEditor = ed(statePart);
        children.push(newEditor);
        editor.element.appendChild(newEditor.element);
    };
    for (var i in ls) {
        statePartEditorFactory(ls[i]);
    }
    return editor;
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
