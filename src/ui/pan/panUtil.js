import Config from '../../config';
import panApi from '../../api/panApi';
import wfc from '../../wfc/client/wfc';
import MessageContentMediaType from '../../wfc/messages/messageContentMediaType';
import {md5Hex} from './md5';

/**
 * 网盘 / 在线文档页面的公共工具：地址与权限判定、尺寸与时间格式化、上传、
 * 存到网盘、以及在线文档 H5 页面的 postMessage 桥（宿主侧实现）。
 *
 * 所有入口都要先判 Config.isPanEnabled()，未配置网盘服务时页面与菜单项都不出现。
 */

export const SPACE_TYPE = {
    GLOBAL_PUBLIC: 'GLOBAL_PUBLIC',
    USER_PUBLIC: 'USER_PUBLIC',
    USER_PRIVATE: 'USER_PRIVATE',
};

/** 网盘服务是否已配置 */
export function isPanEnabled() {
    return Config.isPanEnabled();
}

/** 网页端一律有内置网页（iframe / 弹窗），手机端才有「有没有内置 WebView」之分 */
export function isInlineWebViewSupported() {
    return true;
}

/** 网盘服务的主机名（authCode 按 host 签发） */
export function panHost() {
    const base = Config.getPanServer();
    if (!base) {
        return '';
    }
    return base.replace(/^https?:\/\//, '').split('/')[0];
}

/** 用 IM 的 authCode 换取网盘接口/文档页面的信任（appId=admin，type=2） */
export function getPanAuthCode() {
    return new Promise((resolve, reject) => {
        if (!isPanEnabled()) {
            reject(new Error('网盘服务未配置'));
            return;
        }
        wfc.getAuthCode('admin', 2, panHost(),
            (authCode) => resolve(authCode),
            (err) => reject(new Error('获取认证码失败: ' + err)));
    });
}

// ------------------------------------------------------------------ 空间

export function spaceTypeOf(space) {
    const type = String((space && space.spaceType) || '').toUpperCase().replace(/-/g, '_');
    if (type === SPACE_TYPE.GLOBAL_PUBLIC || type === SPACE_TYPE.USER_PUBLIC || type === SPACE_TYPE.USER_PRIVATE) {
        return type;
    }
    return SPACE_TYPE.USER_PRIVATE;
}

/** 空间在界面上的叫法：自己的空间统一叫「我的…」，别人的用服务端给的名字 */
export function spaceDisplayName(space, t) {
    const type = spaceTypeOf(space);
    const mine = !space || !space.ownerId || space.ownerId === wfc.getUserId();
    let key = 'pan.my_private';
    let fallback = '我的私有空间';
    if (type === SPACE_TYPE.GLOBAL_PUBLIC) {
        key = 'pan.global_public';
        fallback = '公共空间';
    } else if (type === SPACE_TYPE.USER_PUBLIC) {
        key = 'pan.my_public';
        fallback = '我的公开空间';
    }
    if (type === SPACE_TYPE.GLOBAL_PUBLIC || mine) {
        if (t) {
            const text = t(key);
            if (text && text !== key) {
                return text;
            }
        }
        return fallback;
    }
    return (space && space.name) || fallback;
}

/** 只有空间管理者（自己的空间、或全局管理员）才能新建/上传/改名/删除 */
export function canWriteSpace(space) {
    return !!(space && space.canManage);
}

export function spaceIcon(space) {
    switch (spaceTypeOf(space)) {
        case SPACE_TYPE.GLOBAL_PUBLIC:
            return '🏢';
        case SPACE_TYPE.USER_PUBLIC:
            return '📂';
        default:
            return '👤';
    }
}

export function spaceIconClass(space) {
    switch (spaceTypeOf(space)) {
        case SPACE_TYPE.GLOBAL_PUBLIC:
            return 'global';
        case SPACE_TYPE.USER_PUBLIC:
            return 'public';
        default:
            return 'private';
    }
}

// ------------------------------------------------------------------ 文件

export function isFolder(file) {
    return !!file && (file.type === 'FOLDER' || file.isFolder === true);
}

export function onlineDocKind(name) {
    const idx = (name || '').lastIndexOf('.');
    if (idx <= 0) {
        return 'file';
    }
    const ext = name.substring(idx + 1).toLowerCase();
    if (['doc', 'docx', 'docm', 'dot', 'dotx', 'dotm', 'odt', 'ott', 'rtf', 'txt', 'wps', 'wpt', 'fodt', 'mht', 'mhtml', 'htm', 'html', 'epub', 'fb2'].indexOf(ext) >= 0) {
        return 'word';
    }
    if (['xls', 'xlsx', 'xlsm', 'xlt', 'xltx', 'xltm', 'xlsb', 'ods', 'ots', 'csv', 'et', 'ett', 'fods'].indexOf(ext) >= 0) {
        return 'excel';
    }
    if (['ppt', 'pptx', 'pptm', 'pot', 'potx', 'potm', 'pps', 'ppsx', 'ppsm', 'odp', 'otp', 'dps', 'dpt', 'fodp'].indexOf(ext) >= 0) {
        return 'ppt';
    }
    if (['pdf', 'djvu', 'xps', 'oxps'].indexOf(ext) >= 0) {
        return 'pdf';
    }
    return 'file';
}

/** 文件在列表里的图标（用图形字符，免引入图片资源） */
export function fileIconOf(file) {
    if (isFolder(file)) {
        return {icon: '📁', cls: 'folder'};
    }
    const name = (file && file.name) || '';
    const idx = name.lastIndexOf('.');
    const ext = idx > 0 ? name.substring(idx + 1).toLowerCase() : '';
    if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg', 'heic'].indexOf(ext) >= 0) {
        return {icon: '🖼', cls: 'image'};
    }
    if (['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv', 'm4v'].indexOf(ext) >= 0) {
        return {icon: '🎬', cls: 'video'};
    }
    if (['mp3', 'wav', 'amr', 'aac', 'flac', 'ogg', 'm4a'].indexOf(ext) >= 0) {
        return {icon: '🎵', cls: 'audio'};
    }
    const kind = onlineDocKind(name);
    if (kind === 'word') {
        return {icon: 'W', cls: 'word'};
    }
    if (kind === 'excel') {
        return {icon: 'X', cls: 'excel'};
    }
    if (kind === 'ppt') {
        return {icon: 'P', cls: 'ppt'};
    }
    if (kind === 'pdf') {
        return {icon: '📕', cls: 'pdf'};
    }
    if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].indexOf(ext) >= 0) {
        return {icon: '🗜', cls: 'archive'};
    }
    if (['exe', 'dmg', 'apk', 'msi', 'deb', 'rpm'].indexOf(ext) >= 0) {
        return {icon: '⚙', cls: 'exe'};
    }
    if (['xml', 'json', 'yml', 'yaml', 'ini', 'conf', 'log'].indexOf(ext) >= 0) {
        return {icon: '📃', cls: 'text'};
    }
    return {icon: '📄', cls: 'file'};
}

