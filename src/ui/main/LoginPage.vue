<template>
    <div>
        <div class="login-container">
            <ElectronWindowsControlButtonView style="position: absolute; top: 0; right: 0"
                                              :maximizable="false"
                                              v-if="sharedMiscState.isElectronWindowsOrLinux"/>

            <div class="drag-area"/>
            <div v-if="loginType === 0" class="qrcode-login-container">
                <div class="qr-container" @click="regenerateQrCode">
                    <p v-if="qrCode === 'error'">生成二维码失败，点击重试<br>开发者请打开控制台查看日志</p>
                    <img v-else-if="qrCode" v-bind:src="qrCode" alt="">
                    <p v-else>{{ $t('misc.gen_qr_code') }}</p>
                    <ClipLoader v-if="loginStatus === 4" class="loading" :color="'white'" :height="'80px'" :width="'80px'"/>
                </div>
                <!--    等待扫码-->
                <div v-if="loginStatus === 0" class="pending-scan">
                    <p style="font-size: 20px; color: #353535; padding-bottom: 10px">{{ $t('login.desc') }}</p>
                    <p style="font-size: 15px; color: #a3a3a3">{{ $t('login.tip_web') }}</p>
                    <p style="font-size: 15px; color: #a3a3a3; padding-bottom: 5px">{{ $t('login.warning') }}</p>
                    <a style="font-size: 15px; color: #4168e0" target="_blank" href="https://static.wildfirechat.net/download_qrcode.png">点击下载野火IM移动端</a>
                </div>
                <!--    已经扫码-->
                <div v-else-if="loginStatus === 1" class="scanned">
                    <p>{{ userName + $t('login.scan_qr_success') }}</p>
                    <p>{{ $t('login.confirm_login_tip') }}</p>
                    <label style="display: none">
                        {{ $t('login.remember_me') }}
                        <input type="checkbox" v-model="enableAutoLogin">
                    </label>
                    <button @click="cancel" class="button-cancel">{{ $t('login.cancel_login') }}</button>
                </div>

                <!--    存在session，等待发送给客户端验证-->
                <div v-if="loginStatus === 2" class="pending-quick-login">
                    <button @click="sendQuickLoginRequest" class="button-confirm">{{ $t('login.login') }}</button>
                    <button @click="cancel" class="button-cancel">{{ $t('login.switch_user') }}</button>
                </div>

                <!--    已经发送登录请求-->
                <div v-else-if="loginStatus === 3" class="quick-logining">
                    <p>{{ $t('login.confirm_login_tip') }}</p>
                    <button @click="cancel" class="button-cancel">{{ $t('login.cancel_login') }}</button>
                </div>

                <!--      开发调试时，自动登录-->
                <div v-else-if="loginStatus === 4">
                    <p>数据同步中，可能需要数分钟...</p>
                </div>
            </div>
            <div v-else-if="loginType === 1" class="login-form-container">
                <!--            密码登录-->
                <img class="logo" :src="require(`@/assets/images/icon.png`)" alt="">
                <p class="title">密码登录</p>
                <div class="item">
                    <input v-model.trim="mobile" class="text-input" type="number" placeholder="请输入手机号">
                </div>
                <div class="item">
                    <input v-model.trim="password" class="text-input" @keydown.enter="loginWithPassword" type="password" placeholder="请输入密码">
                </div>
                <div v-if="loginStatus === 0" style="display: flex; justify-content: space-between; width: 100%; ">
                    <p class="tip" @click="switchLoginType(2)">使用验证码登录</p>
                    <p class="tip" @click="register">注册</p>
                </div>
                <button class="login-button" :disabled="mobile === '' || !password || password === ''" ref="loginWithPasswordButton" @click="loginWithPassword">{{ loginStatus === 3 ? '数据同步中，可能需要数分钟...' : '登录' }}</button>
                <ClipLoader v-if="loginStatus === 3" class="syncing" :color="'#4168e0'" :height="'80px'" :width="'80px'"/>
            </div>
            <div v-else class="login-form-container">
                <!--            验证码登录-->
                <img class="logo" :src="require(`@/assets/images/icon.png`)" alt="">
                <p class="title">验证码登录</p>
                <div class="item">
                    <input v-model.trim="mobile" class="text-input" type="number" placeholder="请输入手机号">
                </div>
                <div class="item">
                    <input v-model.trim="authCode" class="text-input" type="number" placeholder="验证码">
                    <button :disabled="mobile.toString().length !== 11" class="request-auth-code-button" @keydown.enter="loginWithAuthCode" @click="requestAuthCode">获取验证码</button>
                </div>
                <p v-if="loginStatus === 0" class="tip" @click="switchLoginType(1)">使用密码登录</p>
                <button class="login-button" :disabled="mobile === '' || authCode === ''" ref="loginWithAuthCodeButton" @click="loginWithAuthCode">{{ loginStatus === 3 ? '数据同步中，可能需要数分钟...' : '登录' }}</button>
                <ClipLoader v-if="loginStatus === 3" style="margin-top: 10px" class="syncing" :color="'4168e0'" :height="'80px'" :width="'80px'"/>
            </div>
            <div v-if="loginStatus === 0" class="switch-login-type-container">
                <p class="tip" @click="switchLoginType( loginType === 0 ? 1 : 0)">{{ loginType === 0 ? '使用密码/验证码登录' : '扫码登录' }}</p>
            </div>
            <p class="diagnose" @click="diagnose">诊断</p>
        </div>

        <div v-if="showDiagnoseOverlay" class="diagnose-overlay">
            <div class="diagnose-content">
                <pre>{{ diagnoseResult }}</pre>
                <button @click="closeDiagnoseOverlay">关闭</button>
            </div>
        </div>
    </div>
