<template>
    <div class="login-container">
        <ElectronWindowsControlButtonView style="position: absolute; top: 0; right: 0"
                                          :maximizable="false"
                                          v-if="sharedMiscState.isElectronWindowsOrLinux"/>

        <div class="drag-area"/>
        <div v-if="loginType === 0" class="qrcode-login-container">
            <div class="qr-container">
                <img v-if="qrCode" v-bind:src="qrCode" alt="">
                <p v-else>{{ $t('misc.gen_qr_code') }}</p>
                <ClipLoader v-if="loginStatus === 4" class="loading" :color="'white'" :height="'80px'" :width="'80px'"/>
            </div>
            <!--    等待扫码-->
            <div v-if="loginStatus === 0" class="pending-scan">
                <p>{{ $t('login.desc') }}</p>
                <p>{{ $t('login.tip') }}</p>
                <p>{{ $t('login.warning') }}</p>
                <a target="_blank" href="https://static.wildfirechat.net/download_qrcode.png">点击下载野火IM移动端</a>
            </div>
            <!--    已经扫码-->
            <div v-else-if="loginStatus === 1" class="scanned">
                <p>{{ userName + $t('login.scan_qr_success') }}</p>
                <p>{{ $t('login.confirm_login_tip') }}</p>
                <label>
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
                <p>数据同步中...</p>
            </div>
        </div>
        <div v-else-if="loginType === 1" class="login-form-container">
            <!--            密码登录-->
            <p class="title">密码登录</p>
            <div class="item">
                <input v-model="mobile" class="text-input" type="number" placeholder="请输入手机号">
            </div>
            <div class="item">
                <input v-model="password" class="text-input" @keydown.enter="loginWithPassword" type="password" placeholder="请输入密码">
            </div>
            <div v-if="loginStatus === 0" style="display: flex; justify-content: space-between; width: 100%; ">
                <p class="tip" @click="switchLoginType(2)">使用验证码登录</p>
                <p class="tip" @click="register">注册</p>
            </div>
            <button class="login-button" :disabled="mobile.trim() === '' || password.trim() === ''" ref="loginWithPasswordButton" @click="loginWithPassword">{{ loginStatus === 3 ? '数据同步中...' : '登录' }}</button>
            <ClipLoader v-if="loginStatus === 3" class="syncing" :color="'#4168e0'" :height="'80px'" :width="'80px'"/>
        </div>
        <div v-else class="login-form-container">
            <!--            验证码登录-->
            <p class="title">验证码登录</p>
            <div class="item">
                <input v-model="mobile" class="text-input" type="number" placeholder="请输入手机号">
            </div>
            <div class="item">
                <input v-model="authCode" class="text-input" type="number" placeholder="验证码">
                <button :disabled="mobile.trim().length !== 11" class="request-auth-code-button" @keydown.enter="loginWithAuthCode" @click="requestAuthCode">获取验证码</button>
            </div>
            <p v-if="loginStatus === 0" class="tip" @click="switchLoginType(1)">使用密码登录</p>
            <button class="login-button" :disabled="mobile.trim() === '' || authCode.trim() === ''" ref="loginWithAuthCodeButton" @click="loginWithAuthCode">{{ loginStatus === 3 ? '数据同步中...' : '登录' }}</button>
            <ClipLoader v-if="loginStatus === 3" style="margin-top: 10px" class="syncing" :color="'4168e0'" :height="'80px'" :width="'80px'"/>
        </div>
        <div v-if="loginStatus === 0" class="switch-login-type-container">
            <p class="tip" @click="switchLoginType( loginType === 0 ? 1 : 0)">{{ loginType === 0 ? '使用密码/验证码登录' : '扫码登录' }}</p>
        </div>
    </div>
</template>

