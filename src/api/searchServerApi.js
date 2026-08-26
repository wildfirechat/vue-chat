import axios from "axios";
import Config from "../config";
import wfc from "../wfc/client/wfc";

/**
 * 服务器搜索服务 API（对应 wf-search-server 项目）
 * 会话内消息搜索：关键字 / 消息类型（透传 int） / 发送人 / 时间范围，游标分页 + 消息上下文。
 *
 * 认证：Web SDK wfc.getAuthCode('admin', 2, host, ...) 获取 authCode → 请求头携带
 */
export class SearchServerApi {

    constructor() {
        this._serviceAvailable = !!Config.getSearchServer();
    }

    get isServiceAvailable() {
        return this._serviceAvailable && !!Config.getSearchServer();
    }

    /**
     * 会话内消息搜索
     *
     * @param {Object} conversation 会话 {type, target, line}；type: 0=单聊 1=群聊
     * @param {Object} options
     * @param {string} [options.keyword] 关键字，空串=按筛选浏览
     * @param {number[]} [options.contentTypes] 消息类型列表（透传 int，空=全部）
     * @param {string} [options.fromUser] 发送人 uid（仅群聊）
     * @param {number} [options.startTime] 时间下界（毫秒）
     * @param {number} [options.endTime] 时间上界（毫秒）
     * @param {string} [options.cursor] 翻页游标，首屏不传
     * @param {number} [options.size] 每页条数
     * @returns {Promise<{total:number, hasMore:boolean, nextCursor:string, truncated:boolean, items:Array}>}
     */
    searchConversationMessages(conversation, options = {}) {
        const data = {
            conversation,
            keyword: options.keyword || '',
            contentTypes: options.contentTypes || [],
            fromUser: options.fromUser || null,
            startTime: options.startTime || null,
            endTime: options.endTime || null,
            cursor: options.cursor || null,
            size: options.size || 20,
        };
        return this._post('/api/search/conversation/messages', data);
    }

    /**
     * 消息上下文：以命中消息 mid 为锚点返回 ±N 条及上一处/下一处命中
     *
     * @param {Object} conversation 会话
     * @param {number} anchorMid 锚点消息 mid
     * @param {Object} options
     * @param {number} [options.beforeCount]
     * @param {number} [options.afterCount]
     * @param {string} [options.keyword] 关键字（计算上一处/下一处）
     * @param {number[]} [options.contentTypes]
     * @param {string} [options.fromUser]
     * @param {number} [options.startTime]
     * @param {number} [options.endTime]
     * @returns {Promise<{anchorMid:number, messages:Array, prevHitMid:number|null, nextHitMid:number|null}>}
     */
    getMessageContext(conversation, anchorMid, options = {}) {
        const data = {
            conversation,
            anchorMid,
            // 注意：不能用 || 默认值（beforeCount/afterCount 可能为 0，0 || N = N）
            beforeCount: options.beforeCount !== undefined && options.beforeCount !== null ? options.beforeCount : 10,
            afterCount: options.afterCount !== undefined && options.afterCount !== null ? options.afterCount : 5,
            keyword: options.keyword || '',
            contentTypes: options.contentTypes || [],
            fromUser: options.fromUser || null,
            startTime: options.startTime || null,
            endTime: options.endTime || null,
        };
        return this._post('/api/search/conversation/messages/context', data);
    }

    /**
     * 通用 POST：获取 authCode → 请求头携带 → 校验 Result.code
     */
    async _post(path, data = {}) {
        let baseUrl = Config.getSearchServer();
        if (!baseUrl) {
            throw new Error('Search server not configured');
        }
        let host = baseUrl.replace(/^https?:\/\//, '').split('/')[0];

        // [DEBUG] 请求参数（anchorMid 为字符串，防 64 位精度丢失）
        console.log('[SearchApi] POST', path, 'req=', JSON.stringify(data));

        return new Promise((resolve, reject) => {
            wfc.getAuthCode('admin', 2, host, async (authCode) => {
                try {
                    let response = await axios.post(baseUrl + path, data, {
                        headers: {
                            'authCode': authCode,
                        },
                        withCredentials: false,
                    });
                    if (response.data) {
                        // [DEBUG] 响应摘要
                        let summary = response.data && response.data.data
                            ? JSON.stringify({
                                total: response.data.data.total,
                                items: response.data.data.items ? response.data.data.items.length : undefined,
                                messages: response.data.data.messages ? response.data.data.messages.length : undefined,
                                anchorMid: response.data.data.anchorMid,
                                prevHitMid: response.data.data.prevHitMid,
                                nextHitMid: response.data.data.nextHitMid,
                                hasMore: response.data.data.hasMore,
                            })
                            : String(response.data.code);
                        console.log('[SearchApi] POST', path, 'resp code=', response.data.code, 'summary=', summary);
                        if (response.data.code === 0) {
                            resolve(response.data.data);
                        } else {
                            reject(new Error(response.data.message));
                        }
                    } else {
                        reject(new Error('request error, status code: ' + response.status));
                    }
                } catch (e) {
                    console.error('[SearchApi] POST', path, 'error=', e && e.message ? e.message : e);
                    reject(e);
                }
            }, (err) => {
                console.error('[SearchApi] getAuthCode failed:', err);
                reject(new Error("Failed to get auth code: " + err));
            });
        });
    }
}

export default new SearchServerApi();
