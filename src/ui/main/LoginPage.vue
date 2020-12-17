<template>
  <div id="app">
    <div v-show="status !== 1">
      <p>请使用野火IM 移动端扫码登录</p>
      <img v-bind:src="qrCode">
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
      status: ConnectionStatus.ConnectionStatusLogout,
      qrCode: 'hello world',
      scanToLogin: true,
    }
  },
  created() {
    axios.defaults.baseURL = Config.APP_SERVER;
    this.createPCLoginSession(null);
    wfc.eventEmitter.on(EventType.ConnectionStatusChanged, this.onConnectionStatusChange)
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
          this.desc = '扫码登录野火IM'
          this.scanToLogin = true;

          if (userId) {
            this.refreshQrCode();
          }
        }
        this.login();
      }
    },

    async refreshQrCode() {
      this.qrCodeTimer = setInterval(() => {
        this.appToken = '';
        this.createPCLoginSession(null);
      }, 30 * 1000);
    },

    async login() {
      if (this.appToken === '' || this.lastAppToken === this.appToken) {
        console.log('-------- token is empty or invalid');
        return;
      }
      var response = await axios.post('/session_login/' + this.appToken, "", {withCredentials: true});
      console.log('---------- login', response.data);
      if (response.data) {
        switch (response.data.code) {
          case 0:
            this.lastAppToken = this.appToken;
            let userId = response.data.result.userId;
            let imToken = response.data.result.token;
            wfc.connect(userId, imToken);
            break;
          case 9:
            console.log('qrcode scaned', response.data);
            this.desc = response.data.result.userName + ' 已扫码，等待确认';
            this.qrCode = response.data.result.portrait;
            // update login status ui
            this.login();
            break;
          case 18:
            //session is canceled, need clear last time login status
            this.switchUser();
            break;
          default:
            this.lastAppToken = '';
            console.log(response.data);
            break
        }
      }
    },

    switchUser() {

      this.scanToLogin = true;
      this.hasSentLoginRequest = false;
      this.createPCLoginSession(null);
      this.refreshQrCode();
    },

    onConnectionStatusChange(status) {
      if (status === ConnectionStatus.ConnectionStatusLogout
          || status === ConnectionStatus.ConnectionStatusRejected
          || status === ConnectionStatus.ConnectionStatusSecretKeyMismatch
          || status === ConnectionStatus.ConnectionStatusTokenIncorrect) {
      }
      this.status = status;
      if (status === ConnectionStatus.ConnectionStatusConnected) {
        this.$router.replace({path: "/home"});
      }
    }

  },

}
</script>

<style lang="css" scoped>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

p {
  color: red;

}
</style>