<script>
import Config from "@/config";
import wfc from '../../wfc/client/wfc'
import PCSession from "@/wfc/model/pcsession";
import jrQRCode from 'jr-qrcode'
import ClipLoader from 'vue-spinner/src/ClipLoader'
import ConnectionStatus from "@/wfc/client/connectionStatus";
import EventType from "@/wfc/client/wfcEvent";
import {clear, getItem, setItem} from "@/ui/util/storageHelper";
import {ipcRenderer, isElectron} from "@/platform";
import store from "@/store";
import ElectronWindowsControlButtonView from "@/ui/common/ElectronWindowsControlButtonView";
import IpcEventType from "../../ipcEventType";
import appServerApi from "../../api/appServerApi";
import organizationServerApi from "../../api/organizationServerApi";

export default {
    name: 'App',
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
            enableAutoLogin: false,
            mobile: '',
            password: '',
            authCode: '',
            firstTimeConnect: false,
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
            }
        } else {
            this.createPCLoginSession(null);
        }
    },

    beforeDestroy() {
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

        async createPCLoginSession(userId) {
            appServerApi.createPCSession(userId)
                .then(response => {
                    let session = Object.assign(new PCSession(), response);
                    this.appToken = session.token;
                    if (!userId || session.status === 0/*服务端pc login session不存在*/) {
                        this.qrCode = jrQRCode.getQrBase64(Config.QR_CODE_PREFIX_PC_SESSION + session.token);
                        this.refreshQrCode();
                    }
                    this.login();
                })
                .catch(err => {
                    console.log('createPCSession error', err);
                })
        },

        async refreshQrCode() {
            if (!this.qrCodeTimer) {
                this.qrCodeTimer = setInterval(() => {
                    this.appToken = '';
                    this.loginStatus = 0;
                    this.createPCLoginSession(null);
                }, 30 * 1000);
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

            this.createPCLoginSession(null);
            this.refreshQrCode();
        },

        onConnectionStatusChange(status) {
            if (status === ConnectionStatus.ConnectionStatusLogout
                || status === ConnectionStatus.ConnectionStatusRejected
                || status === ConnectionStatus.ConnectionStatusSecretKeyMismatch
                || status === ConnectionStatus.kConnectionStatusKickedOff
                || status === ConnectionStatus.ConnectionStatusTokenIncorrect) {
                console.error('连接失败', status, ConnectionStatus.desc(status));
                this.cancel();
            }
            if (status === ConnectionStatus.ConnectionStatusConnected) {
                // pc 端首次登录时，等待同步数据
                // TODO 添加同步中动画
                if (isElectron() && this.firstTimeConnect) {
                    if (this.$refs.loginWithAuthCodeButton) {
                        this.$refs.loginWithAuthCodeButton.textContent = '数据同步中...';
                    }
                    if (this.$refs.loginWithPasswordButton) {
                        this.$refs.loginWithPasswordButton.textContent = '数据同步中...';
                    }
                    // 先等待加载数据
                    setTimeout(() => {
                        isElectron() && ipcRenderer.send('logined', {closeWindowToExit: getItem(wfc.getUserId() + '-' + 'closeWindowToExit') === '1'})
                        this.$router.replace({path: "/home"});
                    }, 5 * 1000)
                } else {
                    if (isElectron()) {
                        ipcRenderer.send('logined', {closeWindowToExit: getItem(wfc.getUserId() + '-' + 'closeWindowToExit') === '1'})
                    }
                    this.$router.replace({path: "/home"});
                }
                if (isElectron() || (Config.CLIENT_ID_STRATEGY === 1 || Config.CLIENT_ID_STRATEGY === 2)) {
                    isElectron() && ipcRenderer.send(IpcEventType.LOGINED, {closeWindowToExit: getItem(wfc.getUserId() + '-' + 'closeWindowToExit') === '1'})
                    if (this.enableAutoLogin) {
                        store.setEnableAutoLogin(this.enableAutoLogin)
                    }
                }
                organizationServerApi.login();
            }
        },
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

    destroyed() {
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

.login-form-container .syncing{
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


</style>
