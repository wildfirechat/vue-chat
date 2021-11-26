/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */

import EventType from "../../client/wfcEvent";
import {BrowserWindow, ipcRenderer, isElectron, PostMessageEventEmitter, remote} from "../../../platform";
import ConversationType from "../../model/conversationType";
import MessageContentType from "../../messages/messageContentType";
import wfc from "../../client/wfc";
import MessageConfig from "../../client/messageConfig";
import DetectRTC from 'detectrtc';
import Config from "../../../config";
import {longValue, numberValue} from '../../util/longUtil'
import Conversation from "../../../wfc/model/conversation";


// main window renderer process -> voip window renderer process
// voip window renderer process -> main process -> main window renderer process
export class AvEngineKitProxy {
    queueEvents = [];
    callWin;
    // 默认音视频窗口是在新窗口打开，当需要在同一个窗口，通过iframe处理时，请置为true
    useIframe = false;
    iframe;
    type;

    conference = false;
    conversation;
    callId;
    inviteMessageUid;
    participants = [];
    isSupportVoip = false;
    hasMicrophone = false;
    hasSpeaker = false;
    hasWebcam = false;

    /**
     * 无法正常弹出音视频通话窗口是的回调
     * 回到参数说明：-1，有音视频通话正在进行中；-2，设备不支持音视频通话，可能原因是不支持webrtc，没有摄像头或麦克风等
     * @type {(Number) => {}}
     */
    onVoipCallErrorCallback;

    /**
     * 应用初始化的时候调用
     * @param wfc
     */
    setup(wfc) {
        DetectRTC.load(() => {
            this.isSupportVoip = DetectRTC.isWebRTCSupported;
            this.hasMicrophone = DetectRTC.hasMicrophone;
            // Safari 14.0 版本，hasSpeakers一直为false，先全部置为true
            //this.hasSpeaker = DetectRTC.hasSpeakers;
            this.hasSpeaker = true;
            this.hasWebcam = DetectRTC.hasWebcam;
            console.log(`detectRTC, isWebRTCSupported: ${DetectRTC.isWebRTCSupported}, hasWebcam: ${DetectRTC.hasWebcam}, hasSpeakers: ${DetectRTC.hasSpeakers}, hasMicrophone: ${DetectRTC.hasMicrophone}`, this.isSupportVoip);
        });
        this.event = wfc.eventEmitter;
        this.event.on(EventType.ReceiveMessage, this.onReceiveMessage);
        this.event.on(EventType.ConferenceEvent, this.onReceiveConferenceEvent)

        if (isElectron()) {
            ipcRenderer.on('voip-message', this.sendVoipListener);
            ipcRenderer.on('conference-request', this.sendConferenceRequestListener);
            ipcRenderer.on('update-call-start-message', this.updateCallStartMessageContentListener)
            ipcRenderer.on('start-screen-share', (event, args) => {
                if (this.callWin) {
                    let screenWidth = args.width;
                    this.callWin.resizable = true;
                    this.callWin.closable = true;
                    this.callWin.maximizable = false;
                    this.callWin.transparent = true;
                    this.callWin.setMinimumSize(800, 800);
                    this.callWin.setSize(800, 800);
                    // console.log('screen width', screen, screen.width);
                    this.callWin.setPosition((screenWidth - 800) / 2, 0, true);
                }
            });
            ipcRenderer.on('stop-screen-share', (event, args) => {
                if (this.callWin) {
                    let type = args.type;
                    let width = 360;
                    let height = 640;
                    switch (type) {
                        case 'single':
                            width = 360;
                            height = 640;
                            break;
                        case 'multi':
                        case 'conference':
                            width = 1024;
                            height = 800;
                            break;
                        default:
                            break;
                    }
                    this.callWin.resizable = true;
                    this.callWin.closable = true;
                    this.callWin.maximizable = true;
                    this.callWin.setMinimumSize(width, height);
                    this.callWin.setSize(width, height);
                    this.callWin.center();
                }
            })
        }
    }

    /**
     * 设置渲染音视频通话界面的iframe
     *
     * 仅当 {@link useIframe}配置为 true时生效
     * @param iframe
     */
    setVoipIframe(iframe) {
        this.iframe = iframe;
    }

