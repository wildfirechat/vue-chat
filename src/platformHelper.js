import {ipcRenderer, isElectron} from "@/platform";
import {remote} from "./platform";
import IPCEventType from "./ipcEventType";

export function downloadFile(message) {
    let file = message.messageContent;
    if (isElectron()) {
        ipcRenderer.send(IPCEventType.DOWNLOAD_FILE, {
            messageId: message.messageId,
            remotePath: file.remotePath,
            fileName: file.name,
            windowId: remote.getCurrentWindow().getMediaSourceId(),
        });
    } else {
        let fileHref = file.remotePath;
        let filename = file.name;
        if (window.navigator.msSaveBlob) {// ie
            let xhr = new XMLHttpRequest();
            xhr.onloadstart = function () {
                xhr.responseType = 'blob';
            };
            xhr.onload = function () {
                navigator.msSaveOrOpenBlob(xhr.response, filename);
            };
            xhr.open("GET", fileHref, true);
            xhr.send();
        } else {
            let anchor = document.createElement('a');
            anchor.download = filename;
            anchor.href = fileHref;
            anchor.click();
        }
    }
}
