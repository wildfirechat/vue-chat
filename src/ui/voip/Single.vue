<template>
  <div id="app" class="flex-column flex-align-center flex-justify-center">
    <h1>Voip-single，运行在新的window，和主窗口数据是隔离的！！</h1>
    <div class="container">
      <video ref="localVideo" class="localVideo" playsInline autoPlay muted>
      </video>
      <video ref="remoteVideo" class="remoteVideo" playsInline autoPlay>
      </video>
      <button @click="answer" class="acceptButton">Accept</button>
    </div>
  </div>
</template>

<script>
import avenginekit from "../../wfc/av/internal/engine.min";
import CallSessionCallback from "../../wfc/av/engine/CallSessionCallback";


export default {
  name: 'Single',
  data() {
    return {
      session: null,
      audioOnly: false,
      muted: false,
    }
  },
  methods: {
    setupSessionCallback() {
      let sessionCallback = new CallSessionCallback();

      sessionCallback.didChangeState = (state) => {
        this.status = state;
        // if (state === CallState.STATUS_CONNECTED) {
        //   this.onUpdateTime();
        // } else if (state === CallState.STATUS_IDLE) {
        //   if (this.timer) {
        //     clearInterval(this.timer);
        //   }
        // }
        console.log('status change', state)
      };

      sessionCallback.onInitial = (session, selfUserInfo, initiatorUserInfo, participantUserInfos) => {
        this.session = session;
        this.audioOnly = session.audioOnly;
      };

      sessionCallback.didChangeMode = (audioOnly) => {
        this.audioOnly = audioOnly;
      };

      sessionCallback.didCreateLocalVideoTrack = (stream) => {
        this.$refs['localVideo'].srcObject = stream;
      };

      sessionCallback.didReceiveRemoteVideoTrack = (userId, stream) => {
        this.$refs['remoteVideo'].srcObject = stream;
      };

      sessionCallback.didCallEndWithReason = (reason) => {
        console.log('callEndWithReason', reason)
      }
      sessionCallback.didVideoMuted = (userId, muted) => {
        this.muted = muted;
      };
      avenginekit.sessionCallback = sessionCallback;
    },

    answer() {
      this.session.call();
    }
  },

  mounted() {
    avenginekit.setup();
    this.setupSessionCallback();
  }

}
</script>

<style lang="css" scoped>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

.container {
  width: 360px;
  height: 640px;
  position: relative;
}

.localVideo {
  width: 200px;
  height: 200px;
  position: absolute;
  top: 0;
  background-color: #cccccc;
  left: 0;
}

.remoteVideo {
  background-color: rebeccapurple;
  width: 100%;
  height: 100%;

}
</style>
