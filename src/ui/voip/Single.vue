<!--export default class CallState {-->
<!--static STATUS_IDLE = 0;-->
<!--static STATUS_OUTGOING = 1;-->
<!--static STATUS_INCOMING = 2;-->
<!--static STATUS_CONNECTING = 3;-->
<!--static STATUS_CONNECTED = 4;-->
<!--}-->
<template>
  <div class="flex-column flex-align-center flex-justify-center">
    <h1 style="display: none">Voip-single，运行在新的window，和主窗口数据是隔离的！！</h1>

    <div class="container">
      <section class="full-height full-width">
        <!--audio-->
        <div class="content-container" v-if="audioOnly">
          <div class="local-audio-container">
            <img class="avatar" src="@/assets/images/user-fallback.png">
          </div>
          <div class="remote-audio-container">
            <img class="avatar" src="@/assets/images/user-fallback.png">
            <p>remote user name</p>
            <p v-if="status === 1">等待对方接听</p>
            <p v-else-if="status === 2">邀请你语音聊天</p>
            <p v-else-if="status === 3">接听中...</p>
          </div>
        </div>

        <!--video-->
        <div v-else class="content-container">
          <video ref="localVideo" class="localVideo" playsInline autoPlay muted>
          </video>
          <video ref="remoteVideo" class="remoteVideo" playsInline autoPlay>
          </video>
        </div>
      </section>

      <!--actions-->
      <footer>
        <!--incoming-->
        <div v-if="status === 2" class="action-container">
          <div class="action">
            <img class="action-img" src='@/assets/images/av_hang_up.png'/>
          </div>
          <div class="action">
            <img class="action-img" src='@/assets/images/av_video_answer.png'/>
          </div>
          <div v-if="!audioOnly" class="action">
            <img class="action-img" src='@/assets/images/av_float_audio.png'/>
            <p>切换到语音聊天</p>
          </div>
        </div>
        <!--outgoing-->
        <div v-if="status === 1" class="action-container">
          <div class="action">
            <img class="action-img" src='@/assets/images/av_hang_up.png'/>
          </div>
        </div>

        <!--connected-->
        <div v-if="status === 4" class="action-container">
          <div class="action">
            <img class="action-img" src='@/assets/images/av_hang_up.png'/>
          </div>
          <div v-if="!audioOnly" class="action">
            <img class="action-img" src='@/assets/images/av_share.png'/>
          </div>

        </div>
      </footer>
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
      audioOnly: true,
      muted: false,
      status: 1,
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

.container {
  width: 360px;
  height: 640px;
  position: relative;
}

.content-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.action-container {
  width: 100%;
  position: absolute;
  bottom: 0;
  left: 0;
  display: flex;
  justify-content: space-around;
  padding-bottom: 20px;
}

.action-container .action {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 12px;
}

.avatar {
  width: 60px;
  height: 60px;
  border-radius: 3px;
}

.action-img {
  width: 60px;
  height: 60px;
}

.remote-audio-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background-color: rebeccapurple;
}

.local-audio-container {
  position: absolute;
  top: 20px;
  left: 20px;
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
