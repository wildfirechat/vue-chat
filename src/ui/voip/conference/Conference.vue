<!--export default class CallState {-->
<!--static STATUS_IDLE = 0;-->
<!--static STATUS_OUTGOING = 1;-->
<!--static STATUS_INCOMING = 2;-->
<!--static STATUS_CONNECTING = 3;-->
<!--static STATUS_CONNECTED = 4;-->
<!--}-->
<template>
    <div class="flex-column flex-align-center flex-justify-center voip-container" style="width: 100%; height: 100%" ref="rootContainer">
        <div v-if="sharedMiscState.isElectron" ref="notClickThroughArea">
            <ElectronWindowsControlButtonView style="position: absolute; top: 0; left: 0; width: 100%; height: 30px; background: white"
                                              :title="'野火会议'"
                                              :macos="!sharedMiscState.isElectronWindowsOrLinux"/>
            <ScreenShareControlView v-if="session && session.screenSharing" type="conference"/>
            <h1 style="display: none">Voip-Conference 运行在新的window，和主窗口数据是隔离的！！</h1>
        </div>
        <div v-if="endReason !== undefined && endReason === 4" @click="rejoinConference" class="rejoin-container">
            会议断开，点击重新加入
        </div>
        <div v-if="session" class="main-slider-container"
             v-bind:style="{display: session.screenSharing && sharedMiscState.isElectron ? 'none' : 'flex'}">
            <div class="main">
                <header style="background: white; height: 20px; display: flex; justify-content: space-between">
                    <a href="#" @click.prevent>
                        <i class="icon-ion-information" style="padding: 0 10px"
                           id="info-icon"
                           v-bind:class="{active:showConferenceSimpleInfoView}"
                           @click.prevent="showConferenceSimpleInfoView = !showConferenceSimpleInfoView"/>
                    </a>
                    <p style="flex: 1"></p>
                    <p style="padding-right: 10px">{{ duration }}</p>
                    <div>
                        <a v-if="!audioOnly" href="#" @click.prevent>
                            <i class="icon-ion-grid" style="padding: 0 10px"
                               id="grid-icon"
                               v-bind:class="{active:showChooseLayoutView}"
                               @click.prevent="showChooseLayoutView = !showChooseLayoutView">宫格布局</i>
                        </a>
                        <!--                        TODO 条件显示，展示聊天界面，或者参与者列表界面时，才展示-->
                        <a href="#" v-if="showSlider" @click.prevent>
                            <i :class="showSlider? 'icon-ion-arrow-left-b' : 'icon-ion-arrow-right-b'" style="padding: 0 10px" @click="toggleSliderView"></i>
                        </a>
                    </div>
                </header>
                <div v-if="showConferenceSimpleInfoView"
                     v-v-on-click-outside="hideConferenceSimpleInfoView"
                     style="position: absolute; left: 10px; top: 50px; z-index: 1000">
                    <ConferenceSimpleInfoView
                        :session="session"
                    />
                </div>
                <div v-if="showChooseLayoutView"
                     v-v-on-click-outside="hideChooseLayoutView"
                     style="position: absolute; right: 10px; top: 50px; z-index: 1000">
                    <ChooseConferenceLayoutView
                        :current-layout="computedCurrentLayout"
                        :session="session"/>
                </div>
                <div style="position: absolute; left: 10px; bottom: 80px; width: 300px; max-height: 300px; overflow: hidden; background: transparent; z-index: 1000">
                    <ConferenceConversationFloatingView
                        :session="session"
                    />
                </div>
                <div class="conference-main-content-container">
                    <!--main-->
                    <!--video-->
                    <div v-if="!audioOnly" style="width: 100%; height: 100%">
                        <i v-if="computedCurrentLayout=== 0 && currentGridPageIndex > 0" style="position: absolute; top: 50%; left: 0; color: #c8cacc; z-index: 1000; font-size: 40px; padding: 0 10px" class="icon-ion-arrow-left-c"
                           @click="prePage"></i>
                        <i v-if="computedCurrentLayout=== 0 && currentGridPageIndex < gridPageCount - 1" style="position: absolute; top: 50%; right: 0; color: #c8cacc; z-index: 1000; font-size: 40px; padding: 0 10px" class="icon-ion-arrow-right-c"
                           @click="nextPage"></i>
                        <!--                    宫格布局-->
                        <section v-if="computedCurrentLayout=== 0" class="content-container grid video">
                            <!--participants include self-->
                            <ConferenceParticipantVideoView v-for="(participant) in currentPageParticipants"
                                                            :key="participant.uid + '-' + participant._isScreenSharing"
                                                            :participant="participant"
                                                            :session="session">
                            </ConferenceParticipantVideoView>
                        </section>

                        <!--                    演讲者布局-->
                        <section v-else class="content-container focus video">
                            <div :style="{width: hideFocusLayoutParticipantListVideoView ? '100%' : 'calc(100% - 200px)', height: '100%', position: 'relative'}">
                                <video v-if=" computedFocusVideoParticipant && !computedFocusVideoParticipant._isAudience && (!computedFocusVideoParticipant._isVideoMuted || computedFocusVideoParticipant._isScreenSharing) && computedFocusVideoParticipant._stream"
                                       v-bind:style="{objectFit:computedFocusVideoParticipant._isScreenSharing ? 'contain' : 'fit'}"
                                       style="width: 100%; height: 100%"
                                       :srcObject.prop="computedFocusVideoParticipant._screenShareStream ? computedFocusVideoParticipant._screenShareStream : computedFocusVideoParticipant._stream"
                                       :muted="computedFocusVideoParticipant.uid === selfUserInfo.uid"
                                       playsInline
                                       autoPlay/>
                                <div @click="toggleParticipantListVideoView" style="position: absolute; top: 50%; right: 0; color: #c8cacc; z-index: 1000; font-size: 40px">
                                    <i :class="hideFocusLayoutParticipantListVideoView ? 'icon-ion-arrow-left-b' : 'icon-ion-arrow-right-b'"></i>
                                </div>
                            </div>
                            <div v-show="!hideFocusLayoutParticipantListVideoView" class="focus-mode-participant-list-container">
                                <!--participants include self-->
                                <ConferenceParticipantVideoView v-for="(participant) in participantUserInfos"
                                                                :key="participant.uid + '-' + participant._isScreenSharing"
                                                                :participant="participant"
                                                                :session="session">
                                </ConferenceParticipantVideoView>
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
                            <!--participants-->
                            <div v-for="(participant) in participantUserInfos"
                                 :key="participant.uid"
                                 class="participant-audio-item">
                                <video v-if="audioOnly && participant._stream && !participant._isVideoMuted"
                                       class="hidden-video"
                                       :srcObject.prop="participant._stream"
                                       :muted="participant.uid === selfUserInfo.uid"
                                       playsInline autoPlay/>
                                <!-- video 标签不能播放没有视频的流 -->
                                <audio v-else-if="audioOnly && participant._stream && participant._isVideoMuted"
                                       class="hidden-video"
                                       :srcObject.prop="participant._stream"
                                       :ref="participant.uid + '-audio'"
                                       :muted="participant.uid === selfUserInfo.uid"
                                       playsInline autoPlay/>
                                <div style="position: relative">
                                    <img class="avatar"
                                         v-bind:class="{highlight:participant._volume > 0}"
                                         :src="participant.portrait" :alt="participant">
                                    <i v-if="participant._isHost" class="indicator icon-ion-person" style="background: #FD802E"></i>
                                    <i v-if="participant._isAudience" class="indicator icon-ion-ios-mic-off" style="color: red"></i>
                                </div>
                                <p class="single-line">{{ userName(participant) }}</p>
                            </div>
                        </section>
                    </div>
                    <!--actions-->
                    <footer>
                        <div class="duration-action-container">
                            <p v-if="false">{{ duration }}</p>
                            <div class="action-container">
                                <div class="action">
                                    <img v-if="!session.audience && !session.audioMuted" @click="muteAudio" class="action-img"
                                         src='@/assets/images/av_conference_audio.png'/>
                                    <img v-else @click="muteAudio" class="action-img"
                                         src='@/assets/images/av_conference_audio_mute.png'/>
                                    <p>静音</p>
                                </div>
                                <div class="action"
                                     v-if="!session.screenSharing">
                                    <img v-if="!session.audience && !session.videoMuted" @click="muteVideo" class="action-img"
                                         src='@/assets/images/av_conference_video.png'/>
                                    <img v-else @click="muteVideo" class="action-img"
                                         src='@/assets/images/av_conference_video_mute.png'/>
                                    <p>视频</p>
                                </div>
                                <div class="action">
                                    <img v-if="!session.screenSharing" @click="screenShare"
                                         class="action-img"
                                         src='@/assets/images/av_conference_screen_sharing.png'/>
                                    <img v-else @click="screenShare" class="action-img"
                                         src='@/assets/images/av_conference_screen_sharing_hover.png'/>
                                    <p class="single-line">共享屏幕</p>
                                </div>
                                <div class="action" @click="chat">
                                    <i class="icon-ion-ios-chatboxes"
                                       style="width: 40px; height: 40px; font-size: 40px; color: black"
                                       v-bind:style="{color: showConversationView ? 'white' : 'black'}"/>
                                    <p>聊天</p>
                                </div>
                                <div v-if="conferenceManager.conferenceInfo && selfUserInfo.uid !== conferenceManager.conferenceInfo.owner" class="action">
                                    <img v-if="!conferenceManager.isHandUp" @click="handup"
                                         class="action-img"
                                         src='@/assets/images/av_conference_handup.png'/>
                                    <img v-else @click="handup" class="action-img"
                                         src='@/assets/images/av_conference_handup_hover.png'/>
                                    <p class="single-line">举手</p>
                                </div>
                                <div class="action">
                                    <img @click.stop="members" class="action-img"
                                         v-bind:style="{filter: showConferenceManageView ? 'invert(100%)' : 'none'}"
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

            </div>
            <div class="slider">
                <div class="title" style="display: none">
                    TODO
                </div>
                <ConferenceManageView
                    v-if="showConferenceManageView"
                    v-bind:class="{ active: showConferenceManageView}"
                    :participants="participantUserInfos"
                    :session="session"
                />
                <ConversationView v-if="showConversationView && sharedMiscState.isElectron"
                                  class="conversation-view"
                                  style="height: 100%"
                                  :title="conferenceManager.conferenceInfo.conferenceTitle"
                                  :input-options="{disableScreenShot:true, disableHistory:true, disableVoip:true, disableChannelMenu:true}"/>
            </div>
        </div>
    </div>