    updateCallStartMessageContentListener = (event, message) => {
        let messageUid = message.messageUid;
        let content = message.content;

        let msg = wfc.getMessageByUid(messageUid);
        let orgContent = msg.messageContent;
        orgContent.connectTime = content.connectTime ? content.connectTime : orgContent.connectTime;
        orgContent.endTime = content.endTime ? content.endTime : orgContent.endTime;
        orgContent.status = content.status;
        orgContent.audioOnly = content.audioOnly;
        wfc.updateMessageContent(msg.messageId, orgContent);
    }

    sendConferenceRequestListener = (event, request) => {
        wfc.sendConferenceRequestEx(request.sessionId ? request.sessionId : 0, request.roomId ? request.roomId : '', request.request, request.data, request.advance, (errorCode, res) => {
            this.emitToVoip('sendConferenceRequestResult', {
                error: errorCode,
                sendConferenceRequestId: request.sendConferenceRequestId,
                response: res
            })
        });
    }

    // 发送消息时，返回的timestamp，已经过修正，后面使用时,不用考虑和服务器的时间差
    sendVoipListener = (event, msg) => {
        let contentClazz = MessageConfig.getMessageContentClazz(msg.content.type);

        let content = new contentClazz();
        content.decode(msg.content);
        console.log('to send voip message', content);
        let delta = wfc.getServerDeltaTime();
        console.log('delta', delta);
        if (content.type === MessageContentType.VOIP_CONTENT_TYPE_ADD_PARTICIPANT) {
            this.participants.push(content.participants);
        } else if (content.type === MessageContentType.VOIP_CONTENT_TYPE_END) {
            this.conversation = null;
            this.queueEvents = [];
            this.callId = null;
            this.inviteMessageUid = null;
            this.participants = [];
            // 仅仅为了通知proxy，其他端已经接听电话了，关闭窗口时，不应当发送挂断信令
            if (!content.callId) {
                return;
            }
        }
        let conversation = new Conversation(msg.conversation.type, msg.conversation.target, msg.conversation.line)
        wfc.sendConversationMessage(conversation, content, msg.toUsers, (messageId, timestamp) => {

            // do nothing
        }, (uploaded, total) => {

            // do nothing
        }, (messageUid, timestamp) => {
            this.emitToVoip('sendMessageResult', {
                error: 0,
                sendMessageId: msg.sendMessageId,
                messageUid: messageUid,
                timestamp: longValue(numberValue(timestamp) - delta)
            })
            if (content.type === MessageContentType.VOIP_CONTENT_TYPE_START) {
                this.inviteMessageUid = messageUid;
            }
        }, (errorCode) => {
            this.emitToVoip('sendMessageResult', {error: errorCode, sendMessageId: msg.sendMessageId})
        });
    }

    onReceiveConferenceEvent = (event) => {
        this.emitToVoip("conferenceEvent", event);
    }