export function formatPanSize(bytes) {
    const n = Number(bytes || 0);
    if (!(n > 0)) {
        return '0 B';
    }
    if (n >= 1073741824) {
        return (n / 1073741824).toFixed(1) + ' GB';
    }
    if (n >= 1048576) {
        return (n / 1048576).toFixed(1) + ' MB';
    }
    if (n >= 1024) {
        return (n / 1024).toFixed(1) + ' KB';
    }
    return n + ' B';
}

/** 列表里的时间：今天只写时分，昨天、更早按日期 */
export function formatPanTime(value, t) {
    if (!value) {
        return '';
    }
    const date = new Date(String(value).replace(' ', 'T'));
    if (isNaN(date.getTime())) {
        return String(value);
    }
    const pad = (n) => (n < 10 ? '0' : '') + n;
    const now = new Date();
    const hm = pad(date.getHours()) + ':' + pad(date.getMinutes());
    if (date.toDateString() === now.toDateString()) {
        return hm;
    }
    const yesterday = new Date(now.getTime() - 86400000);
    if (date.toDateString() === yesterday.toDateString()) {
        const text = t ? t('pan.yesterday') : '';
        return (text && text !== 'pan.yesterday' ? text : '昨天') + ' ' + hm;
    }
    if (date.getFullYear() === now.getFullYear()) {
        return (date.getMonth() + 1) + '月' + date.getDate() + '日';
    }
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
}

/** 同名时按「名字(1).ext」找第一个没被占用的名字 */
export function uniqueFileName(name, existingNames) {
    const used = new Set((existingNames || []).map((n) => String(n || '').toLowerCase()));
    const original = name || '未命名';
    if (!used.has(original.toLowerCase())) {
        return original;
    }
    const dot = original.lastIndexOf('.');
    const base = dot > 0 ? original.substring(0, dot) : original;
    const ext = dot > 0 ? original.substring(dot) : '';
    for (let i = 1; i < 10000; i++) {
        const candidate = base + '(' + i + ')' + ext;
        if (!used.has(candidate.toLowerCase())) {
            return candidate;
        }
    }
    return base + '(' + Date.now() + ')' + ext;
}

