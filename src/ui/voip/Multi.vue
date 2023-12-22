<!--export default class CallState {-->
<!--static STATUS_IDLE = 0;-->
<!--static STATUS_OUTGOING = 1;-->
<!--static STATUS_INCOMING = 2;-->
<!--static STATUS_CONNECTING = 3;-->
<!--static STATUS_CONNECTED = 4;-->
<!--}-->
<template>
    <div class="flex-column flex-align-center flex-justify-center" style="width: 100%; height: 100%">
        <h1 style="display: none">Voip-Multi 运行在新的window，和主窗口数据是隔离的！！</h1>

        <p class="webrtc-tip" v-if="showWebrtcTip">
            上线前，请部署 turn 服务，野火官方 turn 服务只能开发测试使用!!!
        </p>
        <div v-if="session" class="container">
            <section>
                <!--audio-->
                <div class="content-container">
                    <!--self-->
                    <div class="participant-container">
                        <div v-if="audioOnly || !selfUserInfo._stream || selfUserInfo._isVideoMuted"
                             class="flex-column flex-justify-center flex-align-center">
                            <img class="avatar" :src="selfUserInfo.portrait">
                            <video v-if="audioOnly && selfUserInfo._stream"
                                   class="hidden-video"
                                   :srcObject.prop="selfUserInfo._stream"
                                   muted
                                   webkit-playsinline playsinline x5-playsinline preload="auto"
                                   autoPlay/>
                            <p>我</p>
                        </div>
                        <video v-else
                               class="video me"
                               ref="localVideo"
                               :srcObject.prop="selfUserInfo._stream"
                               muted
                               webkit-playsinline playsinline x5-playsinline preload="auto"
                               autoPlay/>
                    </div>

                    <!--participants-->
                    <div v-for="(participant) in participantUserInfos" :key="participant.uid"
                         class="participant-container">
                        <div v-if="audioOnly || status !== 4 || !participant._stream || participant._isVideoMuted"
                             class="flex-column flex-justify-center flex-align-center">
                            <img class="avatar" :src="participant.portrait" :alt="participant">
                            <video v-if="audioOnly && participant._stream"
                                   class="hidden-video"
                                   :srcObject.prop="participant._stream"
                                   webkit-playsinline playsinline x5-playsinline preload="auto"
                                   autoPlay/>
                            <p class="single-line">{{ userName(participant) }}</p>
                        </div>
                        <video v-else
                               class="video"
                               @click="switchVideoType(participant.uid, participant._isScreenSharing)"
                               :srcObject.prop="participant._stream"
                               webkit-playsinline playsinline x5-playsinline preload="auto"
                               autoPlay/>
                    </div>
                    <!--add more-->
                    <!--通话建立成功之后，才允许邀请新参与者-->
                    <div v-if="status === 4/*connect*/ && participantUserInfos.length < 8"
                         class="participant-container">
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
                <div v-if="status === 4" class="duration-action-container">
                    <p>{{ duration }}</p>
                    <div class="action-container">

                        <div class="action">
                            <img @click="hangup" class="action-img" src='@/assets/images/av_hang_up.png'/>
                        </div>
                        <div class="action">
                            <img v-if="!session.audioMuted" @click="mute" class="action-img"
                                 src='@/assets/images/av_mute.png'/>
                            <img v-else @click="mute" class="action-img" src='@/assets/images/av_mute_hover.png'/>
                            <p>静音</p>
                        </div>
                        <div v-if="!session.audioOnly" class="action">
                            <img v-if="!session.videoMuted" @click="muteVideo" class="action-img"
                                 src='@/assets/images/av_conference_video.png'/>
                            <img v-else @click="muteVideo" class="action-img"
                                 src='@/assets/images/av_conference_video_mute.png'/>
                            <p>关闭摄像头</p>
                        </div>
                        <div v-if="!audioOnly && false" class="action">
                            <img @click="screenShare" class="action-img" src='@/assets/images/av_share.png'/>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    </div>
</template>

<script>
import avenginekit from "../../wfc/av/internal/engine.min";
import CallSessionCallback from "../../wfc/av/engine/callSessionCallback";
import CallState from "../../wfc/av/engine/callState";
import {isElectron} from "../../platform";
import ScreenOrWindowPicker from "./ScreenOrWindowPicker";
import MultiCallOngoingMessageContent from "../../wfc/av/messages/multiCallOngoingMessageContent";
import VideoType from "../../wfc/av/engine/videoType";
import wfc from "../../wfc/client/wfc";
import Config from "../../config";

