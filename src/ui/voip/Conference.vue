<!--export default class CallState {-->
<!--static STATUS_IDLE = 0;-->
<!--static STATUS_OUTGOING = 1;-->
<!--static STATUS_INCOMING = 2;-->
<!--static STATUS_CONNECTING = 3;-->
<!--static STATUS_CONNECTED = 4;-->
<!--}-->
<template>
    <div class="flex-column flex-align-center flex-justify-center voip-container" ref="contentContainer">
        <div v-if="sharedMiscState.isElectron" ref="notClickThroughArea">
            <ElectronWindowsControlButtonView style="position: absolute; top: 0; left: 0; width: 100%; height: 30px"
                                              :title="'野火会议'"
                                              :macos="!sharedMiscState.isElectronWindowsOrLinux"/>
            <ScreenShareControlView v-if="session && session.isScreenSharing()" type="conference"/>
            <h1 style="display: none">Voip-Conference 运行在新的window，和主窗口数据是隔离的！！</h1>

        </div>
        <div v-if="session" class="conference-container"
             v-bind:style="{display: session.isScreenSharing() && sharedMiscState.isElectron ? 'none' : 'flex'}">
            <div class="conference-main-content-container">
                <!--main-->
                <!--video-->
                <div v-if="!audioOnly" style="width: 100%; height: 100%">
                    <section class="content-container video">
                        <!--self-->
                        <div v-if="!session.audience" class="participant-video-item"
                             v-bind:class="{highlight: selfUserInfo._volume > 0}">
                            <div
                                v-if="!selfUserInfo._stream || (session.videoMuted && !session.isScreenSharing())"
                                class="flex-column flex-justify-center flex-align-center">
                                <img class="avatar" :src="selfUserInfo.portrait">
                            </div>
                            <video v-else
                                   class="video"
                                   v-bind:style="{transform:!session.isScreenSharing() ? 'scaleX(-1)' :'none','-webkit-transform': !session.isScreenSharing() ? 'scaleX(-1)' :'none'}"
                                   ref="localVideo"
                                   :srcObject.prop="selfUserInfo._stream"
                                   playsInline
                                   muted
                                   autoPlay/>
                            <div class="info-container">
                                <i v-if="selfUserInfo._isHost" class="icon-ion-person"></i>
                                <div>{{ userName(selfUserInfo) }}</div>
                            </div>
                        </div>

                        <!--participants-->
                        <div v-for="(participant) in participantUserInfos.filter(u => !u._isAudience)"
                             :key="participant.uid"
                             class="participant-video-item"
                             v-bind:class="{highlight: participant._volume > 0}"
                        >
                            <video v-if="!participant._isVideoMuted"
                                   @click="setUseMainVideo(participant.uid)"
                                   class="video"
                                   :srcObject.prop="participant._stream"
                                   playsInline
                                   autoPlay/>
                            <audio v-else
                                   :srcObject.prop="participant._stream"
                                   autoPlay/>
                            <div v-if="status !== 4 || !participant._stream || participant._isVideoMuted"
                                 class="avatar-container">
                                <img class="avatar" :src="participant.portrait" :alt="participant">
                            </div>
                            <div v-if="!participant._isVideoMuted" class="video-stream-tip-container">
                                <p>点击视频，切换清晰度</p>
                            </div>
                            <div class="info-container">
                                <i v-if="participant._isHost" class="icon-ion-person"></i>
                                <i v-if="!participant._isVideoMuted" class="icon-ion-ios-videocam"></i>
                                <div>{{ userName(participant) }}</div>
                            </div>
                        </div>
                    </section>
                </div>
                <!--audio-->
                <div v-else style="width: 100%; height: 100%">
                    <div
                        style="background: white; height: 50px; display: flex; justify-content: center; align-items: center">
                        <div
                            style="background: #daeafe; width: 300px; height: 40px; padding: 0 5px; border-radius: 3px; display: flex; flex-direction: column; justify-content: center">
                            <p class="single-line"> {{ '正在讲话: ' + speakingUserName }}</p>
                        </div>
                    </div>
                    <section class="content-container audio">
                        <!--self-->
                        <div v-if="!session.audience" class="participant-audio-item">
                            <video v-if="audioOnly && selfUserInfo._stream"
                                   class="hidden-video"
                                   :srcObject.prop="selfUserInfo._stream"
                                   muted
                                   playsInline autoPlay/>
                            <div style="position: relative">
                                <img class="avatar"
                                     v-bind:class="{highlight:selfUserInfo._volume > 0}"
                                     :src="selfUserInfo.portrait">
                                <i v-if="selfUserInfo._isHost" class="host-indicator icon-ion-person"></i>
                            </div>
                            <p class="single-line">{{ userName(selfUserInfo) }}</p>
                        </div>
                        <!--participants-->
                        <div v-for="(participant) in participantUserInfos.filter(u => !u._isAudience)"
                             :key="participant.uid"
                             class="participant-audio-item">
                            <video v-if="audioOnly && participant._stream"
                                   class="hidden-video"
                                   :srcObject.prop="participant._stream"
                                   playsInline autoPlay/>
                            <div style="position: relative">
                                <img class="avatar"
                                     v-bind:class="{highlight:participant._volume > 0}"
                                     :src="participant.portrait" :alt="participant">
                                <i v-if="participant._isHost" class="host-indicator icon-ion-person"></i>
                            </div>
                            <p class="single-line">{{ userName(participant) }}</p>
                        </div>
                    </section>
                </div>
                <!--actions-->
                <footer>
                    <div class="duration-action-container">
                        <p>{{ duration }}</p>
                        <div class="action-container">
                            <div class="action" v-if="!session.audience">
                                <img v-if="!session.audioMuted" @click="mute" class="action-img"
                                     src='@/assets/images/av_conference_audio.png'/>
                                <img v-else @click="mute" class="action-img"
                                     src='@/assets/images/av_conference_audio_mute.png'/>
                                <p>静音</p>
                            </div>
                            <div class="action"
                                 v-if="!session.audience && !session.audioOnly && !session.isScreenSharing()">
                                <img v-if="!session.videoMuted" @click="muteVideo" class="action-img"
                                     src='@/assets/images/av_conference_video.png'/>
                                <img v-else @click="muteVideo" class="action-img"
                                     src='@/assets/images/av_conference_video_mute.png'/>
                                <p>视频</p>
                            </div>
                            <div v-if="!session.audience && !audioOnly" class="action">
                                <img v-if="!session.screenSharing" @click="screenShare"
                                     class="action-img"
                                     src='@/assets/images/av_conference_screen_sharing.png'/>
                                <img v-else @click="screenShare" class="action-img"
                                     src='@/assets/images/av_conference_screen_sharing_hover.png'/>
                                <p class="single-line">共享屏幕</p>
                            </div>
                            <div class="action">
                                <img @click.stop="members" class="action-img"
                                     src='@/assets/images/av_conference_members.png'/>
                                <p>管理</p>
                            </div>
                            <div class="action">
                                <img @click="hangup" class="action-img"
                                     src='@/assets/images/av_conference_end_call.png'/>
                                <p>结束</p>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>

            <div class="participant-list-container"
                 v-if="showParticipantList"
                 v-bind:class="{ active: showParticipantList}"
                 v-click-outside="hideParticipantList"
            >
                <div v-if="true" @click="invite"
                     class="action-item">
                    <div class="icon">+</div>
                    <p>邀请新参与者</p>
                </div>
                <div v-if="false" @click="invite"
                     class="action-item">
                    <div class="icon">-</div>
                    <p>移除参与者</p>
                </div>
                <ul>
                    <li v-for="user in computedParticipants" :key="user.uid">
                        <tippy
                            :to="'user-' + user.uid"
                            interactive
                            theme="light"
                            :animate-fill="false"
                            placement="left"
                            distant="7"
                            animation="fade"
                            trigger="click"
                        >
                            <UserCardView :user-info="user" v-on:close="closeUserCard(user)"/>
                        </tippy>
                        <div class="participant-user"
                             :ref="'userCardTippy-'+user.uid"
                             :name="'user-'+user.uid">
                            <div class="avatar-container">
                                <img class="avatar" :src="user.portrait" alt="">
                                <div v-if=" selfUserInfo._isHost && !user._isHost" @click.stop="kickoff(user)"
                                     class="icon">
                                    -
                                </div>
                            </div>
                            <span class="single-line name"> {{ userName(user) }}</span>
                            <span class="single-line label host"
                                  v-if="user._isHost">主持人</span>
                            <span v-else class="single-line label"
                                  @click.stop="requestChangeMode(user)"
                                  v-bind:class="{audience: user._isAudience}">{{
                                    user._isAudience ? '听众' : '互动成员'
                                }}</span>
                        </div>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script>