const MIME_TYPES = {
    png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp',
    bmp: 'image/bmp', svg: 'image/svg+xml',
    mp4: 'video/mp4', mov: 'video/quicktime', avi: 'video/x-msvideo', mkv: 'video/x-matroska',
    mp3: 'audio/mpeg', wav: 'audio/wav', amr: 'audio/amr', m4a: 'audio/mp4', aac: 'audio/aac',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    pdf: 'application/pdf', txt: 'text/plain', csv: 'text/csv', json: 'application/json',
    xml: 'text/xml', html: 'text/html', zip: 'application/zip', rar: 'application/vnd.rar',
    '7z': 'application/x-7z-compressed',
};

export function mimeTypeOf(name) {
    const idx = (name || '').lastIndexOf('.');
    if (idx <= 0) {
        return 'application/octet-stream';
    }
    return MIME_TYPES[name.substring(idx + 1).toLowerCase()] || 'application/octet-stream';
}

// ------------------------------------------------------------------ 打开 / 下载

export function openExternal(url) {
    if (!url) {
        return;
    }
    window.open(url, '_blank', 'noopener');
}

/** 打开签名下载地址：交给浏览器新窗口（Electron 里由 shell 接管） */
export function downloadByUrl(url, name) {
    if (!url) {
        return;
    }
    const link = document.createElement('a');
    link.href = url;
    if (name) {
        link.download = name;
    }
    link.target = '_blank';
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
}

export function isOnlineDocName(name) {
    return panApi.isOnlineDocName(name);
}

// ------------------------------------------------------------------ 上传 / 存到网盘

function readFileMd5(file) {
    return new Promise((resolve) => {
        try {
            const reader = new FileReader();
            reader.onload = () => {
                try {
                    resolve(md5Hex(reader.result));
                } catch (e) {
                    resolve('');
                }
            };
            reader.onerror = () => resolve('');
            reader.readAsArrayBuffer(file);
        } catch (e) {
            resolve('');
        }
    });
}

/**
 * 先用 IM 的媒体上传把文件放到对象存储（拿 storageUrl），再在网盘里建记录。
 * 上传成功返回网盘文件记录。
 */
export function uploadPanFile(file, spaceId, parentId = 0, onProgress = null) {
    return new Promise((resolve, reject) => {
        readFileMd5(file).then((md5) => {
            wfc.uploadMedia(file.name, file, MessageContentMediaType.File,
                (storageUrl) => {
                    panApi.createFile({
                        spaceId,
                        parentId: parentId > 0 ? parentId : null,
                        name: file.name,
                        size: file.size,
                        mimeType: file.type || mimeTypeOf(file.name),
                        md5,
                        storageUrl,
                        copy: false,
                    }).then(resolve).catch(reject);
                },
                (err) => reject(new Error('上传失败: ' + err)),
                (uploaded, total) => {
                    if (onProgress && total > 0) {
                        onProgress(uploaded / total);
                    }
                });
        });
    });
}

/** 我的私有空间（没有私有就退回第一个可写的空间） */
export async function getMyPrivateSpace() {
    let spaces = await panApi.getMySpaces();
    if (!spaces || !spaces.length) {
        spaces = await panApi.getSpaces();
    }
    const list = spaces || [];
    return list.find((s) => spaceTypeOf(s) === SPACE_TYPE.USER_PRIVATE)
        || list.find((s) => canWriteSpace(s))
        || list[0]
        || null;
}

/**
 * 把一条已经在对象存储里的文件（聊天文件消息、上传结果）存进网盘。
 * copy=true 让服务端把物理文件拷进网盘 bucket —— 否则公开读的媒体桶地址会绕过网盘权限。
 * 目标目录里同名时自动改名，返回新建的文件记录。
 */
export async function saveStorageUrlToPan({name, size, mimeType, md5, storageUrl, spaceId = 0, parentId = 0}) {
    let targetSpaceId = spaceId;
    if (!targetSpaceId) {
        const space = await getMyPrivateSpace();
        if (!space) {
            throw new Error('没有可用的网盘空间');
        }
        targetSpaceId = space.id;
    }
    const parent = parentId > 0 ? parentId : 0;
    const files = await panApi.getSpaceFiles(targetSpaceId, parent);
    const finalName = uniqueFileName(name || '未命名文件', (files || []).map((f) => f.name));
    return panApi.createFile({
        spaceId: targetSpaceId,
        parentId: parent > 0 ? parent : null,
        name: finalName,
        size: size || 0,
        mimeType: mimeType || mimeTypeOf(finalName),
        md5: md5 || '',
        storageUrl,
        copy: true,
    });
}