export default {
    name: 'Multi',
    data() {
        return {
            session: null,
            audioOnly: false,
            status: 1,
            selfUserInfo: null,
            initiatorUserInfo: null,
            participantUserInfos: [],
            groupMemberUserInfos: [],

            startTimestamp: 0,
            currentTimestamp: 0,
            videoInputDeviceIndex: 0,
            broadcastMultiCallOngoingTimer: 0,
            autoPlayInterval: 0,
            showWebrtcTip: false,

            ringAudio: null,
        }
    },
    methods: {
        // 用来解决 iOS 上，不能自动播放问题
        autoPlay() {
            if (isElectron()) {
                return;
            }
            console.log('auto play');
            if (!this.autoPlayInterval) {
                this.autoPlayInterval = setInterval(() => {
                    try {
                        let videos = document.getElementsByTagName('video');
                        let allPlaying = true;
                        for (const video of videos) {
                            if (video.paused) {
                                allPlaying = false;
                                break;
                            }
                        }
                        // participantUserInfos 不包含自己
                        if (allPlaying && videos.length === this.participantUserInfos.length + 1) {
                            clearInterval(this.autoPlayInterval);
                            this.autoPlayInterval = 0;
                            console.log('auto play, allPlaying', videos.length);
                            return;
                        }

                        for (const video of videos) {
                            if (video.paused) {
                                video.play();
                            }
                        }
                    } catch (e) {
                        // do nothing
                    }

                }, 100);
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
                } else if (currentVideoType === VideoType.SMALL_STREAM) {
                    videoType = VideoType.NONE;
                }
                this.session.setParticipantVideoType(userId, screenSharing, videoType);
            }
        },
        setupSessionCallback() {
            let sessionCallback = new CallSessionCallback();

            sessionCallback.didChangeState = (state) => {
                this.status = state;
                // 响铃示例代码
                if (state === CallState.STATUS_OUTGOING) {
                    console.log('start outgoing ring')
                    this.ringAudio = new Audio(require("@/assets/audios/outgoing_call_ring.mp3"))
                    this.ringAudio.loop = true;
                    this.ringAudio.play();
                } else if (state === CallState.STATUS_INCOMING) {
                    // 由于浏览器的限制，web 端，可能不能自动播放！！!
                    // 另外，微信收到音视频通话邀请时，也没有声音
                    // this.ringAudio = new Audio(require("@/assets/audios/incoming_call_ring.mp3"))
                    // this.ringAudio.loop = true;
                    // this.ringAudio.play();
                } else {
                    if (this.ringAudio) {
                        this.ringAudio.pause();
                        this.ringAudio = null;
                    }
                }

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
            };

            sessionCallback.onInitial = (session, selfUserInfo, initiatorUserInfo, participantUserInfos, groupMemberUserInfos) => {
                this.session = session;


                this.audioOnly = session.audioOnly;
                this.selfUserInfo = selfUserInfo;
                this.initiatorUserInfo = initiatorUserInfo;
                // 为了逻辑更清晰，参数引用传递，参数中传入的participantUserInfos会变化，如果直接使用的话，didParticipantJoined里面，可啥都不做
                this.participantUserInfos = [...participantUserInfos];
                this.groupMemberUserInfos = groupMemberUserInfos;

                // pls refer to: https://vuejs.org/v2/guide/reactivity.html
                this.$set(this.selfUserInfo, '_stream', null)
                this.participantUserInfos.forEach(p => this.$set(p, "_stream", null))
                this.groupMemberUserInfos.forEach(m => this.$set(m, "_stream", null))

                if (Config.ENABLE_MULTI_CALL_AUTO_JOIN && selfUserInfo.uid === initiatorUserInfo.uid) {
                    this.broadcastMultiCallOngoingTimer = setInterval(this.broadcastMultiCallOngoing, 1000)
                }
            };

            sessionCallback.didChangeMode = (audioOnly) => {
                this.audioOnly = audioOnly;
            };

            sessionCallback.didCreateLocalVideoTrack = (stream) => {
                this.selfUserInfo._stream = stream;
                this.autoPlay();
            };

            sessionCallback.didReceiveRemoteVideoTrack = (userId, stream) => {
                let p;
                for (let i = 0; i < this.participantUserInfos.length; i++) {
                    p = this.participantUserInfos[i];
                    if (p.uid === userId) {
                        p._stream = stream;
                        break;
                    }
                }
                this.autoPlay();
            };

            sessionCallback.didParticipantJoined = (userId, screenSharing) => {
                let userInfo = wfc.getUserInfo(userId)
                console.log('didParticipantJoined', userInfo)
                userInfo._stream = null;
                this.participantUserInfos.push(userInfo);
            }

            sessionCallback.didParticipantLeft = (userId) => {
                console.log('didParticipantLeft', userId, this.participantUserInfos.length)
                this.participantUserInfos = this.participantUserInfos.filter(p => p.uid !== userId);
                console.log('didParticipantLeft d', userId, this.participantUserInfos.length)
            }

            sessionCallback.didCallEndWithReason = (reason) => {
                console.log('callEndWithReason', reason)
                this.session.closeVoipWindow();
                this.session = null;
            }

            sessionCallback.didVideoMuted = (userId, muted) => {
                console.log('didVideoMuted', userId, muted)
                if (userId === this.selfUserInfo.uid) {
                    this.selfUserInfo._isVideoMuted = muted;
                } else {
                    this.participantUserInfos.forEach(u => {
                        if (u.uid === userId) {
                            u._isVideoMuted = muted;
                        }
                    })
                }
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
                        let userInfos = this.participantUserInfos.filter(u => u.uid === userId);
                        if (userInfos && userInfos.length > 0) {
                            console.log(userInfos[0].displayName, "网络不好");
                        }
                    } else {
                        console.log('您的网络不好');
                    }
                }
            };
            sessionCallback.didChangeInitiator = (initiator) => {
                this.initiatorUserInfo = wfc.getUserInfo(initiator);
                if (!this.broadcastMultiCallOngoingTimer) {
                    this.broadcastMultiCallOngoingTimer = setInterval(this.broadcastMultiCallOngoing, 200)
                }
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
            let toMute = this.session.audioMuted ? false : true;
            this.selfUserInfo._isAudioMuted = toMute;
            this.session.muteAudio(toMute)
        },

        muteVideo() {
            let toMute = this.session.videoMuted ? false : true;
            this.selfUserInfo._isVideoMuted = toMute;
            this.session.muteVideo(toMute)
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
                                minWidth: 1280,
                                maxWidth: 1280,
                                minHeight: 720,
                                maxHeight: 720
                            }
                            this.session.startScreenShare(desktopShareOptions);
                        }
                    };
                    this.$modal.show(
                        ScreenOrWindowPicker,
                        {}, {
                            width: 800,
                            height: 600,
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

        invite() {
            let successCB = users => {
                let userIds = users.map(u => u.uid);
                this.session.inviteNewParticipants(userIds);
            }
            this.$pickContact({
                successCB,
                users: this.session.groupMemberUserInfos,
                initialCheckedUsers: [...this.session.participantUserInfos, this.session.selfUserInfo],
                uncheckableUsers: [...this.session.participantUserInfos, this.session.selfUserInfo],
                showCategoryLabel: false,
                confirmTitle: '确定',
            });
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
        },

        broadcastMultiCallOngoing() {
            let participants = this.participantUserInfos.map(pu => pu.uid).filter(uid => uid !== this.selfUserInfo.uid)
            let ongoing = new MultiCallOngoingMessageContent(this.session.callId, this.session.initiatorId, this.session.audioOnly, participants);
            wfc.sendConversationMessage(this.session.conversation, ongoing);
        }
    },

    computed: {
        duration() {
            if (this.currentTimestamp <= 0) {
                return '00:00'
            }
            let escapeMillis = this.currentTimestamp - this.startTimestamp;
            return this.timestampFormat(escapeMillis)
        }
    },

    mounted() {
        let supportConference = avenginekit.startConference !== undefined
        if (!supportConference) {
            let host = window.location.host;
            if (host.indexOf('wildfirechat.cn') === -1 && host.indexOf('localhost') === -1) {
                for (const ice of Config.ICE_SERVERS) {
                    if (ice[0].indexOf('turn.wildfirechat.net') >= 0) {
                        // 显示自行部署 turn 提示
                        this.showWebrtcTip = true;
                        setTimeout(() => {
                            this.showWebrtcTip = false;
                        }, 10 * 1000)
                        break
                    }
                }
            }
        }

        if (isElectron()) {
            avenginekit.setup();
        }
        this.setupSessionCallback();
    },

    destroyed() {
        // reset
        this.$set(this.selfUserInfo, '_stream', null)
        this.groupMemberUserInfos.forEach(m => this.$set(m, "_stream", null))
        if (this.broadcastMultiCallOngoingTimer) {
            clearInterval(this.broadcastMultiCallOngoingTimer);
        }
    }
}
</script>

<style lang="css" scoped>

.container {
    width: 100%;
    height: 100%;
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
    align-items: center;
}

.participant-container {
    display: flex;
    width: 200px;
    height: 220px;
    /*background-color: rebeccapurple;*/

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

.hidden-video {
    height: 0;
}

.participant-container p {
    max-height: 20px;
    color: white;
}

footer {
    height: 160px;
}

.duration-action-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

.duration-action-container p {
    color: white;
    padding: 10px 0;
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
    color: white;
}

.avatar {
    width: 200px;
    height: 200px;
}

.action-img {
    width: 60px;
    height: 60px;
}

.video.me {
    -webkit-transform: scaleX(-1);
    transform: scaleX(-1);
}

.webrtc-tip {
    position: absolute;
    color: red;
    left: 0;
    top: 0;
    z-index: 999;
}
</style>
