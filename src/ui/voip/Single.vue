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

        <div v-if="session" class="container">
            <section class="full-height full-width">
                <!--audio-->
                <div class="content-container" v-if="audioOnly">
                    <div class="local-media-container">
                        <img class="avatar" :src="session.selfUserInfo.portrait">
                        <video v-if="status === 4"
                               ref="localVideo"
                               style="height: 0"
                               :srcObject.prop="localStream"
                               muted
                               webkit-playsinline playsinline x5-playsinline preload="auto"
                               autoPlay/>
                    </div>
                    <div class="remote-media-container">
                        <img class="avatar" :src="participantUserInfo.portrait">
                        <video v-if="status ===4"
                               ref="remoteVideo"
                               class="video"
                               style="height: 0"
                               :srcObject.prop="remoteStream"
                               webkit-playsinline playsinline x5-playsinline preload="auto"
                               autoPlay/>
                        <p>{{ participantUserInfo.displayName }}</p>
                        <p v-if="status === 1">等待对方接听</p>
                        <p v-else-if="status === 2">邀请你语音聊天</p>
                        <p v-else-if="status === 3">接听中...</p>

                        <p v-if="status === 4">{{ duration }}</p>
                    </div>
                </div>

                <!--video-->
                <div v-else class="content-container">
                    <div class="local-media-container">
                        <video v-if="status === 4 || localStream"
                               ref="localVideo"
                               class="localVideo me"
                               :srcObject.prop="localStream"
                               muted
                               webkit-playsinline playsinline x5-playsinline preload="auto"
                               autoPlay/>
                        <img v-else class="avatar" :src="session.selfUserInfo.portrait">
                    </div>
                    <div class="remote-media-container">
                        <video v-if="status ===4"
                               @click="switchVideoType()"
                               ref="remoteVideo"
                               class="video"
                               :srcObject.prop="remoteStream"
                               webkit-playsinline playsinline x5-playsinline preload="auto"
                               autoPlay/>
                        <div v-else class="flex-column flex-justify-center flex-align-center">
                            <img class="avatar" :src="participantUserInfo.portrait">
                            <p>{{ participantUserInfo.displayName }}</p>
                            <p v-if="status === 1">等待对方接听</p>
                            <p v-else-if="status === 2">邀请你视频聊天</p>
                            <p v-else-if="status === 3">接听中...</p>
                        </div>
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
                    <!--          <div v-if="!audioOnly" class="action">-->
                    <!--            <img @click="down2voice" class="action-img" src='@/assets/images/av_float_audio.png'/>-->
                    <!--            <p>切换到语音聊天</p>-->
                    <!--          </div>-->
                </div>
                <!--outgoing-->
                <div v-if="status === 1" class="action-container">
                    <div class="action">
                        <img @click="hangup" class="action-img" src='@/assets/images/av_hang_up.png'/>
                    </div>
                </div>

                <!--connected-->
                <div v-if="status === 4" class="action-container">
                    <div class="action">
                        <img @click="hangup" class="action-img" src='@/assets/images/av_hang_up.png'/>
                    </div>
                    <div class="action">
                        <img v-if="!session.audioMuted" @click="mute" class="action-img" src='@/assets/images/av_mute.png'/>
                        <img v-else @click="mute" class="action-img" src='@/assets/images/av_mute_hover.png'/>
                        <p>静音</p>
                    </div>
                    <div v-if="!audioOnly && false" class="action">
                        <img @click="screenShare" class="action-img" src='@/assets/images/av_share.png'/>
                    </div>
                    <div v-if="!audioOnly" class="action">
                        <img @click="down2voice" class="action-img" src='@/assets/images/av_float_audio.png'/>
                        <p>切换到语音聊天</p>
                    </div>

                </div>
            </footer>
        </div>
    </div>
</template>

<script>
import avenginekit from "../../wfc/av/internal/engine.min";
import CallSessionCallback from "../../wfc/av/engine/callSessionCallback";
import CallState from "@/wfc/av/engine/callState";
import {isElectron} from "../../platform";
import ScreenOrWindowPicker from "./ScreenOrWindowPicker";
import VideoType from "../../wfc/av/engine/videoType";
import avenginekitproxy from "../../wfc/av/engine/avenginekitproxy";