    // 收到消息时，timestamp已经过修正，后面使用时，不用考虑和服务器的时间差
    onReceiveMessage = (msg) => {
        if (!Config.ENABLE_MULTI_VOIP_CALL && msg.conversation.type === ConversationType.Group) {
            console.log('not enable multi call ');
            return;
        }
        if (!Config.ENABLE_SINGLE_VOIP_CALL && msg.conversation.type === ConversationType.Single) {
            console.log('not enable multi call ');
            return;
        }
        let now = (new Date()).valueOf();
        let delta = wfc.getServerDeltaTime();
        if (now - (numberValue(msg.timestamp) - delta) >= 90 * 1000) {
            // 消息已失效，不做处理
            return;
        }
        let content = msg.messageContent;
        if (content.type === MessageContentType.VOIP_CONTENT_TYPE_START
            || content.type === MessageContentType.VOIP_CONTENT_TYPE_ADD_PARTICIPANT) {
            if (this.callWin) {
                this.onVoipCallErrorCallback && this.onVoipCallErrorCallback(-1);
                return;
            }
            if (!this.isSupportVoip || !this.hasMicrophone || !this.hasSpeaker || !this.hasWebcam) {
                this.onVoipCallErrorCallback && this.onVoipCallErrorCallback(-2);
                return;
            }
        }

        if ((msg.conversation.type === ConversationType.Single || msg.conversation.type === ConversationType.Group)) {
            if (content.type === MessageContentType.VOIP_CONTENT_TYPE_START
                || content.type === MessageContentType.VOIP_CONTENT_TYPE_END
                || content.type === MessageContentType.VOIP_CONTENT_TYPE_ACCEPT
                || content.type === MessageContentType.VOIP_CONTENT_TYPE_SIGNAL
                || content.type === MessageContentType.VOIP_CONTENT_TYPE_MODIFY
                || content.type === MessageContentType.VOIP_CONTENT_TYPE_ACCEPT_T
                || content.type === MessageContentType.VOIP_CONTENT_TYPE_ADD_PARTICIPANT
                || content.type === MessageContentType.VOIP_CONTENT_TYPE_MUTE_VIDEO
                || content.type === MessageContentType.CONFERENCE_CONTENT_TYPE_KICKOFF_MEMBER
                || content.type === MessageContentType.CONFERENCE_CONTENT_TYPE_CHANGE_MODE
            ) {
                console.log("receive voip message", msg.messageContent.type, msg.messageUid.toString(), msg);
                if (msg.direction === 0
                    && content.type !== MessageContentType.VOIP_CONTENT_TYPE_END
                    && content.type !== MessageContentType.VOIP_CONTENT_TYPE_ACCEPT
                    && content.type !== MessageContentType.VOIP_CONTENT_TYPE_ACCEPT) {
                    return;
                }

                let participantUserInfos = [];
                let selfUserInfo = wfc.getUserInfo(wfc.getUserId());
                if (content.type === MessageContentType.VOIP_CONTENT_TYPE_START) {
                    this.conversation = msg.conversation;
                    this.callId = content.callId;
                    this.inviteMessageUid = msg.messageUid;
                    this.participants.push(...content.targetIds);
                    this.participants.push(msg.from);
                    // 参与者不包含自己
                    this.participants = this.participants.filter(uid => uid !== selfUserInfo.uid)

                    if (msg.conversation.type === ConversationType.Single) {
                        participantUserInfos = [wfc.getUserInfo(msg.from)];
                    } else {
                        let targetIds = content.targetIds.filter(id => id !== selfUserInfo.uid);
                        targetIds.push(msg.from);
                        participantUserInfos = wfc.getUserInfos(targetIds, msg.conversation.target);
                    }
                    if (!this.callWin) {
                        setTimeout(() => {
                            if (this.conversation) {
                                this.showCallUI(msg.conversation);
                            } else {
                                console.log('call ended')
                            }
                        }, 200)
                    }
                } else if (content.type === MessageContentType.VOIP_CONTENT_TYPE_ADD_PARTICIPANT) {
                    let participantIds = [...content.participants];
                    if (content.existParticipants) {
                        content.existParticipants.forEach(p => {
                            participantIds.push(p.userId);
                        });
                    }

                    this.conversation = msg.conversation;
                    this.callId = content.callId;
                    this.inviteMessageUid = msg.messageUid;
                    this.participants.push(...participantIds);

                    participantIds = participantIds.filter(u => u.uid !== selfUserInfo.uid);
                    participantUserInfos = wfc.getUserInfos(participantIds, msg.conversation.target);

                    if (!this.callWin && content.participants.indexOf(selfUserInfo.uid) > -1) {
                        setTimeout(() => {
                            if (this.conversation) {
                                this.showCallUI(msg.conversation);
                            } else {
                                console.log('call ended')
                            }
                        }, 200)
                    }
                } else if (content.type === MessageContentType.VOIP_CONTENT_TYPE_END) {
                    if(content.callId !== this.callId){
                        return;
                    }
                    this.conversation = null;
                    this.queueEvents = [];
                    this.callId = null;
                    this.inviteMessageUid = null;
                    this.participants = [];
                }

                if (msg.conversation.type === ConversationType.Group
                    && (content.type === MessageContentType.VOIP_CONTENT_TYPE_START
                        || content.type === MessageContentType.VOIP_CONTENT_TYPE_ADD_PARTICIPANT
                    )) {
                    let memberIds = wfc.getGroupMemberIds(msg.conversation.target);
                    msg.groupMemberUserInfos = wfc.getUserInfos(memberIds, msg.conversation.target);
                }

                msg.participantUserInfos = participantUserInfos;
                msg.selfUserInfo = selfUserInfo;
                msg.timestamp = longValue(numberValue(msg.timestamp) - delta)
                this.emitToVoip("message", msg);
            }
        }
    };