</template>

<script>
import avenginekit from "../../../wfc/av/internal/engine.min";
import CallSessionCallback from "../../../wfc/av/engine/callSessionCallback";
import CallState from "../../../wfc/av/engine/callState";
import localStorageEmitter from "../../../ipc/localStorageEmitter";
import {currentWindow, isElectron} from "../../../platform";
import ScreenOrWindowPicker from "../ScreenOrWindowPicker";
import CallEndReason from "../../../wfc/av/engine/callEndReason";
import ScreenShareControlView from "../ScreenShareControlView";
import avenginekitproxy from "../../../wfc/av/engine/avenginekitproxy";
import ElectronWindowsControlButtonView from "../../common/ElectronWindowsControlButtonView";
import store from "../../../store";
import VideoType from "../../../wfc/av/engine/videoType";
import IpcEventType from "../../../ipcEventType";
import ConferenceParticipantVideoView from "./ConferenceParticipantVideoView";
import ConversationView from "../../main/conversation/ConversationView";
import ConferenceSimpleInfoView from "./ConferenceSimpleInfoView";
import ChooseConferenceLayoutView from "./ChooseConferenceLayoutView";
import ConferenceConversationFloatingView from "./ConferenceConversationFloatingView";
import conferenceManager from "./conferenceManager";
import ConferenceManageView from "./ConferenceManageView";
import wfc from "../../../wfc/client/wfc";
import LocalStorageIpcEventType from "../../../ipc/localStorageIpcEventType";
import UserInfo from "../../../wfc/model/userInfo";
import ConversationType from "../../../wfc/model/conversationType";
import Conversation from "../../../wfc/model/conversation";
import ConversationInfo from "../../../wfc/model/conversationInfo";
import ChannelInfo from "../../../wfc/model/channelInfo";
import ChatRoomInfo from "../../../wfc/model/chatRoomInfo";
import {vOnClickOutside} from '@vueuse/components'

