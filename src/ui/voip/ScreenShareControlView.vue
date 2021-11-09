<template>
    <div class="screen-share-action-container">
        <video v-if="session"
               class="video"
               ref="screenShareVideo"
               style="width: 100%; height: 100%; position: absolute; left: 0; top: 0; z-index: 0; display:none"
               :srcObject.prop="session.screenShareStream"
               playsInline
               muted
               autoPlay/>
        <div class="action">
            <img v-if="session && !session.audioMuted" @click="audioMute" class="action-img"
                 src='@/assets/images/av_mute.png'/>
            <img v-else @click="audioMute" class="action-img" src='@/assets/images/av_mute_hover.png'/>
            <p>{{ session && session.audioMuted ? '取消静音' : '静音' }}</p>
        </div>
        <div class="action">
            <img @click="videoMute" class="action-img" src='@/assets/images/av_video_answer.png'/>
            <p>开启视频</p>
        </div>
        <div class="action">
            <img @click="stopScreenShare" class="action-img" src='@/assets/images/av_hang_up.png'/>
            <p>结束共享</p>
        </div>
    </div>

</template>

<script>
import avenginekit from "../../wfc/av/internal/engine.min";
import AvEngineKitProxy from "../../wfc/av/engine/avenginekitproxy";

export default {
    name: "ScreenShareControlView",
    props: {
        type: {
            required: false,
            type: String,
            default: null,
        },
    },
    data() {
        return {
            session: null,
            screenShareCheckIntervalId: 0,
            screenShareActiveTime: -1,
            isScreenSharePaused: false,
        }
    },

    mounted() {
        this.session = avenginekit.getCurrentSession();
        this.screenShareCheckIntervalId = setInterval(() => {
            if (this.screenShareActiveTime !== -1) {
                if (this.screenShareActiveTime === this.$refs.screenShareVideo.currentTime) {
                    if (!this.isScreenSharePaused) {
                        this.isScreenSharePaused = true;
                        console.log('屏幕共享暂停');
                    }
                } else {
                    if (this.isScreenSharePaused) {
                        this.isScreenSharePaused = false;
                        console.log('屏幕共享恢复');
                    }
                }
            }
            this.screenShareActiveTime = this.$refs.screenShareVideo.currentTime;
        }, 1000)
    },
    beforeDestroy() {
        clearInterval(this.screenShareCheckIntervalId);
    },

    methods: {
        audioMute() {
            this.session.muteAudio(!this.session.audioMuted);
        },

        videoMute() {
            // this.stopScreenShare();
            // this.session.muteVideo(false);
            // this.$parent.$forceUpdate();

            this.$parent.test();

        },

        stopScreenShare() {
            this.session.stopScreenShare();
            AvEngineKitProxy.emitToMain('stop-screen-share', {type: this.type})
            // 不太明白session明显变动了，但父组件没有去刷新，所以强制刷新下
            // 奇怪：直接用音视频SDK源码调试的时候，会正常刷新，但有编译出的SDK时，就不会刷新
            this.$parent.$forceUpdate();
        }
    }
}
</script>

<style scoped>

.screen-share-action-container {
    width: 100%;
    height: 100px;
    position: absolute;
    top: 30px;
    left: 0;
    display: flex;
    justify-content: space-around;
    z-index: 100;
    padding: 10px 0;
    background: #2d3033;
}

.screen-share-action-container .action {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    font-size: 12px;
    color: white;
}

.action-img {
    width: 60px;
    height: 60px;
}
</style>
