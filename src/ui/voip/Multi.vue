<!--export default class CallState {-->
<!--static STATUS_IDLE = 0;-->
<!--static STATUS_OUTGOING = 1;-->
<!--static STATUS_INCOMING = 2;-->
<!--static STATUS_CONNECTING = 3;-->
<!--static STATUS_CONNECTED = 4;-->
<!--}-->
<template>
  <div class="flex-column flex-align-center flex-justify-center">
    <h1 style="display: none">Voip-Multi 运行在新的window，和主窗口数据是隔离的！！</h1>

    <div class="container">
      <section>
        <!--audio-->
        <div class="content-container">
          <div class="participant-container">
            <img class="avatar" src="@/assets/images/user-fallback.png">
            <video v-if="status ===4 && !audioOnly" ref="remoteVideo" class="remoteVideo" playsInline autoPlay/>
            <p class="single-line">iimnndsssssimnndsssssmnndsssss</p>
          </div>
          <div class="participant-container">
            <img class="avatar" src="@/assets/images/user-fallback.png">
          </div>
          <div class="participant-container">
            <img class="avatar" src="@/assets/images/user-fallback.png">
          </div>
          <div class="participant-container">
            <img class="avatar" src="@/assets/images/user-fallback.png">
          </div>
          <div class="participant-container">
            <img class="avatar" src="@/assets/images/user-fallback.png">
          </div>
          <div class="participant-container">
            <img class="avatar" src="@/assets/images/user-fallback.png">
          </div>
          <div class="participant-container">
            <img class="avatar" src="@/assets/images/user-fallback.png">
          </div>
        </div>
      </section>

      <!--actions-->
      <footer>
        <!--incoming-->
        <div v-if="status === 2" class="action-container">
          <div class="action">
            <img @click="hangup" class="action-img" src='@/assets/images/av_hang_up.png'/>
          </div>
          <div class="action">
            <img @click="answer" class="action-img" src='@/assets/images/av_video_answer.png'/>
          </div>
          <div v-if="!audioOnly" class="action">
            <img @click="down2voice" class="action-img" src='@/assets/images/av_float_audio.png'/>
            <p>切换到语音聊天</p>
          </div>
        </div>
        <!--outgoing-->
        <div v-if="status === 1 || status === 3" class="action-container">
          <div class="action">
            <img @click="hangup" class="action-img" src='@/assets/images/av_hang_up.png'/>
          </div>
        </div>

        <!--connected-->
        <div v-if="status === 4" class="action-container">
          <div class="action">
            <img @click="hangup" class="action-img" src='@/assets/images/av_hang_up.png'/>
          </div>
          <div v-if="!audioOnly" class="action">
            <img @click="screenShare" class="action-img" src='@/assets/images/av_share.png'/>
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
  name: 'Multi',
  data() {
    return {
      session: null,
      audioOnly: false,
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
    },

    hangup() {
      this.session.hangup();
    },
    down2voice() {
      this.session.down2voice();
    },
    screenShare() {
      this.session.screenShare();
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
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.content-container {
  width: 100%;
  position: relative;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  align-content: flex-start;
}

.content-container > div {
  display: flex;
  width: 120px;
  height: 120px;
  background-color: rebeccapurple;
  border: 1px solid #e2e2e2;

  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.action-container {
  width: 100%;
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
</style>