import {markRaw} from "vue";
import EventType from "../../../wfc/client/wfcEvent";
import WfcAVEngineKit from "../../../wfc/av/engine/avenginekit";

export default {
    name: 'Conference',
    data() {
        return {
            session: null,
            audioOnly: false,
            status: 1,
            selfUserInfo: null,
            participantUserInfos: [],

            startTimestamp: 0,
            currentTimestamp: 0,

            showSlider: false,
            showConferenceManageView: false,
            showConversationView: false,
            sharedMiscState: store.state.misc,
            videoInputDeviceIndex: 0,

            refreshUserInfoInternal: 0,

            endReason: undefined,

            conferenceManager: conferenceManager,

            // -1，默认布局，也就是宫格布局；0, 宫格视图；1，演讲者视图
            currentLayout: -1,

            // 宫格视图
            currentGridPageIndex: 0,
            participantCountPerGridPage: 9,

            // 演讲者视图
            speakingVideoParticipant: null,
            hideFocusLayoutParticipantListVideoView: false,

            showConferenceSimpleInfoView: false,
            showChooseLayoutView: false,

        }
    },
    components: {
        ConferenceManageView,
        ConferenceConversationFloatingView,
        ChooseConferenceLayoutView,
        ConferenceSimpleInfoView,
        ConferenceParticipantVideoView,
        ScreenShareControlView,
        ElectronWindowsControlButtonView,
        ConversationView
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
                        if (allPlaying && videos.length === this.participantUserInfos.filter(p => !p._isAudience).length + 1) {
                            clearInterval(this.autoPlayInterval);
                            this.autoPlayInterval = 0;
                            console.log('auto play, allPlaying', videos.length);
                            return;
                        }

                        for (const video of videos) {
                            if (video.paused) {
                                let p = video.play();
                                if (p !== undefined) {
                                    p.catch(err => {
                                        // do nothing
                                    })
                                }
                            }
                        }
                    } catch (e) {
                        // do nothing
                    }

                }, 100);
            }
        },
        setupSessionCallback() {
            let sessionCallback = new CallSessionCallback();

            sessionCallback.didChangeState = (state) => {
                console.log('didChangeState', state)
                this.status = state;
                if (state === CallState.STATUS_CONNECTED) {
                    // 比如没有摄像头，但发起视频通话时，会自动 muteVideo
                    this.selfUserInfo._isVideoMuted = this.session.videoMuted;
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
                //this.session.rotateAng = 90;

                selfUserInfo._isHost = session.host === selfUserInfo.uid;
                selfUserInfo._isAudience = session.audience;
                selfUserInfo._isVideoMuted = session.videoMuted;
                selfUserInfo._isAudioMuted = session.audioMuted;
                selfUserInfo._volume = 0;
                // 先添加属性，在赋值，才能 reactive
                this.selfUserInfo = selfUserInfo;
                this.participantUserInfos = [selfUserInfo];

                console.log('oninitial', selfUserInfo._isAudience)
                // pls refer to: https://vuejs.org/v2/guide/reactivity.html
                this.$set(this.selfUserInfo, '_stream', null);
                this.$set(this.selfUserInfo, '_isScreenSharing', false);
                this.participantUserInfos.forEach(p => this.$set(p, "_stream", null))

                this.session = session;
                if (isElectron()) {
                    document.title = session.title;
                }

                conferenceManager.getConferenceInfo(session.callId);
            };

            sessionCallback.didCreateLocalVideoTrack = (stream, screenShare) => {
                console.log('didCreateLocalVideoTrack', screenShare)
                if(WfcAVEngineKit.SCREEN_SHARING_REPLACE_MODE || !screenShare){
                    this.selfUserInfo._stream = stream;
                    this.selfUserInfo._isVideoMuted = false;
                    this.selfUserInfo._isScreenSharing = screenShare;
                } else {
                    let selfScreenShareUserInfo = Object.assign(new UserInfo(), this.selfUserInfo);
                    selfScreenShareUserInfo._stream = stream;
                    selfScreenShareUserInfo._isVideoMuted = false;
                    selfScreenShareUserInfo._isScreenSharing = true;
                    this.participantUserInfos.splice(1, 0, selfScreenShareUserInfo);
                }
                this.autoPlay();
            };

            sessionCallback.didRotateLocalVideoTrack = (stream) => {
                console.log('didRotateLocalVideoTrack', stream.getAudioTracks())
                this.selfUserInfo._stream = stream;
                this.selfUserInfo._stream.timestamp = new Date().getTime();
            };

            sessionCallback.didScreenShareEnded = () => {
                console.log('didScreenShareEnded', this.session.videoMuted, this.session.audioMuted);
                if (isElectron()) {
                    currentWindow.setIgnoreMouseEvents(false);
                }
                this.selfUserInfo._isScreenSharing = false;
                this.selfUserInfo._isVideoMuted = this.session.videoMuted;
            }

            sessionCallback.didCreateLocalVideoTrackError = () => {
                // TODO
                // 没有摄像头或者麦克风，加入会议时，会回调到此处，自己断会显示自己的头像，其他端会显示黑屏
                // 可以进行相关提示
            };

            sessionCallback.didReceiveRemoteVideoTrack = (userId, stream, screenSharing) => {
                let p;
                console.log('didReceiveRemoteVideoTrack', userId, stream, screenSharing);
                for (let i = 0; i < this.participantUserInfos.length; i++) {
                    p = this.participantUserInfos[i];
                    if (p.uid === userId && p._isScreenSharing === screenSharing) {
                        p._stream = stream;
                        p._stream.timestamp = new Date().getTime();
                        break;
                    }
                }
                // if (index > -1) {
                //     this.$set(this.participantUserInfos, index, p);
                // }
                this.autoPlay();
            };

            sessionCallback.didRemoveRemoteVideoTrack = (userId) => {
                console.log('didRemoveRemoteVideoTrack', userId)
            };

            sessionCallback.didParticipantJoined = (userId, screenSharing) => {
                console.log('didParticipantJoined', userId, screenSharing)
                let userInfo = wfc.getUserInfo(userId);
                let subscriber = this.session.getSubscriber(userId, screenSharing);
                userInfo._stream = subscriber.stream;
                userInfo._isAudience = subscriber.audience;
                userInfo._isHost = this.session.host === userId;
                userInfo._isVideoMuted = subscriber.videoMuted;
                userInfo._isAudioMuted = subscriber.audioMuted;
                userInfo._volume = 0;
                userInfo._isScreenSharing = screenSharing;
                // 动态添加的属性不是 reactive 的，故直接创建个新的对象
                // 其实这个问题很奇怪，只有发起会议，第一次进入该会议的时候，其他端加入，参与者列表会不刷新；重新进入等，都一切正常
                this.participantUserInfos.push(Object.assign(new UserInfo(), userInfo));
                console.log('joined', userInfo, subscriber.audience, this.participantUserInfos.length);
            }

            sessionCallback.didParticipantLeft = (userId, endReason, screenSharing) => {
                console.log('didParticipantLeft', userId, endReason, screenSharing, JSON.stringify(this.participantUserInfos), this.participantUserInfos.length)
                //this.participantUserInfos = this.participantUserInfos.filter(p => p.uid !== userId && p._isScreenSharing !== screenSharing);
                this.participantUserInfos = this.participantUserInfos.filter(p => {
                    return !(p.uid === userId && p._isScreenSharing === screenSharing);
                });
                //fixme 上面可能会没有触发重新计算 focusVideoParticipant
                console.log('didParticipantLeft d', userId, endReason, screenSharing, this.participantUserInfos.length)
            }

            sessionCallback.didCallEndWithReason = (reason) => {
                console.log('callEndWithReason', reason)
                conferenceManager.addHistory(conferenceManager.conferenceInfo, new Date().getTime() - conferenceManager.conferenceInfo.startTime * 1000)
                // 可以根据reason，进行一些提示
                // alert('会议已结束');

                this.endReason = reason;
                if (reason === CallEndReason.REASON_MediaError) {
                    return;
                }
                if (reason === CallEndReason.RoomNotExist) {
                    console.log('join conference failed', reason, this.session)
                    let obj = {reason: reason, session: this.session};
                    localStorageEmitter.send(LocalStorageIpcEventType.joinConferenceFailed, obj);
                }
                this.session.closeVoipWindow();
                this.session = null;
            }

            sessionCallback.onRequestChangeMode = (audience) => {
                console.log('onRequestChangeMode', audience)
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

            sessionCallback.didChangeType = (userId, audience, screenSharing) => {
                console.log('didChangeType', userId, audience, screenSharing);
                this.participantUserInfos.forEach(u => {
                    if (u.uid === userId && u._isScreenSharing === screenSharing) {
                        u._isAudience = audience;
                        if (audience) {
                            u._stream = null;
                        }
                        if (this.speakingVideoParticipant && this.speakingVideoParticipant.uid === u.uid) {
                            this.speakingVideoParticipant = null;
                        }
                    }
                })
            };

            sessionCallback.didReportAudioVolume = (userId, volume) => {
                let userInfo;
                if (userId === this.selfUserInfo.uid) {
                    this.selfUserInfo._volume = volume;
                    userInfo = this.selfUserInfo;
                } else {
                    this.participantUserInfos.forEach(u => {
                        if (u.uid === userId && u._isScreenSharing === false) {
                            u._volume = volume;
                            userInfo = u;
                        }
                    })
                }
                if (this.currentLayout === 0) {
                    return;
                }

                if (!userInfo) {
                    return;
                }

                if (userInfo._isVideoMuted) {
                    return;
                }

                if (this.conferenceFocusUser) {
                    return this.conferenceFocusUser;
                }

                if (!this.speakingVideoParticipant) {
                    this.speakingVideoParticipant = userInfo;
                } else if (userInfo._volume > this.speakingVideoParticipant._volume) {
                    this.speakingVideoParticipant = userInfo;
                }
            };

            sessionCallback.didMuteStateChanged = (participants) => {
                console.log('conference', 'didMuteStateChanged', participants)
                participants.forEach(p => {
                    // 自己
                    if (p === this.selfUserInfo.uid) {
                        console.log('conference', 'didMuteStateChanged self', this.session.videoMuted);
                        this.selfUserInfo._isVideoMuted = this.session.videoMuted;
                        return;
                    }
                    let s = this.session.getSubscriber(p);
                    if (!s) {
                        return;
                    }
                    console.log('conference', 'didMuteStateChanged', p, s.videoMuted, s.audioMuted);
                    this.participantUserInfos.forEach(u => {
                        if (u.uid === p && u._isScreenSharing === false) {
                            let subscriber = this.session.getSubscriber(p);
                            u._isVideoMuted = subscriber.videoMuted;
                            u._isAudioMuted = subscriber.audioMuted;
                            if (this.speakingVideoParticipant && this.speakingVideoParticipant.uid === u.uid) {
                                this.speakingVideoParticipant = null;
                            }
                        }
                    })

                })
            };

            sessionCallback.didMediaLostPacket = (media, lostPacket, screenSharing) => {
                console.log('didMediaLostPacket', media, lostPacket, screenSharing);
                if (lostPacket > 6) {
                    console.log('您的网络不好');
                }
            };

            sessionCallback.didUserMediaLostPacket = (userId, media, lostPacket, uplink, screenSharing) => {
                console.log('didUserMediaLostPacket', userId, media, lostPacket, uplink, screenSharing);
                //如果uplink ture对方网络不好，false您的网络不好
                //接收方丢包超过10为网络不好
                if (lostPacket > 10) {
                    if (uplink) {
                        let userInfos = this.participantUserInfos.filter(u => u.uid === userId && u._isScreenSharing === screenSharing);
                        if (userInfos && userInfos.length > 0) {
                            console.log(userInfos[0].displayName, "网络不好");
                        }
                    } else {
                        console.log('您的网络不好');
                    }
                }
            };

            if (isElectron()) {
                avenginekit.setup(sessionCallback);
            } else {
                avenginekit.sessionCallback = sessionCallback;
            }
        },


        hangup() {
            this.session.leaveConference(false);
            conferenceManager.addHistory(conferenceManager.conferenceInfo, new Date().getTime() - conferenceManager.conferenceInfo.startTime * 1000)
        },

        muteAudio() {
            let enable = this.session.audioMuted ? true : false;
            if (enable && this.session.audience && !conferenceManager.isOwner() && !conferenceManager.conferenceInfo.allowSwitchMode) {
                this.requestUnmute(true);
                return;
            }
            this.enableAudio(enable);
        },

        async enableAudio(enable) {
            let result = await this.session.setAudioEnabled(enable)
            if (!result) {
                return;
            }
            this.selfUserInfo._isAudioMuted = !enable;

            console.log('muteAudio', this.selfUserInfo._isAudioMuted, this.session.audience)
            if (enable) {
                if (this.session.audience) {
                    await this.session.switchAudience(false);
                    this.selfUserInfo._isAudience = false;
                }
            } else {
                if (this.session.videoMuted && !this.selfUserInfo._isScreenSharing && !this.session.audience) {
                    await this.session.switchAudience(true);
                    this.selfUserInfo._isAudience = true;
                }
            }
        },
        muteVideo() {
            let enable = this.session.videoMuted ? true : false;
            if (enable && this.session.audience && !conferenceManager.isOwner() && !conferenceManager.conferenceInfo.allowSwitchMode) {
                this.requestUnmute(false);
                return;
            }
            this.enableVideo(enable);
        },

        async enableVideo(enable) {
            let result = await this.session.setVideoEnabled(enable)
            if (!result) {
                return;
            }
            this.selfUserInfo._isVideoMuted = !enable;

            console.log('muteVideo result', this.selfUserInfo._isVideoMuted, this.session.audience)
            if (enable) {
                if (this.session.audience) {
                    await this.session.switchAudience(false);
                    this.selfUserInfo._isAudience = false;
                }
            } else {
                if (this.session.audioMuted && !this.session.audience) {
                    await this.session.switchAudience(true);
                    this.selfUserInfo._isAudience = true;
                }
            }
        },

        requestUnmute(audio) {
            if (audio && conferenceManager.allowUnmuteAudio) {
                this.enableAudio(true);
                return;
            }

            if (!audio && conferenceManager.allowUnmuteVideo) {
                this.enableVideo(true);
                return;
            }

            this.$alert({
                content: audio ? '主持人不允许解除静音，您可以向主持人申请解除静音' : '主持人不允许打开摄像头，您可以向主持人申请打开摄像头',
                confirmText: '申请',
                cancelCallback: () => {
                    // do nothing
                },
                confirmCallback: () => {
                    conferenceManager.applyUnmute(audio, false);
                }
            })
        },

        down2voice() {
            this.session.downgrade2Voice();
        },

        members() {
            this.showConferenceManageView = !this.showConferenceManageView;
            this.toggleSliderView();
        },

        chat() {
            if (isElectron()) {
                this.showConversationView = !this.showConversationView;
                this.toggleSliderView();
            } else {
                let conversation = new Conversation(ConversationType.ChatRoom, this.session.callId, 0)
                let chatroomInfo = new ChatRoomInfo();
                chatroomInfo.chatRoomId = this.session.callId;
                chatroomInfo.title = this.session.title;
                conversation._target = chatroomInfo;
                conversation._target._displayName = chatroomInfo.title;
                let conversationInfo = new ConversationInfo();
                conversationInfo.conversation = conversation;
                store.setCurrentConversationInfo(conversationInfo);
                this.$router.replace('/home');
            }
        },

        hideParticipantList() {
            this.showConferenceManageView && (this.showConferenceManageView = false);
            this.toggleSliderView();
        },

        toggleSliderView() {
            if (!this.showSlider) {
                if (isElectron()) {
                    let size = currentWindow.getSize();
                    currentWindow.setSize(size[0] + 350, size[1], false)
                } else {
                    window.resizeTo(window.innerWidth + 360, window.outerHeight);
                }
                this.$refs.rootContainer.style.setProperty('--slider-width', '350px');
            } else {
                if (isElectron()) {
                    let size = currentWindow.getSize();
                    this.$refs.rootContainer.style.setProperty('--slider-width', '0px');
                    currentWindow.setSize(size[0] - 350, size[1], false)
                } else {
                    this.$refs.rootContainer.style.setProperty('--slider-width', '0px');
                    window.resizeTo(window.innerWidth - 350, window.outerHeight)
                }

                this.showConferenceManageView = false;
                this.showConversationView = false;
            }
            this.showSlider = !this.showSlider;
        },


        async screenShare() {

            // if (true) {
            //     navigator.mediaDevices.enumerateDevices().then(deviceInfos => {
            //         // test input
            //         for (const deviceInfo of deviceInfos) {
            //             if (this.testCount % 2 === 0) {
            //                    //仅仅是为测试了，生成不能这么写死
            //                 if (deviceInfo.label === "外置麦克风 (Built-in)") {
            //                     console.log('audioInput 外置');
            //                     this.session.setAudioInputDeviceId(deviceInfo.deviceId);
            //                     break;
            //                 }
            //             } else {
            //                 if (deviceInfo.label === "MacBook Pro麦克风 (Built-in)") {
            //                     console.log('audioInput 内置');
            //                     this.session.setAudioInputDeviceId(deviceInfo.deviceId);
            //                     break;
            //                 }
            //             }
            //         }
            //
            //         // test output
            //         // for (const deviceInfo of deviceInfos) {
            //         //     if (this.testCount % 2 === 0) {
            //         //         if (deviceInfo.label === "外置耳机 (Built-in)") {
            //         //             console.log('audioOut 外置');
            //         //             this.setAudioOutputDeviceId(deviceInfo.deviceId)
            //         //             break;
            //         //         }
            //         //     } else {
            //         //         if (deviceInfo.label === "MacBook Pro扬声器 (Built-in)") {
            //         //             console.log('audioOutput 内置');
            //         //             this.setAudioOutputDeviceId(deviceInfo.deviceId)
            //         //             break;
            //         //         }
            //         //     }
            //         // }
            //
            //     }).catch(err => {
            //         console.log()
            //     })
            //     this.testCount++;
            //     return;
            // }

            if (this.session.screenSharing) {
                this.session.stopScreenShare();
                console.log('stopScreenShare', this.session.videoMuted, this.session.audioMuted);
                if (this.session.videoMuted && this.session.audioMuted) {
                    this.session.switchAudience(true);
                }
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
                                // minWidth: 1280,
                                maxWidth: 1280,
                                // minHeight: 720,
                                maxHeight: 720
                            }

                            if (this.session.audience) {
                                this.session.switchAudience(false)
                                    .then(() => {
                                        this.session.startScreenShare(desktopShareOptions);
                                    })
                                    .catch(err => {
                                        console.error(err)
                                    });
                            } else {
                                this.session.startScreenShare(desktopShareOptions);
                            }
                            avenginekitproxy.emitToMain(IpcEventType.START_SCREEN_SHARE, {})
                        }
                    };
                    this.$modal.show(
                        markRaw(ScreenOrWindowPicker),
                        {}, null, {
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

                    if (this.session.audience) {
                        await this.session.switchAudience(false);
                    }
                    this.session.startScreenShare({
                        frameRate: 30
                    });
                }
            }
        },

        // 设置音频输出设备
        setAudioOutputDeviceId(deviceId) {
            let audioEls = this.$el.getElementsByTagName('audio');
            for (const audioEl of audioEls) {
                audioEl.setSinkId(deviceId);
            }
            let videoEls = this.$el.getElementsByTagName('video');
            for (const videoEl of videoEls) {
                videoEl.setSinkId(deviceId);
            }
        },

        handup() {
            conferenceManager.handUp(!conferenceManager.isHandUp)
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
        },

        // TODO 删除，可以直接监听用户信息变化了
        refreshUserInfos() {
            let toRefreshUsers = [];
            this.participantUserInfos.forEach(pu => {
                if (!pu.updateDt) {
                    toRefreshUsers.push(pu.uid);
                }
            });

            if (toRefreshUsers.length > 0) {
                console.log('to refreshUsers', toRefreshUsers)
                let userInfos = wfc.getUserInfos(toRefreshUsers, '');
                userInfos.forEach(u => {
                    let index = this.participantUserInfos.findIndex(p => p.uid === u.uid);
                    if (u.updateDt && index > -1) {
                        let ou = this.participantUserInfos[index];
                        u._stream = ou._stream;
                        u._isAudience = ou._isAudience;
                        u._isHost = ou._isHost;
                        u._isVideoMuted = ou._isVideoMuted;
                        u._isAudioMuted = ou._isAudioMuted;
                        u._volume = ou._volume;
                        // FYI: https://v2.vuejs.org/v2/guide/reactivity#Change-Detection-Caveats
                        this.participantUserInfos.splice(index, 1, u)
                    }
                })
            }
        },

        rejoinConference() {
            avenginekit.joinConference({
                callId: this.session.callId,
                pin: this.session.pin,
                host: this.session.host,
                tile: this.session.title,
                desc: this.session.desc,
                audioOnly: this.session.audioOnly,
                audience: this.session.audience,
                advance: this.session.advance,
                muteVideo: this.session.videoMuted,
                muteAudio: this.session.audioMuted,
                extra: this.session.extra,
                callExtra: this.session.callExtra,
                selfUserInfo: this.selfUserInfo,
            });
            this.endReason = undefined;
        },

        prePage() {
            this.currentGridPageIndex--;
            if (this.currentGridPageIndex < 0) {
                this.currentGridPageIndex = Math.ceil(this.participantUserInfos.length / this.participantCountPerGridPage) - 1
            }
        },
        nextPage() {
            if (this.participantUserInfos.length / this.participantCountPerGridPage > (this.currentGridPageIndex + 1)) {
                this.currentGridPageIndex++;
            } else {
                this.currentGridPageIndex = 0;
            }
        },

        updateCountPerPage(count) {
            this.participantCountPerGridPage = count;
        },

        setCurrentLayout(layout) {
            if (this.currentLayout === layout) {
                return;
            }
            // 演讲者布局
            if (layout === 1) {
                // 演讲者布局，切换为小流，然后焦点用户切换为大流
                this.participantUserInfos.forEach(u => {
                    if (u.uid !== this.selfUserInfo.uid && !u._isAudience && !u._isVideoMuted) {
                        this.session.setParticipantVideoType(u.uid, u._isScreenSharing, VideoType.SMALL_STREAM);
                    }
                })
            } else {
                //宫格布局， 当前页切换为大流，未显示的，取消订阅，由 currentPageParticipants 副作用触发
                this.currentGridPageIndex = 0;
                conferenceManager.currentFocusUser = null;
            }
            this.currentLayout = layout;
            this.showChooseLayoutView = false;
        },
        toggleParticipantListVideoView() {
            this.hideFocusLayoutParticipantListVideoView = !this.hideFocusLayoutParticipantListVideoView;
        },

        hideConferenceSimpleInfoView(event) {
            if (event.target.id === 'info-icon') {
                return;
            }
            this.showConferenceSimpleInfoView = false;
        },

        hideChooseLayoutView(event) {
            if (event.target.id === 'grid-icon') {
                return;
            }
            this.showChooseLayoutView = false;
        },

        onUserInfosUpdate(userInfos = []) {
            for (let i = 0; i < this.participantUserInfos.length; i++) {
                let userInfo = userInfos.find(u => u.uid === this.participantUserInfos[i].uid);
                if (userInfo) {
                    Object.assign(this.participantUserInfos[i], userInfo);
                }
            }
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
        },

        currentPageParticipants() {
            if (this.currentLayout === 1) {
                return [];
            }

            let focusUser = this.conferenceFocusUser;
            // sort not in place，避免副作用
            let sortedParticipantUserInfos = [...this.participantUserInfos].sort((o1, o2) => {
                if (focusUser) {
                    if (o1.uid === focusUser.uid && o1._isScreenSharing === focusUser._isScreenSharing) {
                        return -1;
                    }
                    if (o2.uid === focusUser.uid && o2._isScreenSharing === focusUser._isScreenSharing) {
                        return 1;
                    }
                }

                if (o1._isAudience && !o2._isAudience) {
                    return 1;
                } else if (!o1._isAudience && o2._isAudience) {
                    return -1;
                } else if (o1._isAudience && o2._isAudience) {
                    return o1.uid.localeCompare(o2.uid);
                } else {
                    if (o1._isScreenSharing && !o2._isScreenSharing) {
                        return -1;
                    }
                    if (!o1._isScreenSharing && o2._isScreenSharing) {
                        return 1;
                    }
                    if (!o1._isVideoMuted && o2._isVideoMuted) {
                        return -1;
                    }
                    if (o1._isVideoMuted && !o2._isVideoMuted) {
                        return 1;
                    }
                    return o1.uid.localeCompare(o2.uid);
                }
            })

            let start = this.currentGridPageIndex * this.participantCountPerGridPage;
            let end = start + this.participantCountPerGridPage > sortedParticipantUserInfos.length ? sortedParticipantUserInfos.length : (start + this.participantCountPerGridPage);
            return sortedParticipantUserInfos.slice(start, end);
        },

        gridPageCount() {
            return Math.ceil(this.participantUserInfos.length / this.participantCountPerGridPage);
        },

        conferenceFocusUser() {
            if (!conferenceManager || !conferenceManager.conferenceInfo) {
                return null
            }
            let focus = conferenceManager.conferenceInfo.focus;
            if (!focus) {
                return null;
            }
            let focusUser = this.participantUserInfos.find(u => u.uid === focus && u._isScreenSharing === true);
            if (!focusUser) {
                focusUser = this.participantUserInfos.find(u => u.uid === focus);
            }
            return focusUser;
        },
        conferenceLocalFocusUser() {
            return conferenceManager.localFocusUser;
        },

        // 以用户手动选择的为准
        computedCurrentLayout() {
            if (this.currentLayout === -1 && this.conferenceFocusUser) {
                return 1;
            }
            return this.currentLayout;
        },

        // TODO 可以缓存到 conferenceManager 里面
        computedFocusVideoParticipant() {
            if (!this.session || this.currentLayout === 0) {
                console.log('computedSpeakingParticipant null')
                return null;
            }
            let sp;
            if (this.conferenceFocusUser && !this.conferenceFocusUser._isVideoMuted) {
                sp = this.conferenceFocusUser;
            } else if (this.conferenceLocalFocusUser && !this.conferenceLocalFocusUser._isVideoMuted) {
                sp = this.conferenceLocalFocusUser;
            } else if (this.speakingVideoParticipant) {
                sp = this.speakingVideoParticipant;
            } else {
                sp = this.participantUserInfos.find(u => !u._isAudience && !u._isVideoMuted && u._isScreenSharing === true);
                if (!sp) {
                    sp = this.participantUserInfos.find(u => !u._isAudience && !u._isVideoMuted);
                }
            }

            if (sp) {
                conferenceManager.currentFocusUser = sp;
            } else {
                if (this.session.screenSharing) {
                    sp = this.selfUserInfo;
                }
            }
            console.log('computedFocusVideoParticipant', sp)
            return sp;
        }
    },

    watch: {
        participantUserInfos: {
            deep: true,
            handler(infos) {
                let audioOnly = true;
                // console.log('participantUserInfos', this.session.screenSharing);
                if (this.session.screenSharing) {
                    audioOnly = false;
                } else {
                    for (let i = 0; i < this.participantUserInfos.length; i++) {
                        let u = this.participantUserInfos[i];
                        if (!u._isAudience && !u._isVideoMuted) {
                            audioOnly = false;
                            break;
                        }
                    }
                }
                this.audioOnly = audioOnly;

                // mute self audio
                let ref = this.$refs[this.selfUserInfo.uid + '-audio'];
                if (ref && ref.length > 0) {
                    this.$refs[this.selfUserInfo.uid + '-audio'][0].muted = true;
                }
                if (this.audioOnly) {
                    return;
                }
                // 宫格布局
                if (this.currentLayout === 0) {
                    let start = this.currentGridPageIndex * this.participantCountPerGridPage;
                    let end = start + this.participantCountPerGridPage > this.participantUserInfos.length ? this.participantUserInfos.length : (start + this.participantCountPerGridPage);
                    let count = end - start;
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
                    if (this.$refs.rootContainer) {
                        this.$refs.rootContainer.style.setProperty('--participant-video-item-width', width);
                        this.$refs.rootContainer.style.setProperty('--participant-video-item-height', height);
                    }
                }
            }
        },
        currentPageParticipants: {
            deep: true,
            handler(newCurrentPageParticipants, oldCurrentPageParticipants) {
                if (this.audioOnly) {
                    return;
                }
                if (this.currentLayout === 0) {
                    let count = this.currentPageParticipants.length;
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
                    if (this.$refs.rootContainer) {
                        this.$refs.rootContainer.style.setProperty('--participant-video-item-width', width);
                        this.$refs.rootContainer.style.setProperty('--participant-video-item-height', height);
                    }
                }

                if (oldCurrentPageParticipants) {
                    oldCurrentPageParticipants.forEach(u => {
                        let newIndex = newCurrentPageParticipants.findIndex(nu => nu.uid === u.uid && nu._isScreenSharing === u._isScreenSharing);
                        if(newIndex > -1) {
                            return;
                        }
                        if (u.uid === this.selfUserInfo.uid || u._isAudience || u._isVideoMuted) {
                            return
                        }
                        this.session.setParticipantVideoType(u.uid, u._isScreenSharing, VideoType.NONE);
                    })
                }
                if (newCurrentPageParticipants) {
                    newCurrentPageParticipants.forEach(u => {
                        if (u.uid === this.selfUserInfo.uid || u._isAudience || u._isVideoMuted) {
                            return
                        }
                        this.session.setParticipantVideoType(u.uid, u._isScreenSharing, VideoType.BIG_STREAM);
                    })
                }
            }
        },

        computedFocusVideoParticipant(newFocusParticipant, oldFocusParticipant) {
            if (newFocusParticipant && newFocusParticipant.uid !== this.selfUserInfo.uid) {
                this.session.setParticipantVideoType(newFocusParticipant.uid, newFocusParticipant._isScreenSharing, VideoType.BIG_STREAM);
            }
            if (oldFocusParticipant && oldFocusParticipant.uid !== this.selfUserInfo.uid) {
                this.session.setParticipantVideoType(oldFocusParticipant.uid, oldFocusParticipant._isScreenSharing, VideoType.SMALL_STREAM);
            }
        },
    },

    directives: {
        vOnClickOutside
    },

    created() {
        if (isElectron()) {
            document.title = '在线会议';
        }
        conferenceManager.setVueInstance(this);
        this.refreshUserInfoInternal = setInterval(() => {
            this.refreshUserInfos();
        }, 3 * 1000)

        this.$eventBus.$on('muteVideo', (mute) => {
            if (this.session.videoMuted !== mute) {
                let enable = this.session.videoMuted ? true : false;
                this.enableVideo(enable);
            }
        })
        this.$eventBus.$on('muteAudio', (mute) => {
            if (this.session.audioMuted !== mute) {
                let enable = this.session.audioMuted ? true : false;
                this.enableAudio(enable);
            }
        })
    },

    mounted() {
        this.setupSessionCallback();

        if (isElectron()) {
            //
            // this.$on('stop-screen-share', () => {
            //     this.session.stopScreenShare();
            //     this.$forceUpdate();
            // })
            window.addEventListener("mousemove", (event) => {
                if (!this.session || !this.session.screenSharing) {
                    return;
                }
                if (event.target.id === "main-content-container") {
                    currentWindow.setIgnoreMouseEvents(true, {forward: true});
                } else {
                    currentWindow.setIgnoreMouseEvents(false);
                }
            });
            window.addEventListener("mouseleave", (event) => {
                currentWindow.setIgnoreMouseEvents(false);
            })
            this.$refs.rootContainer.style.setProperty('--conference-container-margin-top', '30px');
        } else {
            this.$refs.rootContainer.style.setProperty('--conference-container-margin-top', '0px');
        }

        wfc.eventEmitter.on(EventType.UserInfosUpdate, this.onUserInfosUpdate);
    },

    unmounted() {
        // reset
        this.$set(this.selfUserInfo, '_stream', null)
        this.participantUserInfos.forEach(m => this.$set(m, "_stream", null))
        clearInterval(this.refreshUserInfoInternal);
        this.$eventBus.$off('muteVideo');
        this.$eventBus.$off('muteAudio');
        this.conferenceManager.destroy();
        wfc.eventEmitter.off(EventType.UserInfosUpdate, this.onUserInfosUpdate);
    }
}
</script>

