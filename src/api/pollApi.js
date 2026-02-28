import axios from "axios";
import Config from "../config";
import wfc from "../wfc/client/wfc";

/**
 * 投票 API 服务
 * 对应 Android 的 PollService 接口
 */
export class PollApi {

    _groupIdPayload(groupId) {
        return groupId ? {groupId} : {};
    }

    /**
     * 创建投票
     *
     * @param {string} groupId 群ID
     * @param {string} title 标题
     * @param {string} description 描述
     * @param {string[]} options 选项列表
     * @param {number} visibility 可见性: 1=仅群内, 2=公开
     * @param {number} type 类型: 1=单选, 2=多选
     * @param {number} maxSelect 多选时最多选几项
     * @param {number} anonymous 是否匿名: 0=实名, 1=匿名
     * @param {number} endTime 截止时间（毫秒时间戳，0表示无截止时间）
     * @param {number} showResult 是否始终显示结果: 0=投票前隐藏, 1=始终显示
     * @returns {Promise<Object>} 投票对象
     */
    createPoll(groupId, title, description, options, visibility, type, maxSelect, anonymous, endTime, showResult) {
        return this._post('/api/polls', {
            groupId,
            title,
            description,
            options,
            visibility,
            type,
            maxSelect,
            anonymous,
            endTime,
            showResult
        });
    }

    /**
     * 获取投票详情
     *
     * @param {number} pollId 投票ID
     * @param {string} groupId 群ID（可选）
     * @returns {Promise<Object>} 投票详情
     */
    getPoll(pollId, groupId) {
        return this._post(`/api/polls/${pollId}`, this._groupIdPayload(groupId));
    }

    /**
     * 参与投票
     *
     * @param {number} pollId 投票ID
     * @param {string} groupId 群ID（可选）
     * @param {number[]} optionIds 选项ID列表
     * @returns {Promise<void>}
     */
    vote(pollId, groupId, optionIds) {
        return this._post(`/api/polls/${pollId}/vote`, {
            ...this._groupIdPayload(groupId),
            optionIds
        });
    }

    /**
     * 结束投票（仅创建者）
     *
     * @param {number} pollId 投票ID
     * @param {string} groupId 群ID（可选）
     * @returns {Promise<void>}
     */
    closePoll(pollId, groupId) {
        return this._post(`/api/polls/${pollId}/close`, this._groupIdPayload(groupId));
    }

    /**
     * 删除投票（仅创建者）
     *
     * @param {number} pollId 投票ID
     * @param {string} groupId 群ID（可选）
     * @returns {Promise<void>}
     */
    deletePoll(pollId, groupId) {
        return this._post(`/api/polls/${pollId}/delete`, this._groupIdPayload(groupId));
    }

    /**
     * 导出投票明细（仅实名投票创建者）
     *
     * @param {number} pollId 投票ID
     * @param {string} groupId 群ID（可选）
     * @returns {Promise<Object[]>} 投票人详情列表
     */
    exportPollDetails(pollId, groupId) {
        return this._post(`/api/polls/${pollId}/export`, this._groupIdPayload(groupId));
    }

    /**
     * 获取我的投票列表
     *
     * @returns {Promise<Object[]>} 投票列表
     */
    getMyPolls() {
        return this._post('/api/polls/my', {});
    }

    async _post(path, data = {}) {
        let baseUrl = Config.POLL_SERVER;
        if (!baseUrl) {
            throw new Error('Poll server not configured');
        }
        // extract host for auth code
        let host = baseUrl.replace(/^https?:\/\//, '').split('/')[0];

        return new Promise((resolve, reject) => {
            wfc.getAuthCode('poll', 2, host, async (authCode) => {
                try {
                    let response = await axios.post(baseUrl + path, data, {
                        headers: {
                            'authCode': authCode,
                        },
                        withCredentials: false,
                    });
                    if (response.data) {
                        if (response.data.code === 0) {
                            resolve(response.data.data);
                        } else {
                            reject(new Error(response.data.message));
                        }
                    } else {
                        reject(new Error('request error, status code: ' + response.status));
                    }
                } catch (e) {
                    reject(e);
                }
            }, (err) => {
                reject(new Error("Failed to get auth code: " + err));
            });
        });
    }
}

const pollApi = new PollApi();
export default pollApi;