import avenginekit from "../../wfc/av/internal/engine.min";
import CallSessionCallback from "../../wfc/av/engine/CallSessionCallback";
import CallState from "@/wfc/av/engine/callState";
import IpcSub from "../../ipc/ipcSub";
import ClickOutside from 'vue-click-outside'
import UserCardView from "../main/user/UserCardView";
import ConferenceInviteMessageContent from "../../wfc/av/messages/conferenceInviteMessageContent";
import localStorageEmitter from "../../ipc/localStorageEmitter";
import {currentWindow, isElectron, remote} from "../../platform";
import ScreenOrWindowPicker from "./ScreenOrWindowPicker";
import CallEndReason from "../../wfc/av/engine/callEndReason";
import ScreenShareControlView from "./ScreenShareControlView";
import avenginekitproxy from "../../wfc/av/engine/avenginekitproxy";
import ElectronWindowsControlButtonView from "../common/ElectronWindowsControlButtonView";
import store from "../../store";

export default {
    name: 'Conference',
    data() {
        return {
            session: null,
            audioOnly: false,
            muted: false,
            status: 1,
            selfUserInfo: null,
            initiatorUserInfo: null,
            participantUserInfos: [],

            startTimestamp: 0,
            currentTimestamp: 0,
            ddd: '',

            showParticipantList: false,
            sharedMiscState: store.state.misc,
        }
    },
    components: {ScreenShareControlView, UserCardView, ElectronWindowsControlButtonView},
    methods: {
        setUseMainVideo(userId) {
            if (!this.session) {
                return
            }
            let client = this.session.getClient(userId);
            if (client) {
                client.setUseMainVideo(!client.useMainVideo);
            }
        },
        setupSessionCallback() {
            let sessionCallback = new CallSessionCallback();

            sessionCallback.didChangeState = (state) => {
                this.status = state;
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

            sessionCallback.onInitial = (session, selfUserInfo, initiatorUserInfo) => {
                this.session = session;

                this.audioOnly = session.audioOnly;
                this.selfUserInfo = selfUserInfo;
                this.selfUserInfo._isHost = session.host === selfUserInfo.uid;
                this.selfUserInfo._isAudience = session.audience;
                this.selfUserInfo._isVideoMuted = session.videoMuted;
                this.selfUserInfo._volume = 0;
                this.initiatorUserInfo = initiatorUserInfo;
                this.participantUserInfos = [];

                // pls refer to: https://vuejs.org/v2/guide/reactivity.html
                this.$set(this.selfUserInfo, '_stream', null)
                this.participantUserInfos.forEach(p => this.$set(p, "_stream", null))

            };

            sessionCallback.didChangeMode = (audioOnly) => {
                this.audioOnly = audioOnly;
            };

            sessionCallback.didCreateLocalVideoTrack = (stream) => {
                this.selfUserInfo._stream = stream;
            };

            sessionCallback.didCreateLocalVideoTrackError = () => {
                // TODO
                // 没有摄像头或者麦克风，加入会议时，会回调到此处，自己断会显示自己的头像，其他端会显示黑屏
                // 可以进行相关提示
            };

            sessionCallback.didReceiveRemoteVideoTrack = (userId, stream) => {
                let p;
                console.log('didReceiveRemoteVideoTrack', userId)
                for (let i = 0; i < this.participantUserInfos.length; i++) {
                    p = this.participantUserInfos[i];
                    if (p.uid === userId) {
                        p._stream = stream;
                        break;
                    }
                }
            };

            sessionCallback.didParticipantJoined = (userId) => {
                console.log('didParticipantJoined', userId)
                IpcSub.getUserInfos([userId], null, (userInfos) => {
                    let userInfo = userInfos[0];
                    console.log('didParticipantJoined & getUserInfos', userInfo.uid)
                    let client = this.session.getPeerConnectionClient(userId);
                    userInfo._stream = client.stream;
                    userInfo._isAudience = client.audience;
                    userInfo._isHost = this.session.host === userId;
                    userInfo._isVideoMuted = client.videoMuted;
                    userInfo._volume = 0;
                    this.participantUserInfos.push(userInfo);
                })
            }

            sessionCallback.didParticipantLeft = (userId) => {
                console.log('didParticipantLeft', userId, this.participantUserInfos.length)
                this.participantUserInfos = this.participantUserInfos.filter(p => p.uid !== userId);
                console.log('didParticipantLeft d', userId, this.participantUserInfos.length)
            }

            sessionCallback.didCallEndWithReason = (reason) => {
                console.log('callEndWithReason', reason)
                // 可以根据reason，进行一些提示
                // alert('会议已结束');
                if (reason === CallEndReason.RoomNotExist) {
                    console.log('join conference failed', reason, this.session)
                    let obj = {reason: reason, session: this.session};
                    localStorageEmitter.send('join-conference-failed', obj);
                }
                this.session.closeVoipWindow();
                this.session = null;
            }

            sessionCallback.onRequestChangeMode = (userId, audience) => {
                console.log('onRequestChangeMode', userId + ' ' + audience)
                if (audience) {
                    this.session.switchAudience(true)
                    return;
                }
                this.$alert({
                    content: '主持人邀请你参与互动',
                    cancelCallback: () => {
                        // do nothing
                    },
                    confirmCallback: () => {
                        this.session.switchAudience(false)
                    }
                })
            };

            sessionCallback.didChangeType = (userId, audience) => {
                this.participantUserInfos.forEach(u => {
                    if (u.uid === userId) {
                        u._isAudience = audience;
                    }
                })
            };

            sessionCallback.didReportAudioVolume = (userId, volume) => {
                if (userId === this.selfUserInfo.uid) {
                    this.selfUserInfo._volume = volume;
                } else {
                    this.participantUserInfos.forEach(u => {
                        if (u.uid === userId) {
                            u._volume = volume;
                        }
                    })
                }
            };

            sessionCallback.didMuteStateChanged = (participants) => {
                console.log('conference', 'didMuteStateChanged', participants)
                participants.forEach(p => {
                    this.participantUserInfos.forEach(u => {
                        if (u.uid === p) {
                            let client = this.session.getClient(p);
                            u._isVideoMuted = client.videoMuted;
                            console.log('didMuteStateChanged', client.videoMuted, client.audioMuted)
                        }
                    })

                })
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

            avenginekit.sessionCallback = sessionCallback;
        },


        answer() {
            this.session.call();
        },

        hangup() {
            this.session.leaveConference(false);
        },

        mute() {
            let enable = this.session.audioMuted ? true : false;
            this.selfUserInfo._isAudioMuted = !enable;
            this.session.setAudioEnabled(enable)
        },

        muteVideo() {
            let enable = this.session.videoMuted ? true : false;
            this.selfUserInfo._isVideoMuted = !enable;
            this.session.setVideoEnabled(enable)
        },

        down2voice() {
            this.session.downgrade2Voice();
        },

        members() {
            this.showParticipantList = !this.showParticipantList;
        },

        hideParticipantList() {
            this.showParticipantList && (this.showParticipantList = false);
        },

        invite() {
            //IpcSub.inviteConferenceParticipant(this.session)
            let callSession = this.session;
            let inviteMessageContent = new ConferenceInviteMessageContent(callSession.callId, callSession.host, callSession.title, callSession.desc, callSession.startTime, callSession.audioOnly, callSession.defaultAudience, callSession.advance, callSession.pin)
            localStorageEmitter.send('inviteConferenceParticipant', {messagePayload: inviteMessageContent.encode()})
            this.showParticipantList = false;
        },

        requestChangeMode(user) {
            if (user.uid === this.selfUserInfo.uid) {
                // TODO 需要根据实际产品定义处理，这儿直接禁止
                //this.session.switchAudience(!user._isAudience);
                return;
            }
            this.$alert({
                content: user._isAudience ? `邀请${this.userName(user)}参与互动?` : `取消${this.userName(user)}参与互动?`,
                cancelCallback: () => {
                    // do nothing
                },
                confirmCallback: () => {
                    this.session.requestChangeMode(user.uid, !user._isAudience);
                }
            })
        },

        kickoff(user) {
            this.$alert({
                content: `确认将${this.userName(user)}移除会议?`,
                cancelCallback: () => {
                    // do nothing
                },
                confirmCallback: () => {
                    this.session.kickoff(user.uid)
                }
            })
        },

        test() {
            alert('test alert')
        },
        screenShare() {
            if (this.session.audioOnly) {
                return;
            }
            if (this.session.isScreenSharing()) {
                this.session.stopScreenShare();
                // currentWindow.setIgnoreMouseEvents(false)
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
                            avenginekitproxy.emitToMain('start-screen-share', {})
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

    computed: {
        duration() {
            if (this.currentTimestamp <= 0) {
                return '00:00'
            }
            let escapeMillis = this.currentTimestamp - this.startTimestamp;
            return this.timestampFormat(escapeMillis)
        },

        computedParticipants() {
            return [...this.participantUserInfos, this.selfUserInfo];
        },

        speakingUserName() {
            let maxVolume = this.selfUserInfo._volume;
            let speakingUserInfo = this.selfUserInfo;
            this.participantUserInfos.forEach(u => {
                if (u._volume > maxVolume) {
                    speakingUserInfo = u;
                    maxVolume = u._volume;
                }
            })
            if (!maxVolume) {
                return '';
            }

            return this.userName(speakingUserInfo);
        }
    },

    watch: {
        participantUserInfos(infos) {
            if (this.audioOnly) {
                return;
            }
            let videoParticipants = infos.filter(u => !u.audience)
            let count = videoParticipants.length;
            if (!this.selfUserInfo._isAudience) {
                count++;
            }
            let width = '100%';
            let height = '100%';
            if (count <= 1) {
                width = '100%';
                height = '100%';
            } else if (count <= 4) {
                width = '50%';
                height = '45%';
            } else if (count <= 9) {
                width = '33%';
                height = '33%'
            } else {
                // max 16
                width = '25%';
                height = '25%'
            }
            if (this.$refs.contentContainer) {
                this.$refs.contentContainer.style.setProperty('--participant-video-item-width', width);
                this.$refs.contentContainer.style.setProperty('--participant-video-item-height', height);
            }
        }
    },

    directives: {
        ClickOutside
    },

    created() {
        document.title = '在线会议';
    },

    mounted() {
        avenginekit.setup();
        this.setupSessionCallback();

        if (isElectron()) {
            let listener = (ev, args) => {
                remote.getCurrentWindow().focus();
            }
            localStorageEmitter.on('inviteConferenceParticipantDone', listener)
            localStorageEmitter.on('inviteConferenceParticipantCancel', listener)
            //
            // this.$on('stop-screen-share', () => {
            //     this.session.stopScreenShare();
            //     this.$forceUpdate();
            // })

            window.addEventListener("mousemove", (event) => {
                if (!this.session.isScreenSharing()) {
                    return;
                }
                this.ddd = event.target.id;
                if (event.target.id === "main-content-container") {
                    currentWindow.setIgnoreMouseEvents(true, {forward: true});
                } else {
                    currentWindow.setIgnoreMouseEvents(false);
                }
            });
            window.addEventListener("mouseleave", (event) => {
                currentWindow.setIgnoreMouseEvents(false);
            })

            this.$refs.contentContainer.style.setProperty('--conference-container-margin-top', '30px');
        }else {
            this.$refs.contentContainer.style.setProperty('--conference-container-margin-top', '0px');
        }
    },

    destroyed() {
        // reset
        this.$set(this.selfUserInfo, '_stream', null)
        this.participantUserInfos.forEach(m => this.$set(m, "_stream", null))
    }
}
</script>

<style lang="css" scoped>
.voip-container {
    --participant-video-item-width: 100%;
    --participant-video-item-height: 100%;
    --conference-container-margin-top: 30px;
    background: #00000000 !important;
}

.conference-container {
    width: 100vw;
    margin-top: var(--conference-container-margin-top);
    height: calc(100vh - var(--conference-container-margin-top));
    display: flex;
}

.conference-main-content-container {
    width: 100%;
    height: 100%;
    position: relative;
    /*flex: 1;*/
    /*flex-direction: column;*/
    /*justify-content: space-between;*/
    /*align-items: center;*/
}

.content-container {
    width: 100%;
    height: 100%;
    position: relative;
    display: flex;
    flex: 1;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    align-content: center;

}

.content-container.video {
    background: black;
    object-fit: contain;
}

.content-container.audio {
    background: white;
    height: calc(100% - 50px);
}

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
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #2d3033;
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

.hidden-video {
    height: 0;
}

.participant-video-item p {
    max-height: 20px;
    color: white;
}

.participant-audio-item {
    display: flex;
    flex-direction: column;
    padding: 20px 40px;
    justify-content: center;
    align-items: center;
}

.participant-audio-item .host-indicator {
    width: 18px;
    height: 18px;
    position: absolute;
    left: 50%;
    color: white;
    text-align: center;
    vertical-align: center;
    border-radius: 9px;
    bottom: 0;
    background: #FD802E;
    transform: translateX(-50%) translateY(25%);
}

.participant-audio-item p {
    padding-top: 8px;
}

.conference-main-content-container:hover footer {
    width: 100%;
    display: block;
    position: absolute;
    left: 0;
    bottom: 0;
    background: gray;
}

footer {
    /*height: 100px;*/
    display: none;
}

.duration-action-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

.duration-action-container p {
    color: white;
    padding: 5px 0;
}

.action-container {
    /*width: 100%;*/
    display: flex;
    justify-content: center;
}

.action-container .action {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    font-size: 12px;
    color: white;
    padding: 0 25px 0 25px;
}

.avatar {
    width: 90px;
    height: 90px;
    border-radius: 45px;
}

.avatar.highlight {
    border: 2px solid #1FCA6A;
}

.action-img {
    width: 40px;
    height: 40px;
}

.participant-list-container {
    display: none;
    width: 250px;
    height: 100%;
    background-color: #ffffffe5;
    backdrop-filter: blur(6px);
    border-left: 1px solid #e6e6e6;
}

.participant-list-container.active {
    display: flex;
    flex-direction: column;
}

.participant-list-container .action-item {
    height: 50px;
    display: flex;
    padding: 5px 0 0 10px;
    align-items: center;
}

.participant-list-container .action-item .icon {
    width: 40px;
    height: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 3px;
    border: 1px dashed #d6d6d6;
    margin-right: 10px;
}

.participant-user {
    display: flex;
    align-items: center;
    padding: 5px 0 0 10px;
}

.participant-user .name {
    flex: 1;
}

.participant-user .label {
    color: green;
    font-size: 12px;
    border: 1px solid green;
    border-radius: 2px;
    padding: 2px 5px;
    margin-right: 10px;
}

.participant-user .audience {
    color: gray;
    border: 1px solid gray;
}

.participant-user .host {
    color: #4168e0;
    border: 1px solid #4168e0;
}


.participant-user .avatar {
    width: 40px;
    height: 40px;
    border-radius: 3px;
    margin-right: 10px;
}

.avatar-container {
    position: relative;
}

.avatar-container .icon {
    width: 40px;
    height: 40px;
    display: none;
    justify-content: center;
    align-items: center;
    border-radius: 3px;
    border: 1px dashed #d6d6d6;
    margin-right: 10px;
}

.avatar-container:hover .icon {
    display: flex;
    position: absolute;
    left: 0;
    top: 0;
    color: white;
    background: #e0d6d6d6;
}

.video.me {
    -webkit-transform: scaleX(-1);
    transform: scaleX(-1);
}
</style>
