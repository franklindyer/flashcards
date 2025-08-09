import {
    recursiveRepairJSON
} from "../src/utils/utils"

var defaultObj = () => { return {
    "abc": "123",
    "bcd": [1, 2, 3],
    "cde": 5,
    "def": {
        "a1": 0,
        "a2": "xyz",
        "a3": []
    },
    "efg": {
        "efg2": {
            "efg3": {
                "efg4": 42
            }
        }
    },
    "fgh": [
        { "a": 1, "b": 2, "c": [] } 
    ]
}; };

describe('arbitrary JSON repairing algorithm works correctly', () => {

    test('repairing same object has no effect', () => {
        var selfRepairedObj = recursiveRepairJSON(defaultObj(), defaultObj());
        expect(defaultObj()).toEqual(selfRepairedObj);
    });

    test('deleted keys get replaced with default value', () => {
        var defObj = defaultObj();

        for (var i in Object.keys(defObj)) {
            var k = Object.keys(defObj)[i];
            var otherObj = <any>defaultObj();
            delete otherObj[k];
            expect(defObj).toEqual(recursiveRepairJSON(otherObj, defObj));
        }
    });

    test('deeply deleted key gets replaced with default value', () => {
        var defObj = defaultObj();
        var otherObj = <any>defaultObj();
        delete otherObj["efg"]["efg2"]["efg3"]["efg4"];
        otherObj = recursiveRepairJSON(otherObj, defObj);
        expect(defObj).toEqual(otherObj);
    });

    test('key deleted from array element gets replaced', () => {
        var defObj = defaultObj();
        var otherObj = <any>defaultObj();
        delete otherObj["fgh"][0]["a"];
        otherObj = recursiveRepairJSON(otherObj, defObj);
        expect(defObj).toEqual(otherObj);
    });

});