</template>

<script>
import Config from "../../config";
import wfc from '../../wfc/client/wfc'
import PCSession from "../../wfc/model/pcsession";
import jrQRCode from 'jr-qrcode'
import ClipLoader from 'vue-spinner/src/ClipLoader'
import ConnectionStatus from "../../wfc/client/connectionStatus";
import EventType from "../../wfc/client/wfcEvent";
import {clear, getItem, setItem} from "../util/storageHelper";
import {ipcRenderer, isElectron} from "../../platform";
import store from "../../store";
import ElectronWindowsControlButtonView from "../common/ElectronWindowsControlButtonView.vue";
import IpcEventType from "../../ipcEventType";
import appServerApi from "../../api/appServerApi";
import organizationServerApi from "../../api/organizationServerApi";
import WfcScheme from "../../wfcScheme";
import axios from "axios";
import avenginekit from "../../wfc/av/internal/engine.min";

export default {
    name: 'LoginPage',
    data() {
        return {
            sharedMiscState: store.state.misc,
            qrCode: '',
            userName: '',
            loginStatus: 0, //0 等待扫码，密码登录或验证码登录时，表示等待登录； 1 已经扫码； 2 存在session，等待发送给客户端验证；3 已经发送登录请求，密码登录或验证码登录时，表示登录中 4 调试时，自动登录
            qrCodeTimer: null,
            appToken: '',
            lastAppToken: '',
            loginType: 0, // 0 扫码登录，1 密码登录，2 验证码登录
            enableAutoLogin: Config.ENABLE_AUTO_LOGIN,
            mobile: '',
            password: '',
            authCode: '',
            firstTimeConnect: false,
            diagnoseResult: '',
            showDiagnoseOverlay: false,
        }
    },
    created() {
        wfc.eventEmitter.on(EventType.ConnectionStatusChanged, this.onConnectionStatusChange)

        let userId = getItem('userId');
        let token = getItem('token');
        if (userId) {
            let portrait = getItem("userPortrait");
            this.qrCode = portrait ? portrait : Config.DEFAULT_PORTRAIT_URL;

            let autoLogin = getItem(userId + '-' + 'autoLogin') === '1'
            if (autoLogin && token) {
                this.firstTimeConnect = wfc.connect(userId, token);
                this.loginStatus = 4;
            } else {
                this.loginStatus = 2;
                isElectron() && ipcRenderer.send(IpcEventType.RESIZE_LOGIN_WINDOW);
            }
        } else {
            isElectron() && ipcRenderer.send(IpcEventType.RESIZE_LOGIN_WINDOW);
            this.refreshQrCode();
        }
    },

    beforeUnmount() {
        wfc.eventEmitter.removeListener(EventType.ConnectionStatusChanged, this.onConnectionStatusChange)
    },

    methods: {
        register() {
            this.$notify({
                text: '使用短信验证码登录，将会为您创建账户，请使用短信验证码登录',
                type: 'info'
            });
            this.switchLoginType(2);
        },
        switchLoginType(type) {
            this.loginType = type;
            if (this.loginType === 0) {
                this.refreshQrCode();
            } else {
                if (this.qrCodeTimer) {
                    clearInterval(this.qrCodeTimer);
                    this.qrCodeTimer = 0;
                }

            }
        },

        async requestAuthCode() {
            appServerApi.requestAuthCode(this.mobile)
                .then(response => {
                    this.$notify({
                        text: '发送验证码成功',
                        type: 'info'
                    });
                })
                .catch(err => {
                    this.$notify({
                        title: '发送验证码失败',
                        text: err.message,
                        type: 'error'
                    });
                })
        },

        async loginWithPassword() {
            if (!this.mobile || !this.password) {
                return;
            }

            // 特殊用途，请勿打开
            // 必须在 getClientId 之前调用，createPCLoginSession 会触发调用 getClientId，打开时，需重新设计起逻辑
            // wfc.setAppName('wfc-' + this.mobile);
            this.$refs.loginWithPasswordButton.disabled = true;
            this.loginStatus = 3;
            appServerApi.loinWithPassword(this.mobile, this.password)
                .then(res => {
                    const {userId, token, portrait} = res
                    this.firstTimeConnect = wfc.connect(userId, token);
                    setItem('userId', userId);
                    setItem('token', token);
                    setItem("userPortrait", portrait);
                })
                .catch(err => {
                    console.log('loginWithPassword err', err)
                    this.password = '';
                    this.loginStatus = 0;
                    this.$notify({
                        title: '登录失败',
                        text: err.message,
                        type: 'error'
                    });
                })
        },

        async loginWithAuthCode() {
            if (!this.mobile || !this.authCode) {
                return;
            }

            this.$refs.loginWithAuthCodeButton.disabled = true;
            this.loginStatus = 3;
            //wfc.setAppName('wfc-' + this.mobile);
            appServerApi.loginWithAuthCode(this.mobile, this.authCode)
                .then(res => {
                    const {userId, token, portrait} = res;
                    this.firstTimeConnect = wfc.connect(userId, token);
                    setItem('userId', userId);
                    setItem('token', token);
                    setItem("userPortrait", portrait);
                })
                .catch(err => {
                    this.authCode = '';
                    this.loginStatus = 0;
                    this.$notify({
                        title: '登录失败',
                        text: err.message,
                        type: 'error'
                    });
                })
        },

        regenerateQrCode() {
            if (this.qrCode === 'error') {
                this.qrCode = null;
                this.createPCLoginSession(null);
            }
        },
        async createPCLoginSession(userId) {
            //wfc.setAppName('wfc-' + this.mobile);
            appServerApi.createPCSession(userId)
                .then(response => {
                    let session = Object.assign(new PCSession(), response);
                    this.appToken = session.token;
                    if (!userId || session.status === 0/*服务端pc login session不存在*/) {
                        this.qrCode = jrQRCode.getQrBase64(WfcScheme.QR_CODE_PREFIX_PC_SESSION + session.token);
                    }
                    this.login();
                })
                .catch(err => {
                    console.log('createPCSession error', err);
                    console.log('!!! 如果是 CORS 相关错误，可能是通过 nginx 等代理了 app-server 相关请求，但 nginx 配置错误，请参考 app-server 项目下 nginx 目录下的参考配置 !!!')
                    this.qrCode = 'error';
                    if (this.qrCodeTimer) {
                        clearInterval(this.qrCodeTimer)
                    }
                })
        },

        async refreshQrCode() {
            await this.createPCLoginSession(null);
            if (!this.qrCodeTimer) {
                this.qrCodeTimer = setInterval(() => {
                    if (this.loginStatus === 3) {
                        return;
                    }
                    this.appToken = '';
                    this.loginStatus = 0;
                    this.createPCLoginSession(null);
                }, 60 * 1000);
            }
        },

        async login() {
            this.lastAppToken = this.appToken;
            appServerApi.loginWithPCSession(this.appToken)
                .then(data => {
                    if (data) {
                        switch (data.code) {
                            case 0:
                                if (this.loginStatus === 1 || this.loginStatus === 3) {
                                    let userId = data.result.userId;
                                    let imToken = data.result.token;
                                    wfc.connect(userId, imToken);
                                    this.loginStatus = 4;
                                    setItem('userId', userId);
                                    setItem('token', imToken);
                                }
                                break;
                            case 9:
                                if (data.result.portrait) {
                                    this.qrCode = data.result.portrait;
                                } else {
                                    this.qrCode = Config.DEFAULT_PORTRAIT_URL;
                                }
                                setItem("userName", data.result.userName);
                                setItem("userPortrait", data.result.portrait);

                                if (this.loginStatus === 0) {
                                    this.loginStatus = 1;
                                } else {
                                    this.loginStatus = 3;
                                }
                                this.login();
                                break;
                            case 18:
                                //session is canceled, need clear last time login status
                                this.cancel();
                                break;
                            default:
                                this.lastAppToken = '';
                                console.log(data);
                                break
                        }
                    }
                })
                .catch(err => {
                });
        },

        sendQuickLoginRequest() {
            let userId = getItem("userId");
            this.createPCLoginSession(userId);
            this.loginStatus = 3;
        },

        cancel() {

            this.loginStatus = 0;
            this.qrCode = null;
            // 切换用户时，先进行disconnect
            wfc.disconnect();
            clear();

            this.refreshQrCode();
        },

        onConnectionStatusChange(status) {
            if (status === ConnectionStatus.ConnectionStatusLogout
                || status === ConnectionStatus.ConnectionStatusRejected
                || status === ConnectionStatus.ConnectionStatusSecretKeyMismatch
                || status === ConnectionStatus.ConnectionStatusKickedOff
                || status === ConnectionStatus.ConnectionStatusNotLicensed
                || status === ConnectionStatus.ConnectionStatusTimeInconsistent
                || status === ConnectionStatus.ConnectionStatusServerDown
                || status === ConnectionStatus.ConnectionStatusUnconnected
                || status === ConnectionStatus.ConnectionStatusTokenIncorrect) {
                this.password = '';
                this.authCode = '';
                this.loginStatus = 0;
                if (this.loginType === 0) {
                    this.refreshQrCode();
                }
                if (status !== ConnectionStatus.ConnectionStatusLogout) {
                    console.error('连接失败', status, ConnectionStatus.desc(status));
                    this.cancel();
                    this.diagnose();
                    this.$notify({
                        text: '连接失败，请打开控制台，查看具体日志',
                        type: 'error'
                    });
                }
            }
            if (status === ConnectionStatus.ConnectionStatusReceiveing) {
                if (this.$refs.loginWithAuthCodeButton) {
                    this.$refs.loginWithAuthCodeButton.textContent = '数据同步中，可能需要数分钟...';
                }
                if (this.$refs.loginWithPasswordButton) {
                    this.$refs.loginWithPasswordButton.textContent = '数据同步中，可能需要数分钟...';
                }
            }

            if (status === ConnectionStatus.ConnectionStatusConnected) {
                if (isElectron()) {
                    ipcRenderer.send(IpcEventType.LOGIN, {closeWindowToExit: getItem(wfc.getUserId() + '-' + 'closeWindowToExit') === '1'})
                }
                this.$router.replace({path: "/home"});
                if (isElectron() || (Config.CLIENT_ID_STRATEGY === 1 || Config.CLIENT_ID_STRATEGY === 2)) {
                    isElectron() && ipcRenderer.send(IpcEventType.LOGIN, {userId: wfc.getUserId(), closeWindowToExit: getItem(wfc.getUserId() + '-' + 'closeWindowToExit') === '1'})
                    if (this.enableAutoLogin) {
                        store.setEnableAutoLogin(this.enableAutoLogin)
                    }
                }
                organizationServerApi.login()
                    .catch(r => {
                        console.error('organizationServer login failed', r)
                    });
            }
        },

        async diagnose() {
            // TODO
            // app-server
            // api/version
            // tcp ping
            console.log('diagnose...')

            let configInfo = '';
            let routeHost = wfc.getHost()
            let routePort = Config.ROUTE_PORT
            let useWss = Config.USE_WSS
            configInfo += `APP-Server: ${Config.APP_SERVER}\n`
            configInfo += `IM-Server-Host: ${routeHost}\n`
            configInfo += `USE_WSS: ${useWss}\n`
            configInfo += `ROUTE_PORT: ${routePort}\n`

            configInfo += `Web SDK: ${wfc.getVersion()}\n`
            configInfo += `音视频 SDK: ${avenginekit.startConference !== undefined ? '高级版' : '多人版'}`
            configInfo += '\n'

            let ices = '';
            if (Config.ICE_SERVERS && Config.ICE_SERVERS.length > 0) {
                ices = Config.ICE_SERVERS[0][0] + ' ' + Config.ICE_SERVERS[0][1] + ' ' + Config.ICE_SERVERS[0][2]
            }
            configInfo += `Turn-Server: ${ices}\n`

            if (Config.APP_SERVER.indexOf('wildfirechat') >= 0 && routeHost.indexOf('wildfirechat') === -1) {
                configInfo += '错误：已替换 web sdk，但未修改 Config.APP_SERVER，请修改 Config.APP_SERVER\n'
            }

            if (Config.APP_SERVER.indexOf('wildfirechat') === -1 && routeHost.indexOf('wildfirechat') >= 0) {
                configInfo += '错误：已修改 Config.APP_SERVER，但未替换 web sdk，请替换web sdk\n'
            }

            if (Config.APP_SERVER.startsWith('https:') && !Config.USE_WSS) {
                configInfo += 'USE_WSS 配置错误：APP-Server 使用 https，但没有启用 wss，请修改 Config.USE_WSS = true\n'
            }
            if (Config.APP_SERVER.startsWith('http:') && Config.USE_WSS) {
                configInfo += 'USE_WSS 配置错误：APP-Server 使用 http，但是启用了 wss，请修改 Config.USE_WSS = false\n'
            }

            if (Config.APP_SERVER.startsWith('https:') && Config.ROUTE_PORT !== 443) {
                configInfo += '警告：APP-Server 使用 https，但 ROUTE_PORT 非标准 443 端口\n'
            }
            if (Config.APP_SERVER.startsWith('http:') && Config.ROUTE_PORT !== 80) {
                configInfo += '警告：APP-Server 使用 http，但 ROUTE_PORT 非标准 80 端口\n'
            }

            console.warn('-----configInfo start---------\n')
            console.warn(configInfo);
            console.warn('-----configInfo end---------\n')

            let result = '';
            let appServerResponse = await axios.get(Config.APP_SERVER, {
                transformResponse: [data => data],
            })
            if (appServerResponse.data === 'Ok') {
                result += 'APP-Server 正常\n';
            } else {
                result += 'APP-Server 异常: ' + appServerResponse.status + '\n';
            }
            if (routeHost) {
                let url = `${useWss ? 'https://' : 'http://'}${routeHost}:${routePort}/api/version`
                try {
                    let apiVersion = await axios.get(url)
                    result += 'IM-Server api/version 正常\n'
                    result += `remoteOriginUrl: ${apiVersion.data.remoteOriginUrl}\n`
                    result += `commitId: ${apiVersion.data.commitId}\n`
                    result += `commitTime: ${apiVersion.data.commitTime}\n`
                    result += `buildTime: ${apiVersion.data.buildTime}\n`
                } catch (e) {
                    result += `IM-Server api/version 异常：${e}\n`
                }
            } else {
                result += 'IM-Server 未知：未执行connect 操作'
            }


            console.log('result', result);

            this.diagnoseResult = configInfo + '\n' + result;
            this.showDiagnoseOverlay = true
        },
        closeDiagnoseOverlay() {
            this.showDiagnoseOverlay = false;
        }
    },

    computed: {
        pStyle() {
            if (isElectron()) {
                return {
                    color: 'white',
                    padding: '5px',
                }
            } else {
                return {
                    padding: '5px',
                }
            }
        }
    },

    unmounted() {
        if (this.qrCodeTimer) {
            clearInterval(this.qrCodeTimer)
        }
    },

    components: {
        ElectronWindowsControlButtonView,
        ClipLoader,
    }

}
</script>