    emitToVoip(event, args) {
        if (isElectron()) {
            // renderer/main to renderer
            if (this.callWin) {
                // fix object of long.js can be send inter-process
                args = JSON.stringify(args)
                this.callWin.webContents.send(event, args);
            } else if (this.queueEvents) {
                this.queueEvents.push({event, args});
            }
        } else {
            if (this.events) {
                this.events.emit(event, args);
            } else if (this.queueEvents) {
                this.queueEvents.push({event, args});
            }
        }
    }

    listenMainEvent(event, listener) {
        if (isElectron()) {
            // listen for event from main
            ipcRenderer.on(event, listener);
        } else {
            this.events.on(event, listener);
        }
    }

    emitToMain(event, args) {
        console.log('emit to main', event, args);
        if (isElectron()) {
            // renderer to main
            ipcRenderer.send(event, args);
        } else {
            this.events.emit(event, args);
        }
    }

    listenVoipEvent = (event, listener) => {
        if (isElectron()) {
            // listen for event from renderer
            ipcRenderer.on(event, listener);
        } else {
            if (!this.events) {
                this.events = new PostMessageEventEmitter(this.useIframe ? window.parent : window.opener, window.location.origin);
            }
            this.events.on(event, listener);
        }
    };

    /**
     * 发起音视频通话
     * @param {Conversation} conversation 会话
     * @param {Boolean} audioOnly 是否是音频通话
     * @param {[String]} participants 参与者用户id列表
     */
    startCall(conversation, audioOnly, participants) {
        if (this.callWin) {
            console.log('voip call is ongoing');
            this.onVoipCallErrorCallback && this.onVoipCallErrorCallback(-1);
            return;
        }
        console.log(`speaker、microphone、webcam检测结果分别为：${this.hasSpeaker} , ${this.hasMicrophone}, ${this.hasWebcam}，如果不全为true，请检查硬件设备是否正常，否则通话可能存在异常`)
        if (!this.isSupportVoip || !this.hasSpeaker || !this.hasMicrophone || (!audioOnly && !this.hasWebcam)) {
            console.log('not support voip', this.isSupportVoip, this.hasSpeaker, this.hasMicrophone, this.hasWebcam);
            this.onVoipCallErrorCallback && this.onVoipCallErrorCallback(-2);
            return;
        }
        let selfUserInfo = wfc.getUserInfo(wfc.getUserId());
        participants = participants.filter(uid => uid !== selfUserInfo.uid);
        let callId = conversation.target + Math.floor(Math.random() * 10000);
        this.conversation = conversation;
        this.participants.push(...participants)
        this.callId = callId;

        let participantUserInfos = wfc.getUserInfos(participants);
        let groupMemberUserInfos;
        if (conversation.type === ConversationType.Group) {
            let memberIds = wfc.getGroupMemberIds(conversation.target);
            groupMemberUserInfos = wfc.getUserInfos(memberIds, conversation.target);
        }
        this.showCallUI(conversation, false);
        this.emitToVoip('startCall', {
            conversation: conversation,
            audioOnly: audioOnly,
            callId: callId,
            selfUserInfo: selfUserInfo,
            groupMemberUserInfos: groupMemberUserInfos,
            participantUserInfos: participantUserInfos
        });
    }

