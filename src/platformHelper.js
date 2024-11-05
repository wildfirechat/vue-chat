import {ipcRenderer, isElectron} from "./platform";
import {remote, screen} from "./platform";
import IPCEventType from "./ipcEventType";
import IpcEventType from "./ipcEventType";
import store from "./store";
import ImageMessageContent from "./wfc/messages/imageMessageContent";
import {scaleDown} from "./ui/util/imageUtil";
import {toRaw} from "vue";

export function downloadFile(message) {
    let file = message.messageContent;
    downloadFile2(file.remotePath, file.name, message.messageUid)
}

export function downloadFile2(url, name, messageUid) {
    if (isElectron()) {
        ipcRenderer.send(IPCEventType.DOWNLOAD_FILE, {
            messageUid: stringValue(messageUid),
            remotePath: url,
            fileName: name,
            windowId: remote.getCurrentWindow().getMediaSourceId(),
        });
    } else {
        let fileHref = url;
        let filename = name;
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
            anchor.target = 'about:blank'
            anchor.click();
        }
    }
}

export function previewMM(message, mixMultiMediaItemIndex = 0) {
    if (isElectron()) {
        let hash = window.location.hash;
        let url = window.location.origin;
        if (hash) {
            url = window.location.href.replace(hash, '#/mmpreview');
        } else {
            url += "/mmpreview"
        }

        url += `?messageUid=${stringValue(message.messageUid)}&mmmIndex=${mixMultiMediaItemIndex}`
        let size;
        if (message.messageContent instanceof ImageMessageContent) {
            let display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint())
            let imgMsg = message.messageContent;
            if (imgMsg.imageWidth && imgMsg.imageHeight) {
                let workAreaWith = display.workAreaSize.width;
                let workAreaHeight = display.workAreaSize.height;
                size = scaleDown(imgMsg.imageWidth, imgMsg.imageHeight, workAreaWith, workAreaHeight);
            }
        }
        ipcRenderer.send(IpcEventType.SHOW_MULTIMEDIA_PREVIEW_WINDOW, {
            url: url,
            messageUid: toRaw(message.messageUid),
            size,
        });
        console.log('show-multimedia-preview-window', url)
    } else {
        store.previewMessage(message, true);
    }
}
