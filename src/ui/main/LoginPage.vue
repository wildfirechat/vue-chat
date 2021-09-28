<template>
    <div class="login-container">
        <ElectronWindowsControlButtonView style="position: absolute; top: 0; right: 0"
                                          :maximizable="false"
                                          v-if="sharedMiscState.isElectronWindowsOrLinux"/>
        <div class="login-action-container">
            <p>链接中...</p>
        </div>
    </div>
</template>

<script>
import axios from 'axios'
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

export default {
    name: 'App',
    data() {
        return {
            sharedMiscState: store.state.misc,
            qrCode: '',
            userName: '',
            qrCodeTimer: null,
            appToken: '',
            lastAppToken: '',
            enableAutoLogin: false,
        }
    },
    created() {
        wfc.eventEmitter.on(EventType.ConnectionStatusChanged, this.onConnectionStatusChange)
        axios.defaults.baseURL = Config.APP_SERVER;

        axios.defaults.headers.common['authToken'] = getItem('authToken');
        let userId = getItem('userId');
        let token = getItem('token');
        if (userId) {
            let portrait = getItem("userPortrait");
            this.qrCode = portrait ? portrait : Config.DEFAULT_PORTRAIT_URL;
            if (token) {
                wfc.connect(userId, token);
            }
        } else {
            this.login();
        }
    },

    beforeDestroy() {
        wfc.eventEmitter.removeListener(EventType.ConnectionStatusChanged, this.onConnectionStatusChange)
    },

    methods: {
        async login() {
            this.lastAppToken = this.appToken;
            let postData = {
                "mobile": "131",
                "password": "131",
                "clientId": wfc.getClientId(),
                "platform": "5",
                "channel": "1"
            }
            let response = await axios.post('/login', postData, {withCredentials: true});
            if (response.data) {
                switch (response.data.code) {
                    case 0:
                        let userId = response.data.result.userId;
                        let imToken = response.data.result.token;
                        wfc.connect(userId, imToken);
                        setItem('userId', userId);
                        setItem('token', imToken);
                        let appAuthToken = response.headers['authtoken'];
                        if (!appAuthToken) {
                            appAuthToken = response.headers['authToken'];
                        }

                        if (appAuthToken) {
                            setItem('authToken', appAuthToken);
                            axios.defaults.headers.common['authToken'] = appAuthToken;
                        }
                        //联系客服
                        let contactResponse = await axios.post('/im/customer/contact', {
                            "source": "game",
                            "device": "5",
                            "deviceVersion": "0.1.0",
                        });
                        console.log('---------- contact', contactResponse);
                        break;
                    case 9:
                        if (response.data.result.portrait) {
                            this.qrCode = response.data.result.portrait;
                        } else {
                            this.qrCode = Config.DEFAULT_PORTRAIT_URL;
                        }
                        setItem("userName", response.data.result.userName);
                        setItem("userPortrait", response.data.result.portrait);
                        break;
                    case 18:
                        //session is canceled, need clear last time login status
                        break;
                    default:
                        this.lastAppToken = '';
                        console.log(response.data);
                        break
                }
            }
        },

        onConnectionStatusChange(status) {
            if (status === ConnectionStatus.ConnectionStatusLogout
                || status === ConnectionStatus.ConnectionStatusRejected
                || status === ConnectionStatus.ConnectionStatusSecretKeyMismatch
                || status === ConnectionStatus.ConnectionStatusTokenIncorrect) {
                this.login();
            }
            if (status === ConnectionStatus.ConnectionStatusConnected) {
                this.$router.replace({path: "/home"});
                if (isElectron() || (Config.CLIENT_ID_STRATEGY === 1 || Config.CLIENT_ID_STRATEGY === 2)) {
                    isElectron() && ipcRenderer.send('logined', {closeWindowToExit: getItem(wfc.getUserId() + '-' + 'closeWindowToExit') === '1'})
                    if (this.enableAutoLogin) {
                        store.setEnableAutoLogin(this.enableAutoLogin)
                    }
                }
            }
        },
    },

    destroyed() {
        if (this.qrCodeTimer) {
            clearInterval(this.qrCodeTimer)
        }
    },

    components: {
        ElectronWindowsControlButtonView,
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

.login-action-container {
    margin-top: 20px;
    height: 120px;
}

.login-action-container label {
    margin-top: 5px;
    padding: 5px;
    font-size: 14px;
    color: gray;
}

.login-action-container button {
    outline: none;
    font-size: 14px;
    border: none;
    border-radius: 3px;
}

</style>
