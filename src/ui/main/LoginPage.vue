<template>
  <div class="login-container">
    <img v-bind:src="qrCode" alt="qr-code">

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

export default {
  name: 'App',
  data() {
    return {
      qrCode: '',
      userName: '',
      loginStatus: 0, //0 等待扫码； 1 已经扫码； 2 存在session，等待发送给客户端验证；3 已经发送登录请求
      qrCodeTimer: null,
      appToken: '',
      lastAppToken: '',
    }
  },
  created() {
    wfc.eventEmitter.on(EventType.ConnectionStatusChanged, this.onConnectionStatusChange)
    axios.defaults.baseURL = Config.APP_SERVER;

    let userId = this.storageGetItem('userId');
    if (userId) {
      let portrait = this.storageGetItem("userPortrait");
      this.qrCode = portrait;
      this.loginStatus = 2;
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
              this.storageSetItem('userId', userId);
            }
            break;
          case 9:
            this.qrCode = response.data.result.portrait;
            this.storageSetItem("userName", response.data.result.userName);
            this.storageSetItem("userPortrait", response.data.result.portrait);

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
      let userId = this.storageGetItem("userId");
      this.createPCLoginSession(userId);
      this.loginStatus = 3;
    },

    cancel() {

      this.loginStatus = 0;
      this.storageRemoveItem("userId");
      this.storageRemoveItem("userName");
      this.storageRemoveItem("userPortrait")

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
      }
    },

    // TODO 考虑挪到wfc.js里面去
    storageGetItem(key) {
      if (!this.storage) {
        return;
      }
      return this.storage.getItem(key);
    },

    storageSetItem(key, value) {
      if (!this.storage) {
        return;
      }
      this.storage.setItem(key, value);
    },

    storageRemoveItem(key) {
      if (!this.storage) {
        return;
      }
      this.storage.removeItem(key);
    }
  },

  computed: {
    storage() {
      let s = null;
      if (Config.CLIENT_ID_STRATEGY === 1) {
        s = sessionStorage;
      } else if (Config.CLIENT_ID_STRATEGY === 2) {
        s = localStorage;
      }
      return s;
    }
  },

  destroyed() {
    if (this.qrCodeTimer) {
      clearInterval(this.qrCodeTimer)
    }
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

.login-action-container button {
  margin: 5px 0;
  height: 40px;
  width: 250px;
  outline: none;
  border: none;
  border-radius: 3px;
}

.button-cancel {
  background-color: transparent;
  color: #d6d6d6;
}

.button-cancel:active {
  color: white;
}

.button-cancel:hover {
  color: white;
}

.button-confirm {
  background-color: white;
}

.button-confirm:hover {
  background-color: #d6d6d6;
}

.button-confirm:active {
  background-color: #d6d6d6;
}

p {
  color: white;
  padding: 5px;
}

</style>
