import axios from "axios";
import Config from "../config";
import wfc from "../wfc/client/wfc";
import AppServerError from "./appServerError";

/**
 * 网盘 / 在线文档客户端接口。
 *
 * 对接 wf-pan-server 的客户端端口：接口在 `{PAN_SERVER}/api/v1/**` 下，
 * 鉴权与接龙/投票一致 —— 用 IM 的 authCode 放在请求头 `authCode`（见服务端 ClientAuthFilter）。
 * 响应信封为 `{code, message, data}`。
 *
 * 未配置 `Config.PAN_SERVER` 时，所有入口都不应展示（见 Config.isPanEnabled）。
 */
export class PanApi {

    // ---------------------------------------------------------------- 基础

    get baseUrl() {
        const base = Config.getPanServer();
        if (!base) {
            throw new AppServerError(-1, '网盘服务未配置');
        }
        return base.endsWith('/') ? base.substring(0, base.length - 1) : base;
    }

    /** 在线文档 H5 页面根地址（服务端自带），带 /doc/ 尾斜杠 */
    get docBase() {
        return `${this.baseUrl}/doc/`;
    }

    /** 打开网盘文件（编辑/只读由服务端按权限与平台决定） */
    docOpenUrl(fileId) {
        return `${this.docBase}open?fileId=${fileId}`;
    }

    /** 按链接只读打开在线文档：文件不在网盘里（聊天文件消息、外部地址） */
    docViewUrl(url, name) {
        const query = [`url=${encodeURIComponent(url)}`];
        if (name) {
            query.push(`name=${encodeURIComponent(name)}`);
        }
        return `${this.docBase}open?${query.join('&')}`;
    }

    docLicensesUrl() {
        return `${this.docBase}licenses.html`;
    }

    /** 是不是在线文档页面地址：这类页面靠客户端桥取 authCode，必须用内置网页打开 */
    isDocUrl(url) {
        if (!url) {
            return false;
        }
        return url.startsWith(this.docBase) || url.indexOf('/doc/open') >= 0;
    }

    /** 在线文档能打开的格式，与服务端 DocsService 的 WORD/CELL/SLIDE/PDF 四组一致 */
    static ONLINE_DOC_EXTENSIONS = new Set([
        'doc', 'docx', 'docm', 'dot', 'dotx', 'dotm', 'odt', 'ott', 'rtf', 'txt',
        'wps', 'wpt', 'fodt', 'mht', 'mhtml', 'htm', 'html', 'epub', 'fb2',
        'xls', 'xlsx', 'xlsm', 'xlt', 'xltx', 'xltm', 'xlsb', 'ods', 'ots', 'csv',
        'et', 'ett', 'fods',
        'ppt', 'pptx', 'pptm', 'pot', 'potx', 'potm', 'pps', 'ppsx', 'ppsm',
        'odp', 'otp', 'dps', 'dpt', 'fodp',
        'pdf', 'djvu', 'xps', 'oxps',
    ]);

    /** 文件名是不是「在线文档」格式（聊天里的文件消息没有 fileId，只能按扩展名判断） */
    isOnlineDocName(name) {
        if (!name) {
            return false;
        }
        const idx = name.lastIndexOf('.');
        if (idx <= 0 || idx === name.length - 1) {
            return false;
        }
        return PanApi.ONLINE_DOC_EXTENSIONS.has(name.substring(idx + 1).toLowerCase());
    }

