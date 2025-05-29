import {
    guidGenerator
} from "./utils"


export function getHostname() {
    var host = localStorage.getItem("host");
    if (host === null) {
        host = guidGenerator();
        localStorage.setItem("host", host);
    }
    return host;
}

export function setRemote(url: string) {
    localStorage.setItem("syncserver", url);
}

export function getRemote(): string | null {
    return localStorage.getItem("syncserver");
}