<style lang="css" scoped>
.login-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 380px;
    height: 500px;
    margin: auto;
    background: white;
    border-radius: 5px;
}

.qr-container {
    border-radius: 3px;
    width: 250px;
    height: 250px;
    background-color: #e7e7e7;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 14px;
}

.qr-container img {
    width: 250px;
    height: 250px;
    border-radius: 3px;
    object-fit: cover;
}

.qr-container .loading {
    position: absolute;
    border-width: 4px;
}

.pending-scan,
.scanned,
.pending-quick-login,
.quick-logining {
    display: flex;
    margin-top: 20px;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    line-height: 25px;
}

.qrcode-login-container {
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

.qrcode-login-container label {
    margin-top: 5px;
    padding: 5px;
    font-size: 14px;
    color: gray;
}

.qrcode-login-container button {
    outline: none;
    font-size: 14px;
    border: none;
    border-radius: 3px;
}

.button-cancel {
    margin-top: 10px;
    background-color: transparent;
    color: gray;
}

.button-cancel:active {
    color: #4168e0;
}

.button-cancel:hover {
    color: #4168e0;
}

.button-confirm {
    width: 200px;
    height: 40px;
    color: white;
    background-color: #4168e0a0;
}

.button-confirm:hover {
    background-color: #4168e0;
}

.button-confirm:active {
    background-color: #4168e0;
}


.drag-area {
    position: absolute;
    top: 0;
    left: 0;
    right: 150px;
    height: 60px;
    z-index: -1;
    -webkit-app-region: drag;
}

.switch-login-type-container {
    padding-top: 10px;
    font-size: 14px;
    color: #4168e0;
}

.login-form-container {
    width: 260px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: relative;
}

.login-form-container .title {
    align-self: flex-start;
    font-size: 18px;
    color: white;
}

.login-form-container .item {
    width: 100%;
    font-size: 13px;
    margin-top: 20px;
    position: relative;
}

.login-form-container .text-input {
    height: 40px;
    width: 100%;
    border: 1px solid #e5e5e5;
    border-radius: 3px;
    outline: none;
    padding: 0 5px;
    -moz-appearance: textfield;
}

input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}