    async _post(path, data = {}) {
        const base = this.baseUrl;
        const host = base.replace(/^https?:\/\//, '').split('/')[0];
        const authCode = await new Promise((resolve, reject) => {
            wfc.getAuthCode('admin', 2, host,
                (code) => resolve(code),
                (err) => reject(new AppServerError(err || -1, '获取 authCode 失败')));
        });
        const response = await axios.post(base + '/api/v1' + path, data, {
            headers: {'authCode': authCode},
            withCredentials: false,
        });
        if (response.data) {
            if (response.data.code === 0) {
                return response.data.data;
            }
            throw new AppServerError(response.data.code, response.data.message);
        }
        throw new Error('request error, status code: ' + response.status);
    }

    // ---------------------------------------------------------------- 空间

    getSpaces() {
        return this._post('/spaces/list');
    }

    getMySpaces() {
        return this._post('/spaces/my');
    }

    getUserPublicSpace(targetUserId) {
        return this._post('/spaces/user/public', {targetUserId});
    }

    getSpaceFiles(spaceId, parentId = 0) {
        return this._post('/spaces/files', {spaceId, parentId});
    }

    checkSpaceWritePermission(spaceId) {
        return this._get('/permission/space/' + spaceId + '/write');
    }

    async _get(path) {
        const base = this.baseUrl;
        const host = base.replace(/^https?:\/\//, '').split('/')[0];
        const authCode = await new Promise((resolve, reject) => {
            wfc.getAuthCode('admin', 2, host,
                (code) => resolve(code),
                (err) => reject(new AppServerError(err || -1, '获取 authCode 失败')));
        });
        const response = await axios.get(base + '/api/v1' + path, {
            headers: {'authCode': authCode},
            withCredentials: false,
        });
        if (response.data) {
            if (response.data.code === 0) {
                return response.data.data;
            }
            throw new AppServerError(response.data.code, response.data.message);
        }
        throw new Error('request error, status code: ' + response.status);
    }

    // ---------------------------------------------------------------- 文件

    createFolder(spaceId, name, parentId = 0) {
        return this._post('/files/folder', {
            spaceId,
            parentId: parentId > 0 ? parentId : null,
            name,
        });
    }

    createFile(params) {
        // params: {spaceId, parentId, name, size, mimeType, md5, storageUrl, copy}
        return this._post('/files', params);
    }

    deleteFile(fileId) {
        return this._post('/files/delete', {fileId});
    }

    renameFile(fileId, newName) {
        return this._post('/files/rename', {fileId, newName});
    }

    moveFile(fileId, targetSpaceId, targetParentId) {
        return this._post('/files/move', {fileId, targetSpaceId, targetParentId});
    }

    copyFile(fileId, targetSpaceId, targetParentId, copy = false) {
        return this._post('/files/copy', {fileId, targetSpaceId, targetParentId, copy});
    }

    getDownloadUrl(fileId, versionNo = null) {
        const params = {fileId};
        if (versionNo) {
            params.versionNo = versionNo;
        }
        return this._post('/files/url', params);
    }

    // ---------------------------------------------------------------- 分享

    listShares(fileId) {
        return this._post('/shares/list', {fileId});
    }

    addShare(fileId, targetType, targetId, permission = 'VIEW') {
        return this._post('/shares/add', {fileId, targetType, targetId, permission});
    }

    removeShare(shareId) {
        return this._post('/shares/remove', {shareId});
    }

    sharedWithMe() {
        return this._post('/shares/with-me');
    }

    // ---------------------------------------------------------------- 版本

    listVersions(fileId) {
        return this._post('/versions/list', {fileId});
    }

    restoreVersion(fileId, versionNo) {
        return this._post('/versions/restore', {fileId, versionNo});
    }

    // ---------------------------------------------------------------- 在线文档

    createDoc(type, name, spaceId = null, parentId = null) {
        const params = {type, name};
        if (spaceId) {
            params.spaceId = spaceId;
        }
        if (parentId) {
            params.parentId = parentId;
        }
        return this._post('/docs/create', params);
    }

    docsOptions() {
        return this._post('/docs/options');
    }

    recentDocs() {
        return this._post('/docs/recent');
    }

    removeRecentDoc(fileId) {
        return this._post('/docs/recent/remove', {fileId});
    }

    convertDoc(fileId) {
        return this._post('/docs/convert', {fileId});
    }
}

const panApi = new PanApi();
export default panApi;