export default {
    name: 'Single',
    data() {
        return {
            session: null,
            audioOnly: false,
            participantUserInfos: [],
            muted: false,
            status: 4,
            startTimestamp: 0,
            currentTimestamp: 0,
            localStream: null,
            remoteStream: null,
            videoInputDeviceIndex: 0,
            autoPlayInterval: 0,
        }
    },
    methods: {
        autoPlay() {
            if (isElectron()) {
                return;
            }
            console.log('can play');
            if (!this.autoPlayInterval) {
                this.autoPlayInterval = setInterval(() => {
                    try {
                        if (this.$refs.localVideo && this.$refs.localVideo.paused) {
                            this.$refs.localVideo.play();
                            console.log('can play local');
                        }
                        if (this.$refs.remoteVideo && this.$refs.remoteVideo.paused) {
                            this.$refs.remoteVideo.play();
                            console.log('can play remote');
                        }
                    } catch (e) {
                        // do nothing
                    }

                    if (this.$refs.localVideo && !this.$refs.localVideo.paused && this.$refs.remoteVideo && !this.$refs.remoteVideo.paused) {
                        clearInterval(this.autoPlayInterval);
                        this.autoPlayInterval = 0;
                    }
                }, 100);
            }
        },
        switchVideoType() {
            if (!this.session) {
                return
            }
            let userId = this.session.getParticipantIds()[0];
            let subscriber = this.session.getSubscriber(userId, false);
            if (subscriber) {
                let currentVideoType = subscriber.currentVideoType;
                let videoType = VideoType.NONE;
                if (currentVideoType === VideoType.NONE) {
                    videoType = VideoType.BIG_STREAM;
                } else if (currentVideoType === VideoType.BIG_STREAM) {
                    videoType = VideoType.SMALL_STREAM;
                } else if (currentVideoType === VideoType.SMALL_STREAM) {
                    videoType = VideoType.NONE;
                }
                console.log('setParticipantVideoType', userId, videoType);
                this.session.setParticipantVideoType(userId, false, videoType);
            }
        },
        setupSessionCallback() {
            let sessionCallback = new CallSessionCallback();

            // 可能回调多次
            sessionCallback.didChangeState = (state) => {
                this.status = state;
                console.log('didChangeState', state)
                if (state === CallState.STATUS_CONNECTED) {
                    if (this.startTimestamp === 0) {
                        this.startTimestamp = new Date().getTime();
                        this.timer = setInterval(() => {
                            this.currentTimestamp = new Date().getTime();
                        }, 1000)
                    }
                } else if (state === CallState.STATUS_IDLE) {
                    if (this.timer) {
                        clearInterval(this.timer);
                    }
                }

                console.log('status change', state)
            };

            sessionCallback.onInitial = (session, selfUserInfo, initiatorUserInfo, participantUserInfos) => {
                this.session = session;
                this.audioOnly = session.audioOnly;
                this.participantUserInfos = [...participantUserInfos];
            };

            sessionCallback.didChangeMode = (audioOnly) => {
                this.audioOnly = audioOnly;
            };

            sessionCallback.didCreateLocalVideoTrack = (stream) => {
                this.localStream = stream;
                this.autoPlay();
            };

            sessionCallback.didReceiveRemoteVideoTrack = (userId, stream) => {
                this.remoteStream = stream;
                this.autoPlay();
            };

            sessionCallback.didCallEndWithReason = (reason) => {
                console.log('callEndWithReason', reason)
                this.session.closeVoipWindow();
                this.session = null;
            }
            sessionCallback.didVideoMuted = (userId, muted) => {
                console.log('didVideoMuted', userId, muted);
                this.muted = muted;
            };
            sessionCallback.didMediaLostPacket = (media, lostPacket) => {
                if (lostPacket > 6) {
                    console.log('您的网络不好');
                }
            };

            sessionCallback.didUserMediaLostPacket = (userId, media, lostPacket, uplink) => {
                //如果uplink ture对方网络不好，false您的网络不好
                //接收方丢包超过10为网络不好
                if (lostPacket > 10) {
                    if (uplink) {
                        console.log('对方网络不好');
                    } else {
                        console.log('您的网络不好');
                    }
                }
            };
            sessionCallback.didParticipantConnected = (userId) => {
                console.log('didParticipantConnected', userId)
            }

            sessionCallback.didReportAudioVolume = (userId, volume) => {
                // console.log('didReportAudioVolume', userId, volume)
            }
            avenginekit.sessionCallback = sessionCallback;
        },

        answer() {
            this.session.call();
        },

        hangup() {
            this.session.hangup();
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

        mute() {
            let enable = this.session.audioMuted ? true : false;
            this.session.selfUserInfo._isAudioMuted = !enable;
            this.session.setAudioEnabled(enable)
        },

        down2voice() {
            this.session.downgrade2Voice();
        },
        screenShare() {
            if (this.session.isScreenSharing()) {
                this.session.stopScreenShare();
            } else {
                if (isElectron()) {
                    let beforeClose = (event) => {
                        // What a gamble... 50% chance to cancel closing
                        if (!event.params) {
                            return;
                        }
                        if (event.params.source) {
                            let source = event.params.source;
                            let desktopShareOptions = {
                                sourceId: source.id,
                                // minWidth: 1280,
                                // maxWidth: 1280,
                                // minHeight: 720,
                                // maxHeight: 720
                            }
                            this.session.startScreenShare(desktopShareOptions);
                        }
                    };
                    this.$modal.show(
                        ScreenOrWindowPicker,
                        {}, {
                            width: 360,
                            height: 620,
                            name: 'screen-window-picker-modal',
                            clickToClose: false,
                        }, {
                            // 'before-open': beforeOpen,
                            'before-close': beforeClose,
                            // 'closed': closed,
                        })
                } else {
                    this.session.startScreenShare();
                }
            }
        },
        timestampFormat(timestamp) {
            timestamp = ~~(timestamp / 1000);
            let str = ''
            let hour = ~~(timestamp / 3600);
            str = hour > 0 ? ((hour < 10 ? "0" : "") + hour + ':') : '';
            let min = ~~((timestamp % 3600) / 60);
            str += (min < 10 ? "0" : "") + min + ':'
            let sec = ~~((timestamp % 60));
            str += (sec < 10 ? "0" : "") + sec
            return str;
        }
    },

    mounted() {
        // 必须
        avenginekit.setup();
        this.setupSessionCallback();

        if (!isElectron()) {
            this.$nextTick(() => {
                // 解决弱网，首次可能无法正常音视频通话问题
                const urlParams = new URLSearchParams(window.location.href);
                let options = urlParams.get('options');
                console.log('parse queries')
                options = JSON.parse(decodeURIComponent(options));
                const symbols = Object.getOwnPropertySymbols(avenginekitproxy.events);
                let listenersSymbol;
                for (const symbol of symbols) {
                    if (symbol.description === 'listeners') {
                        listenersSymbol = symbol;
                        break;
                    }
                }
                if (listenersSymbol) {
                    let listeners = avenginekitproxy.events[listenersSymbol];
                    console.log('listeners', listenersSymbol, listeners);
                    let ls = listeners[options.event];
                    for (const l of ls) {
                        l(options.event, options.args);
                        console.log('handle voip event', options);
                    }
                }
            })
        }
    },

    computed: {
        participantUserInfo() {
            return this.session.participantUserInfos[0];
        },

        duration() {
            if (this.currentTimestamp <= 0) {
                return '00:00'
            }
            let escapeMillis = this.currentTimestamp - this.startTimestamp;
            return this.timestampFormat(escapeMillis)
        }
    },

}
</script>

<style lang="css" scoped>

.container {
    width: 100vw;
    height: 100vh;
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
    color: white;
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

.remote-media-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    color: white;
    /*background-color: rebeccapurple;*/
}


.local-media-container {
    position: absolute;
    top: 0;
    left: 0;
}

.local-media-container .avatar {
    margin-left: 20px;
    margin-top: 20px;
}

.localVideo {
    width: 200px;
    height: auto;
    position: absolute;
    top: 0;
    background-color: #cccccc;
    left: 0;
}

.localVideo.me {
    -webkit-transform: scaleX(-1);
    transform: scaleX(-1);
}

.video {
    width: 100%;
    height: 100%;
}

</style>
