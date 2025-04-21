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

// https://stackoverflow.com/questions/3665115/how-to-create-a-file-in-memory-for-user-to-download-but-not-through-server
export function downloadText(filename: string, text: string) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}
