import axios from "axios";
import {getItem, setItem} from "../ui/util/storageHelper";
import Config from "../config";
import FavItem from "../wfc/model/favItem";
import {stringValue} from "../wfc/util/longUtil";
import AppServerError from "./appServerError";
import wfc from "../wfc/client/wfc";
import ConnectionStatus from "../wfc/client/connectionStatus";

export class AppServerApi {
    constructor() {
    }

    async _getAppServer() {
        if (!Config.APP_BACKUP_SERVER) {
            return Config.APP_SERVER;
        }
        // IM 已连接时，直接用 wfc 的网络状态判断
        if (wfc.getConnectionStatus() === ConnectionStatus.ConnectionStatusConnected) {
            return wfc.connectedToMainNetwork() ? Config.APP_SERVER : Config.APP_BACKUP_SERVER;
        }

        // IM 未连接时（登录前），实时探测，不缓存
        const probe = async (url) => {
            let response = await axios.get(url, {
                transformResponse: [data => data],
                timeout: 5000,
            });
            if (response.data === 'Ok') {
                return url;
            }
            throw new Error('app server probe invalid response: ' + response.data);
        };

        let reachableUrl = await Promise.any([
            probe(Config.APP_SERVER),
            probe(Config.APP_BACKUP_SERVER)
        ]).catch((e) => {
            console.log('all app server probes failed', e);
            return null;
        });

        if (!reachableUrl) {
            // 都探测失败时，回退到主地址，让后续请求正常报错
            reachableUrl = Config.APP_SERVER;
        }
        return reachableUrl;
    }

    requestAuthCode(mobile, slideVerifyToken = null) {
        let params = {mobile};
        if (slideVerifyToken) {
            params.slideVerifyToken = slideVerifyToken;
        }
        return this._post('/send_code', params)
    }

    loinWithPassword(mobile, password, slideVerifyToken = null) {
        return new Promise((resolve, reject) => {
            let params = {
                mobile,
                password,
                platform: Config.getWFCPlatform(),
                clientId: wfc.getClientId()
            };
            if (slideVerifyToken) {
                params.slideVerifyToken = slideVerifyToken;
            }
            let responsePromise = this._post('/login_pwd', params, true)
            this._interceptLoginResponse(responsePromise, resolve, reject)
        })
    }

    loginWithAuthCode(mobile, authCode, slideVerifyToken = null) {
        return new Promise((resolve, reject) => {
            let params = {
                mobile,
                code: authCode,
                platform: Config.getWFCPlatform(),
                clientId: wfc.getClientId()
            };
            if (slideVerifyToken) {
                params.slideVerifyToken = slideVerifyToken;
            }
            let responsePromise = this._post('/login', params, true);
            this._interceptLoginResponse(responsePromise, resolve, reject)
        })
    }


    createPCSession(userId) {
        return this._post('/pc_session', {
            flag: 1,
            device_name: 'pc',
            userId: userId,
            clientId: wfc.getClientId(),
            platform: Config.getWFCPlatform()
        })
    }

    // 扫码登录
    loginWithPCSession(appToken) {
        const _interceptPCSessionLoginResponse = (responsePromise, resolve, reject) => {
            responsePromise
                .then(response => {
                    if (response.data.code === 0) {
                        let appAuthToken = response.headers['authtoken'];
                        if (!appAuthToken) {
                            appAuthToken = response.headers['authToken'];
                        }

                        if (appAuthToken) {
                            setItem('authToken-' + new URL(response.config.url).host, appAuthToken);
                        }
                        resolve(response.data);
                    } else if ([9, 18].indexOf(response.data.code) > -1) {
                        resolve(response.data);
                    } else {
                        reject(new AppServerError(response.data.code, response.data.message));
                    }
                })
                .catch(err => {
                    reject(err);
                })
        }

        return new Promise((resolve, reject) => {
            let responsePromise = this._post(`/session_login/${appToken}`, null, true);
            _interceptPCSessionLoginResponse(responsePromise, resolve, reject)
        })
    }

    changePassword(oldPassword, newPassword, slideVerifyToken = null) {
        let params = {
            oldPassword,
            newPassword
        };
        if (slideVerifyToken) {
            params.slideVerifyToken = slideVerifyToken;
        }
        return this._post('/change_pwd', params)
    }

    requestResetPasswordAuthCode() {
        return this._post('/send_reset_code')
    }

    resetPassword(resetPasswordAuthCode, newPassword) {
        return this._post('/reset_pwd', {
            resetCode: resetPasswordAuthCode,
            newPassword: newPassword,
        })
    }

    getGroupAnnouncement(groupId) {
        return this._post('/get_group_announcement', {groupId: groupId})
    }

    updateGroupAnnouncement(author, groupId, announcement) {
        return this._post('/put_group_announcement', {
            author,
            groupId,
            text: announcement
        })
    }

    favMessage(message) {
        let favItem = FavItem.fromMessage(message);
        return this._post('/fav/add', {
            messageUid: stringValue(favItem.messageUid),
            type: favItem.favType,
            convType: favItem.conversation.type,
            convTarget: favItem.conversation.target,
            convLine: favItem.conversation.line,
            origin: favItem.origin,
            sender: favItem.sender,
            title: favItem.title,
            url: favItem.url,
            thumbUrl: favItem.thumbUrl,
            data: favItem.data,
        });
    }

    getFavList(startId, count = 20) {
        return this._post('/fav/list', {id: startId, count: count}, false, true)
    }

    delFav(favItemId) {
        return this._post('/fav/del/' + favItemId, '')
    }

    // 滑动验证相关 API
    getSlideVerify() {
        return this._post('/slide_verify/generate', {}, false, false)
    }

    verifySlide(token, x) {
        // 模仿 iOS，检查 code === 0 判断成功，不关心 result
        return this._post('/slide_verify/verify', {
            token: token,
            x: x
        }, false, true)
    }

    _interceptLoginResponse(responsePromise, resolve, reject) {
        responsePromise
            .then(response => {
                if (response.data.code === 0) {
                    let appAuthToken = response.headers['authtoken'];
                    if (!appAuthToken) {
                        appAuthToken = response.headers['authToken'];
                    }

                    if (appAuthToken) {
                        setItem('authToken-' + new URL(response.config.url).host, appAuthToken);
                    }
                    resolve(response.data.result);
                } else {
                    reject(new AppServerError(response.data.code, response.data.message));
                }
            })
            .catch(err => {
                reject(err);
            })
    }

    /**
     *
     * @param path
     * @param data
     * @param rawResponse
     * @param rawResponseData
     * @return {Promise<string | AxiosResponse<any>|*|T>}
     * @private
     */
    async _post(path, data = {}, rawResponse = false, rawResponseData = false) {
        let response;
        path = await this._getAppServer() + path;
        response = await axios.post(path, data, {
            transformResponse: rawResponseData ? [data => data] : axios.defaults.transformResponse,
            headers: {
                'authToken': getItem('authToken-' + new URL(path).host),
            },
            withCredentials: false,
        })
        if (rawResponse) {
            return response;
        }
        if (response.data) {
            if (rawResponseData) {
                return response.data;
            }
            if (response.data.code === 0) {
                return response.data.result
            } else {
                throw new AppServerError(response.data.code, response.data.message)
            }
        } else {
            throw new Error('request error, status code: ' + response.status)
        }
    }
}

const appServerApi = new AppServerApi();
export default appServerApi;
