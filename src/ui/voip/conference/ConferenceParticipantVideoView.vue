<template>
    <div class="participant-video-item"
         v-bind:class="{highlight: participant._volume > 0}">
        <video v-if="!participant._isAudience && !participant._isVideoMuted && participant._stream"
               @dblclick="onDbClickVideo"
               class="video"
               v-bind:style="{objectFit:participant._isScreenSharing ? 'contain' : 'fit'}"
               :srcObject.prop="participant._stream"
               playsInline
               :muted="participant.uid === selfUserId"
               autoPlay/>
        <div v-else
             class="avatar-container">
            <img class="avatar" :src="participant.portrait" :alt="participant">
        </div>
        <audio v-if="!participant._isAudience && participant.uid !== selfUserId && participant._stream"
               :srcObject.prop="participant._stream"
               autoPlay/>
        <div v-if="!participant._isVideoMuted" class="video-stream-tip-container">
            <p>{{ '双击视频，将其设置为焦点' }}</p>
        </div>
        <div class="info-container">
            <i v-if="participant._isHost" class="icon-ion-person"></i>
            <i v-if="participant._isAudioMuted" class="icon-ion-ios-mic-off" style="color: white"></i>
            <i v-else class="icon-ion-ios-mic"></i>
            <div>{{ userName(participant) }}</div>
        </div>
    </div>

</template>

<script>
import CallState from "../../../wfc/av/engine/callState";
import VideoType from "../../../wfc/av/engine/videoType";
import wfc from "../../../wfc/client/wfc";
import conferenceManager from "./conferenceManager";
import IpcSub from "../../../ipc/ipcSub";

export default {
    name: "ConferenceParticipantVideoView",
    props: {
        participant: {
            type: Object,
            required: true
        },
        session: {
            type: Object,
            required: true,
        }
    },
    data() {
        return {
            status: CallState.STATUS_CONNECTING,
            selfUserId: conferenceManager.selfUserId,
        }
    },
    // created() {
    //     console.log('------------- videoView created', this.participant.uid);
    //     if (this.selfUserId !== this.participant.uid) {
    //         if (!this.participant._isVideoMuted) {
    //             this.session.setParticipantVideoType(this.participant.uid, this.participant._isScreenSharing, VideoType.BIG_STREAM);
    //         }
    //     }
    // },
    // destroyed() {
    //     console.log('------------- videoView destroyed', this.$parent.currentLayout, this.layoutMode, this.participant.uid);
    //     // fixme
    //     // 切换布局时，不取消订阅视频流
    //     // 已知问题，演讲者模式时，会订阅所有的视频流；从演讲者模式，切换到宫格布局时，会保持订阅所有的视频流，直到切换宫格布局的页面时，才会取消订阅一些看不见的流
    //     if (this.$parent.currentLayout !== this.currentLayout) {
    //         return;
    //     }
    //     if (this.selfUserId !== this.participant.uid) {
    //         if (!this.participant._isVideoMuted) {
    //             this.session.setParticipantVideoType(this.participant.uid, this.participant._isScreenSharing, VideoType.NONE);
    //         }
    //     }
    // },
    methods: {
        userName(user) {
            let name = '';
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

        onDbClickVideo() {
            if (conferenceManager.isOwner()) {
                conferenceManager.requestFocus(this.participant.uid);
            } else {
                if (conferenceManager.conferenceInfo.focus) {
                    this.$notify({
                        text: '主持人已设置了焦点用户',
                        type: 'warn'
                    });
                } else {
                    conferenceManager.localFocusUser = this.participant;
                }
            }
        },

        switchVideoType(userId, screenSharing) {
            if (!this.session) {
                return
            }
            let subscriber = this.session.getSubscriber(userId, screenSharing);
            if (subscriber) {
                let currentVideoType = subscriber.currentVideoType;
                let videoType = VideoType.NONE;
                if (currentVideoType === VideoType.NONE) {
                    videoType = VideoType.BIG_STREAM;
                } else if (currentVideoType === VideoType.BIG_STREAM) {
                    videoType = VideoType.SMALL_STREAM;
                } else if (videoType === VideoType.SMALL_STREAM) {
                    videoType = VideoType.NONE;
                }
                this.session.setParticipantVideoType(userId, screenSharing, videoType);
            }
        },

        switchCamera() {
            if (!this.session || this.session.isScreenSharing()) {
                return;
            }
            // The order is significant - the default capture devices will be listed first.
            // navigator.mediaDevices.enumerateDevices()
            navigator.mediaDevices.enumerateDevices().then(devices => {
                devices = devices.filter(d => d.kind === 'videoinput');
                if (devices.length < 2) {
                    console.log('switchCamera error, no more video input device')
                    return;
                }
                this.videoInputDeviceIndex++;
                if (this.videoInputDeviceIndex >= devices.length) {
                    this.videoInputDeviceIndex = 0;
                }
                this.session.setVideoInputDeviceId(devices[this.videoInputDeviceIndex].deviceId)
                console.log('setVideoInputDeviceId', devices[this.videoInputDeviceIndex]);
            })
        },
    },
}
</script>

<style scoped>
.participant-video-item {
    display: flex;
    position: relative;
    width: var(--participant-video-item-width);
    height: var(--participant-video-item-height);
    /*background-color: rebeccapurple;*/

    flex-direction: column;
    justify-content: center;
    align-items: center;
    border: 1px solid black;
    background: #2d3033;
}

.participant-video-item.highlight {
    border: 2px solid #1FCA6A;
}

.participant-video-item .video-stream-tip-container {
    display: none;
    position: absolute;
    top: 0;
    left: 0;
}

.participant-video-item .avatar-container {
    position: absolute;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #2d3033;
}

.avatar {
    width: 80px;
    height: 80px;
    border-radius: 50px;
}

.participant-video-item:hover .video-stream-tip-container {
    display: inline-block;
}

.participant-video-item .info-container {
    position: absolute;
    left: 0;
    bottom: 0;
    display: flex;
    background: gray;
    border-radius: 1px;
    padding: 5px 10px;
    justify-content: center;
    align-items: center;
    text-align: center;
}

.info-container * {
    margin: 0 5px;
}

.info-container .name {
    height: 20px;
    line-height: 20px;
    text-align: center;
}

.participant-video-item > video {
    max-width: 100%;
    max-height: 100%;
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.participant-video-item p {
    max-height: 20px;
    color: white;
}

</style>