<style lang="css" scoped>

.voip-container {
    background: #00000000 !important;
    position: relative;
    --conference-container-margin-top: 30px;
    --slider-width: 0px;
    --main-width: 100%;
}

a {
    color: gray;
}

i:hover {
    color: #1f64e4;
}

i.active {
    color: #3f64e4;
}

.main-slider-container {
    width: 100%;
    margin-top: var(--conference-container-margin-top);
    height: calc(100% - var(--conference-container-margin-top));
    display: flex;
    flex-direction: row;
}

.main-slider-container .main {
    width: calc(100% - var(--slider-width));
    height: 100%;
}

.main-slider-container .slider {
    width: var(--slider-width);
    height: 100%;
    overflow: auto;
    background: white;
}

.conference-main-content-container {
    width: 100%;
    height: calc(100% - 20px);
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

.main-slider-container .grid {
    flex-direction: row;
}

.main-slider-container .focus {
    --participant-video-item-width: 200px;
    --participant-video-item-height: 100px;
    flex-direction: column;
}

.content-container.video {
    background: black;
    object-fit: contain;
}

.focus-mode-participant-list-container {
    /*position: absolute;*/
    /*top: 0;*/
    /*right: 0;*/
    width: 200px;
    height: 100%;
    overflow: auto;
}

.content-container.audio {
    background: white;
    height: calc(100% - 50px);
    overflow: auto;
    padding: 10px 0 50px 0;
}

.participant-audio-item {
    display: flex;
    flex-direction: column;
    padding: 20px 40px;
    justify-content: center;
    align-items: center;
}

.hidden-video {
    height: 0;
}

.participant-audio-item .indicator {
    width: 18px;
    height: 18px;
    position: absolute;
    left: 50%;
    color: white;
    text-align: center;
    vertical-align: center;
    border-radius: 9px;
    bottom: 0;
    background: #d6d6d6;
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
    padding: 0 5px 0 0;
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

.video.me {
    -webkit-transform: scaleX(-1);
    transform: scaleX(-1);
}

.rejoin-container {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background: #e0e0e0e0;
    text-align: center;
    justify-content: center;
    color: red;
}

.icon-ion-grid:after {
    padding-left: 5px;
    content: "\f13f";
}

</style>