/** 取文件的签名地址并打开（下载 / 交给系统打开） */
export async function downloadPanFile(file) {
    const res = await panApi.getDownloadUrl(file.id);
    downloadByUrl(res && res.storageUrl, file.name);
    return res;
}

// ------------------------------------------------------------------ 群列表（选群分享用）

export function loadMyGroups() {
    return new Promise((resolve) => {
        wfc.getMyGroups((groupIds) => {
            const groups = (groupIds || []).map((gid) => {
                let name = gid;
                try {
                    const info = wfc.getGroupInfo(gid);
                    if (info && info.name) {
                        name = info.name;
                    }
                } catch (e) {
                    // 群信息没缓存就用群 ID
                }
                return {gid, name};
            });
            resolve(groups);
        }, () => resolve([]));
    });
}

// ------------------------------------------------------------------ 文档页面桥（宿主侧）

/**
 * 在线文档 H5 页面（PAN_SERVER/doc/）在浏览器里通过 postMessage 找宿主：
 *   页面 → 宿主 {__panBridge:true, type:'call'|'listen', id, method, data}
 *   宿主 → 页面 {__panBridge:true, type:'reply', id, code, data} / {type:'notify', method, data}
 * 认证码不放消息里：宿主把它拼在 URL 的 #panAuthCode= 片段上，页面读完立刻抹掉。
 *
 * @param {function(): Window} getSource 返回承载页面的窗口（iframe 的 contentWindow 或弹窗）
 * @param {object} callbacks onToast/openUrl/downloadFile/chooseContacts/chooseGroup/onClose/onListen
 * @returns {function()} 注销监听
 */
export function registerPanBridge(getSource, callbacks = {}) {
    const reply = (id, code, data) => {
        const target = getSource && getSource();
        if (!target) {
            return;
        }
        try {
            target.postMessage({__panBridge: true, type: 'reply', id, code, data}, '*');
        } catch (e) {
            // 窗口已关闭
        }
    };

    const handler = async (event) => {
        const target = getSource && getSource();
        if (!target || event.source !== target) {
            return;
        }
        const message = event.data;
        if (!message || message.__panBridge !== true) {
            return;
        }
        if (message.type === 'listen') {
            callbacks.onListen && callbacks.onListen(message.method, message.data);
            return;
        }
        if (message.type !== 'call') {
            return;
        }
        const data = message.data || {};
        try {
            switch (message.method) {
                case 'getAuthCode': {
                    const authCode = await getPanAuthCode();
                    reply(message.id, 0, authCode);
                    break;
                }
                case 'openUrl': {
                    const url = typeof data === 'string' ? data : data.url;
                    if (callbacks.onOpenUrl) {
                        callbacks.onOpenUrl(url);
                    } else {
                        openExternal(url);
                    }
                    reply(message.id, 0, null);
                    break;
                }
                case 'downloadFile': {
                    const url = typeof data === 'string' ? data : data.url;
                    if (callbacks.onDownloadFile) {
                        callbacks.onDownloadFile(url);
                    } else {
                        downloadByUrl(url);
                    }
                    reply(message.id, 0, null);
                    break;
                }
                case 'chooseContacts': {
                    if (!callbacks.chooseContacts) {
                        reply(message.id, -1, null);
                        break;
                    }
                    const users = await callbacks.chooseContacts();
                    reply(message.id, users ? 0 : -1, (users || []).map((u) => ({
                        uid: u.uid,
                        name: u.displayName || u.name || u.uid,
                        portrait: u.portrait || '',
                    })));
                    break;
                }
                case 'chooseGroup': {
                    if (!callbacks.chooseGroup) {
                        reply(message.id, -1, null);
                        break;
                    }
                    const groups = await callbacks.chooseGroup();
                    reply(message.id, groups ? 0 : -1, groups || []);
                    break;
                }
                case 'toast': {
                    const text = typeof data === 'string' ? data : (data.msg || data.text || '');
                    callbacks.onToast && callbacks.onToast(text);
                    reply(message.id, 0, null);
                    break;
                }
                case 'close': {
                    reply(message.id, 0, null);
                    callbacks.onClose && callbacks.onClose();
                    break;
                }
                default:
                    reply(message.id, -1, null);
            }
        } catch (e) {
            reply(message.id, -1, null);
        }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
}

/** 把 authCode 拼到文档地址的 fragment 上（不会发到服务端，也不进日志） */
export function withPanAuthCode(url, authCode) {
    if (!authCode) {
        return url;
    }
    const sep = url.indexOf('#') >= 0 ? '&' : '#';
    return url + sep + 'panAuthCode=' + encodeURIComponent(authCode);
}