    /**
     * 开始会议
     * @param {string} callId 会议id
     * @param {boolean} audioOnly 是否仅仅开启音频; true，音频会议；false，视频会议
     * @param {string} pin 入会pin码
     * @param {string} host 主持人用户id
     * @param {string} title 会议标题
     * @param {string} desc 会议描述
     * @param {boolean} audience 其他人加入会议时，是否默认为观众；true，默认为观众；false，默认为互动者
     * @param {boolean} advance 是否为高级会议，当预计参与人员很多的时候，开需要开启超级会议
     * @param {boolean} record 是否开启服务端录制
     * @param {Object} extra 一些额外信息，主要用于将信息传到音视频通话窗口
     */
    startConference(callId, audioOnly, pin, host, title, desc, audience, advance, record = false, extra) {
        if (this.callWin) {
            console.log('voip call is ongoing');
            this.onVoipCallErrorCallback && this.onVoipCallErrorCallback(-1);
            return;
        }
        if (!this.isSupportVoip || !this.hasSpeaker || !this.hasMicrophone || !this.hasWebcam) {
            console.log('not support voip', this.isSupportVoip, this.hasSpeaker);
            this.onVoipCallErrorCallback && this.onVoipCallErrorCallback(-2);
            return;
        }

        callId = callId ? callId : wfc.getUserId() + Math.floor(Math.random() * 10000);
        this.callId = callId;
        this.conversation = null;
        this.conference = true;

        let selfUserInfo = wfc.getUserInfo(wfc.getUserId());
        this.showCallUI(null, true);
        this.emitToVoip('startConference', {
            audioOnly: audioOnly,
            callId: callId,
            pin: pin ? pin : Math.ceil(Math.random() * 1000000) + '',
            host: host,
            title: title,
            desc: desc,
            audience: audience,
            advance: advance,
            record: record,
            selfUserInfo: selfUserInfo,
            extra: extra,
        });
    }

    /**
     * 加入会议
     * @param {string} callId 会议id
     * @param {string} audioOnly 是否只开启音频
     * @param {string} pin 会议pin码
     * @param {string} host 会议主持人
     * @param {string} title 会议标题
     * @param {string} desc 会议描述
     * @param {string} audience 是否是以观众角色入会
     * @param {string} advance 是否是高级会议
     * @param {boolean} muteAudio 是否是静音加入会议
     * @param {boolean} muteVideo 是否是关闭摄像头加入会议
     * @param {Object} extra 一些额外信息，主要用于将信息传到音视频通话窗口
     */
    joinConference(callId, audioOnly, pin, host, title, desc, audience, advance, muteAudio, muteVideo, extra) {
        if (this.callWin) {
            console.log('voip call is ongoing');
            this.onVoipCallErrorCallback && this.onVoipCallErrorCallback(-1);
            return;
        }
        if (!this.isSupportVoip) {
            console.log('not support voip', this.isSupportVoip, this.hasSpeaker);
            this.onVoipCallErrorCallback && this.onVoipCallErrorCallback(-2);
            return;
        }

        this.conversation = null;
        this.conference = true;
        this.callId = callId;

        let selfUserInfo = wfc.getUserInfo(wfc.getUserId());
        this.showCallUI(null, true);
        this.emitToVoip('joinConference', {
            audioOnly: audioOnly,
            callId: callId,
            pin: pin,
            host: host,
            title: title,
            desc: desc,
            audience: audience,
            advance: advance,
            muteAudio: muteAudio,
            muteVideo: muteVideo,
            selfUserInfo: selfUserInfo,
            extra: extra,
        });
    }

