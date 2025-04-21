export interface IDictionary<a> {
    [key: string]: a;
}

// https://stackoverflow.com/questions/6860853/generate-random-string-for-div-id
export function guidGenerator(): string {
    var S4 = function() {
       return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}

export function arrayReindex<a>(ls: a[]): a[] { 
    return ls.filter((_) => true);
}

export function makeDict<a>(items: a[], key: (x: a) => string) {
    var d: IDictionary<a> = {};
    items.map((x) => { d[key(x)] = x; });
    return d;
}
