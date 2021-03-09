<template>
  <div class="login-container">
    <ElectronWindowsControlButtonView style="position: absolute; top: 0; right: 0"
                                      :maximizable="false"
                                      v-if="sharedMiscState.isElectronWindowsOrLinux"/>
    <img v-bind:src="qrCode" alt="">
    <div class="drag-area"/>

    <div class="login-action-container">
      <!--    等待扫码-->
      <div v-if="loginStatus === 0" class="pending-scan">
        <p>扫码登录野火IM</p>
        <p>野火IM Web端需要配合您的手机客户端登录使用</p>
        <p>不是使用微信扫码登录!!!</p>
      </div>
      <!--    已经扫码-->
      <div v-else-if="loginStatus === 1" class="scanned">
        <p>{{ userName }}扫码成功</p>
        <p>请在手机上点击确认以登录</p>
        <label>
          记住登录
          <input type="checkbox" v-model="enableAutoLogin">
        </label>
        <button @click="cancel" class="button-cancel">取消登录</button>
      </div>

      <!--    存在session，等待发送给客户端验证-->
      <div v-if="loginStatus === 2" class="pending-quick-login">
        <button @click="sendQuickLoginRequest" class="button-confirm">登录</button>
        <button @click="cancel" class="button-cancel">切换用户</button>
      </div>

      <!--    已经发送登录请求-->
      <div v-else-if="loginStatus === 3" class="quick-logining">
        <p>请在手机上点击确认以登录</p>
        <button @click="cancel" class="button-cancel">取消登录</button>
      </div>

      <!--      开发调试时，自动登录-->
      <div v-else-if="loginStatus === 4">
        <p>自动登录中...</p>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import Config from "@/config";
import wfc from '../../wfc/client/wfc'
import PCSession from "@/wfc/model/pcsession";
import jrQRCode from 'jr-qrcode'
import ConnectionStatus from "@/wfc/client/connectionStatus";
import EventType from "@/wfc/client/wfcEvent";
import {getItem, setItem, clear} from "@/ui/util/storageHelper";
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
      loginStatus: 0, //0 等待扫码； 1 已经扫码； 2 存在session，等待发送给客户端验证；3 已经发送登录请求 4 调试时，自动登录
      qrCodeTimer: null,
      appToken: '',
      lastAppToken: '',
      enableAutoLogin: false,
    }
  },
  created() {
    wfc.eventEmitter.on(EventType.ConnectionStatusChanged, this.onConnectionStatusChange)
    axios.defaults.baseURL = Config.APP_SERVER;

    let userId = getItem('userId');
    let token = getItem('token');
    if (userId) {
      let portrait = getItem("userPortrait");
      this.qrCode = portrait;

      let autoLogin = getItem(userId + '-' + 'autoLogin') === '1'
      if (autoLogin && token) {
        wfc.connect(userId, token);
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
    async createPCLoginSession(userId) {
      let response = await axios.post('/pc_session', {
        flag: 1,
        device_name: 'web',
        userId: userId,
        clientId: wfc.getClientId(),
        platform: Config.getWFCPlatform()
      }, {withCredentials: true});
      console.log('----------- createPCLoginSession', response.data);
      if (response.data) {
        let session = Object.assign(new PCSession(), response.data.result);
        this.appToken = session.token;
        if (!userId || session.status === 0/*服务端pc login session不存在*/) {
          this.qrCode = jrQRCode.getQrBase64(Config.QR_CODE_PREFIX_PC_SESSION + session.token);

          if (userId) {
            this.refreshQrCode();
          }
        }
        this.login();
      }
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
      let response = await axios.post('/session_login/' + this.appToken, "", {withCredentials: true});
      console.log('---------- login', response.data);
      if (this.lastAppToken !== this.appToken) {
        return;
      }
      if (response.data) {
        switch (response.data.code) {
          case 0:
            if (this.loginStatus === 1 || this.loginStatus === 3) {
              let userId = response.data.result.userId;
              let imToken = response.data.result.token;
              wfc.connect(userId, imToken);
              setItem('userId', userId);
              setItem('token', imToken);
            }
            break;
          case 9:
            this.qrCode = response.data.result.portrait;
            setItem("userName", response.data.result.userName);
            setItem("userPortrait", response.data.result.portrait);

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
            console.log(response.data);
            break
        }
      }
    },

    sendQuickLoginRequest() {
      let userId = getItem("userId");
      this.createPCLoginSession(userId);
      this.loginStatus = 3;
    },

    cancel() {

      this.loginStatus = 0;
      clear();

      this.createPCLoginSession(null);
      this.refreshQrCode();
    },

    onConnectionStatusChange(status) {
      if (status === ConnectionStatus.ConnectionStatusLogout
          || status === ConnectionStatus.ConnectionStatusRejected
          || status === ConnectionStatus.ConnectionStatusSecretKeyMismatch
          || status === ConnectionStatus.ConnectionStatusTokenIncorrect) {
        this.cancel();
      }
      if (status === ConnectionStatus.ConnectionStatusConnected) {
        this.$router.replace({path: "/home"});
        if (isElectron()) {
          ipcRenderer.send('logined', {closeWindowToExit: getItem(wfc.getUserId() + '-' + 'closeWindowToExit') === '1'})
          if (this.enableAutoLogin) {
            store.setEnableAutoLogin(this.enableAutoLogin)
          }
        }
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

.login-container img {
  border-radius: 3px;
  width: 250px;
  height: 250px;
  background-color: #e7e7e7;
}

.pending-scan,
.scanned,
.pending-quick-login,
.quick-logining {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.login-action-container {
  margin-top: 20px;
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
  right: 0;
  height: 60px;
  z-index: -1;
  -webkit-app-region: drag;
}

</style>