.login-form-container .text-input:active {
    border: 1px solid #4168e0;
}

.login-form-container .text-input:focus {
    border: 1px solid #4168e0;
}

.login-form-container .login-button {
    height: 40px;
    width: 100%;
    margin-top: 20px;
    border: 1px solid #e5e5e5;
    border-radius: 3px;
}

.login-form-container .login-button:active {
    border: 1px solid #4168e0;
}

.login-form-container .request-auth-code-button {
    position: absolute;
    font-size: 12px;
    top: 50%;
    right: 0;
    transform: translateY(-50%);
    margin: 0 5px;
}

.login-form-container .syncing {
    position: absolute;
    bottom: 0;
    color: #4168e0;
}

.tip {
    align-self: flex-start;
    font-size: 12px;
    color: #4168e0;
    margin-top: 10px;
}

.logo {
    width: 160px;
    height: 160px;
}

.diagnose {
    position: absolute;
    right: 10px;
    bottom: 10px;
    align-self: flex-start;
    font-size: 12px;
    color: lightcoral;
}

.diagnose-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.diagnose-content {
    background: white;
    padding: 20px;
    border-radius: 5px;
    max-width: 100%;
    max-height: 90%;
    overflow: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.diagnose-content pre {
    width: 100%;
    text-align: left;
}

.diagnose-content button {
    margin-top: 20px;
}
</style>