    showCallUI(conversation, isConference) {
        let type = isConference ? 'conference' : (conversation.type === ConversationType.Single ? 'single' : 'multi');
        this.type = type;

        let width = 360;
        let height = 640;
        switch (type) {
            case 'single':
                width = 360;
                height = 640;
                break;
            case 'multi':
            case 'conference':
                width = 1024;
                height = 800;
                break;
            default:
                break;
        }
        if (isElectron()) {
            let win = new BrowserWindow(
                {
                    width: width,
                    height: height,
                    minWidth: width,
                    minHeight: height,
                    resizable: true,
                    maximizable: false,
                    transparent: true,
                    frame: false,
                    webPreferences: {
                        scrollBounce: false,
                        nativeWindowOpen: true,
                        nodeIntegration: true,
                        contextIsolation: false,
                    },
                }
            );
            // const remoteMain = require("@electron/remote").require("@electron/remote/main");
            const remoteMain = remote.require("@electron/remote/main");
            remoteMain.enable(win.webContents);

            win.webContents.on('did-finish-load', () => {
                this.onVoipWindowReady(win);
            });
            // win.webContents.openDevTools();
            win.on('close', () => {
                this.onVoipWindowClose();
            });

            // win.loadURL(path.join('file://', AppPath, 'src/index.html?' + type));
            let hash = window.location.hash;
            let url = window.location.origin;
            if (hash) {
                url = window.location.href.replace(hash, '#/voip');
            } else {
                url += "/voip"
            }
            url += '/' + type + '?t=' + new Date().getTime()
            win.loadURL(url);
            console.log('voip windows url', url)
            win.show();
            win.removeMenu();
        } else {
            console.log('location', window.location);
            let hash = window.location.hash;
            let url = window.location.origin;
            if (hash) {
                url += "/#/voip"
            } else {
                url += "/voip"
            }
            url += '/' + type + '?t=' + new Date().getTime()

            let win;
            let iframe = this.iframe;
            if (iframe) {
                if (iframe.src) {
                    iframe.src = url;
                    iframe.contentWindow.location.reload();
                }
                iframe.src = url;
                win = iframe.contentWindow;
            } else {
                win = window.open(url, '_blank', `width=${width},height=${height},left=200,top=200,toolbar=no,menubar=no,resizable=no,location=no,maximizable=no,resizable=no,dialog=yes`);
            }
            if (!win) {
                console.log('can not open voip window');
                return;
            }
            if (iframe) {
                iframe.onload = () => {
                    console.log('iframe loaded');
                    this.onVoipWindowReady(win);
                }
            } else {
                win.addEventListener('load', () => {
                    this.onVoipWindowReady(win);
                }, true);
            }

            // pls refer to https://stackoverflow.com/questions/52448909/onbeforeunload-not-working-inside-react-component
            // In react, if you need to handle DOM events not already provided by React you have to add DOM listeners after the component is mounted
            // 所以这儿延时一下
            setTimeout(() => {
                win.addEventListener('beforeunload', this.onVoipWindowClose);
            }, 600)
        }
    }

    onVoipWindowClose = (event) => {
        // 让voip内部先处理关闭事件，内部处理时，可能还需要发消息
        console.log('onVoipWindowClose')
        if (!this.callWin) {
            return;
        }
        if (!isElectron()) {
            this.callWin.removeEventListener('beforeunload', this.onVoipWindowClose)
        }
        setTimeout(() => {
            if (event && event.srcElement && event.srcElement.URL === 'about:blank') {
                // fix safari bug: safari 浏览器，页面刚打开的时候，也会走到这个地方
                return;
            }
            this.conversation = null;
            this.queueEvents = [];
            this.callId = null;
            this.participants = [];
            this.callWin = null;
            this.voipEventRemoveAllListeners(['message']);
        }, 2000);
    }

    onVoipWindowReady(win) {
        this.callWin = win;
        if (!isElectron()) {
            this.events = new PostMessageEventEmitter(win, window.location.origin)
            this.events.on('voip-message', this.sendVoipListener)
            this.events.on('conference-request', this.sendConferenceRequestListener);
            this.events.on('update-call-start-message', this.updateCallStartMessageContentListener)
            if (this.useIframe) {
                this.events.on('close-iframe-window', this.onVoipWindowClose)
            }
        }
        if (this.queueEvents.length > 0) {
            this.queueEvents.forEach((eventArgs) => {
                console.log('process queued event', eventArgs);
                this.emitToVoip(eventArgs.event, eventArgs.args);
            })
        }
    }

    voipEventRemoveAllListeners(events = []) {
        if (isElectron()) {
            // renderer
            events.forEach(e => ipcRenderer.removeAllListeners(e));
        } else {
            if (this.events) {
                this.events.stop();
                this.events = null;
            }
        }
    }

    forceCloseVoipWindow(){
        if (this.callWin){
            this.callWin.close();
        }
    }
}

const self = new AvEngineKitProxy();
export default self;
