import { ipcRenderer, isElectron } from './platform';
import { remote, screen } from './platform';
import IPCEventType from './ipcEventType';
import IpcEventType from './ipcEventType';
import store from './store';
import ImageMessageContent from './wfc/messages/imageMessageContent';
import { scaleDown } from './ui/util/imageUtil';

/**
 * 获取基础 URL（开发环境或生产环境）
 * @returns {string}
 */
export function getAppBaseUrl() {
    let hash = window.location.hash;
    let url = window.location.origin;
    if (hash) {
        url = window.location.href.replace(hash, '');
    } else {
        // url += '';
    }
    return url;
}

/**
 * 构建投票页面 URL
 * @param {Object} params
 * @param {string} params.mode - 'home' | 'create' | 'list' | 'detail'
 * @param {string} [params.pollId] - 投票 ID（detail 模式需要）
 * @param {string} [params.groupId] - 群 ID
 * @param {boolean} [params.fromMessage] - 是否从消息点击进入
 * @returns {string}
 */
export function buildPollUrl({ mode = 'home', pollId, groupId, fromMessage } = {}) {
    const baseUrl = getAppBaseUrl();

    // 根据模式决定路由
    let route = '/poll';
    if (mode === 'create') {
        route = '/poll/create';
    } else if (mode === 'list') {
        route = '/poll/list';
    } else if (mode === 'detail' && pollId) {
        route = '/poll/detail';
    }

    let url = baseUrl + '#' + route;

    const queryParams = [];
    if (pollId) {
        queryParams.push(`pollId=${pollId}`);
    }
    if (groupId) {
        queryParams.push(`groupId=${groupId}`);
    }
    if (fromMessage) {
        queryParams.push(`fromMessage=1`);
    }
    if (queryParams.length > 0) {
        url += `?${queryParams.join('&')}`;
    }

    return url;
}

/**
 * 构建接龙页面 URL
 * @param {Object} params
 * @param {string} params.mode - 'create' | 'detail'
 * @param {string} [params.collectionId] - 接龙 ID（detail 模式需要）
 * @param {string} [params.groupId] - 群 ID
 * @returns {string}
 */
export function buildCollectionUrl({ mode = 'create', collectionId, groupId } = {}) {
    const baseUrl = getAppBaseUrl();

    // 根据模式决定路由
    let route = collectionId ? '/collection/detail' : '/collection/create';

    let url = baseUrl + '#' + route;

    const queryParams = [];
    if (collectionId) {
        queryParams.push(`collectionId=${collectionId}`);
    }
    if (groupId) {
        queryParams.push(`groupId=${groupId}`);
    }
    if (queryParams.length > 0) {
        url += `?${queryParams.join('&')}`;
    }

    return url;
}

export function downloadFile(message) {
    let file = message.messageContent;
    downloadFile2(file.remotePath, file.name, message.messageUid);
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
            xhr.open('GET', fileHref, true);
            xhr.send();
        } else {
            let anchor = document.createElement('a');
            anchor.download = filename;
            anchor.href = fileHref;
            anchor.target = 'about:blank';
            anchor.click();
        }
    }
}

export function previewMM(message, mixMultiMediaItemIndex = 0, continuous = true) {
    if (isElectron()) {
        let hash = window.location.hash;
        let url = window.location.origin;
        if (hash) {
            url = window.location.href.replace(hash, '#/mmpreview');
        } else {
            url += '/mmpreview';
        }

        url += `?messageUid=${stringValue(message.messageUid)}&mmmIndex=${mixMultiMediaItemIndex}`;
        let size;
        if (message.messageContent instanceof ImageMessageContent) {
            let display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
            let imgMsg = message.messageContent;
            if (imgMsg.imageWidth && imgMsg.imageHeight) {
                let workAreaWith = display.workAreaSize.width;
                let workAreaHeight = display.workAreaSize.height;
                size = scaleDown(imgMsg.imageWidth, imgMsg.imageHeight, workAreaWith, workAreaHeight);
            }
        }
        ipcRenderer.send(IpcEventType.SHOW_MULTIMEDIA_PREVIEW_WINDOW, {
            url: url,
            messageUid: stringValue(message.messageUid),
            size,
        });
        console.log('show-multimedia-preview-window', url);
    } else {
        store.previewMessage(message, continuous);
    }
}
