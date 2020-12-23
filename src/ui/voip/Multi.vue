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
        <div ref="test" class="content-container">
          <!--self-->
          <div class="participant-container">
            <video v-show="status ===4 && !audioOnly"
                   class="remoteVideo"
                   ref="localVideo"
                   playsInline
                   autoPlay/>
            <div v-show="!(status ===4 && !audioOnly)" class="flex-column flex-justify-center flex-align-center">
              <img class="avatar" :src="selfUserInfo.portrait">
              <p>self</p>
            </div>
          </div>

          <!--participants-->
          <div v-for="(participant) in participantUserInfos" :key="participant.uid"
               class="participant-container">
            <video v-show="status ===4 && !audioOnly" class="remoteVideo"
                   :class="'video' + participant.uid"
                   playsInline
                   autoPlay/>
            <div v-show="!(status ===4 && !audioOnly)" class="flex-column flex-justify-center flex-align-center">
              <img class="avatar" :src="participant.portrait" :alt="participant">
              <p class="single-line">{{ userName(participant) }}</p>
            </div>
          </div>
          <!--add more-->
          <div v-if="participantUserInfos.length < 8" class="participant-container">
            <img @click="invite" class="avatar" src="@/assets/images/add.png">
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
      selfUserInfo: null,
      initiatorUserInfo: null,
      participantUserInfos: [1, 2, 3, 4, 5, 6, 7, 8],
      groupMemberUserInfos: [],
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

      sessionCallback.onInitial = (session, selfUserInfo, initiatorUserInfo, participantUserInfos, groupMemberUserInfos) => {
        this.session = session;
        this.audioOnly = session.audioOnly;
        this.selfUserInfo = selfUserInfo;
        this.initiatorUserInfo = initiatorUserInfo;
        this.participantUserInfos = participantUserInfos;
        this.groupMemberUserInfos = groupMemberUserInfos;

        console.log('init', selfUserInfo, participantUserInfos)
      };

      sessionCallback.didChangeMode = (audioOnly) => {
        this.audioOnly = audioOnly;
      };

      sessionCallback.didCreateLocalVideoTrack = (stream) => {
        console.log('crete l track', stream)
        this.$nextTick(() => {
          // this.selfUserInfo._videoSrc = stream;
          this.$refs['localVideo'].srcObject = stream;
        });
      };

      sessionCallback.didReceiveRemoteVideoTrack = (userId, stream) => {
        this.$nextTick(() => {

          let video = this.$refs['test'].getElementsByClassName('video' + userId)[0];
          video.srcObject = stream;
          // let p;
          // for (let i = 0; i < this.participantUserInfos.length; i++) {
          //   p = this.participantUserInfos[i];
          //   if (p.uid === userId) {
          //     console.log('receive r track', userId, stream)
          //     p._videoSrc = stream;
          //     break;
          //   }
          // }
        });
      };

      sessionCallback.didParticipantJoined = (userId, userInfo) => {
        console.log('didParticipantJoined', userId)
        this.participantUserInfos.push(userInfo);
      }

      sessionCallback.didParticipantLeft = (userId) => {
        console.log('didParticipantLeft', userId, this.participantUserInfos.length)
        this.participantUserInfos = this.participantUserInfos.filter(p => p.uid !== userId);
        console.log('didParticipantLeft d', userId, this.participantUserInfos.length)
      }

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
    },

    invite() {
      // todo
      console.log('to invite');
    },

    userName(user) {
      if (user.groupAlias) {
        name = user.groupAlias;
      } else if (user.friendAlias) {
        name = user.friendAlias;
      } else if (user.displayName) {
        name = user.displayName;
      } else {
        name = user.name;
      }
      return name;
    },
  },

  mounted() {
    avenginekit.setup();
    this.setupSessionCallback();
  }

}
</script>

<style lang="css" scoped>

.container {
  width: 600px;
  background-color: red;
  height: 720px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.content-container {
  width: 100%;
  position: relative;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-content: flex-start;
}

.participant-container {
  display: flex;
  width: 200px;
  height: 200px;
  background-color: rebeccapurple;

  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.participant-container > video {
  max-width: 100%;
  max-height: 100%;
  width: 100%;
  height: 100%;
  object-fit: cover;
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
