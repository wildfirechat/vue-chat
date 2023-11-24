import conferenceApi from "../../../api/conferenceApi";
import avenginekitproxy from "../../../wfc/av/engine/avenginekitproxy";
import MessageContentType from "../../../wfc/messages/messageContentType";
import ConferenceCommandMessageContent from "../../../wfc/av/messages/conferenceCommandMessageContent";
import Conversation from "../../../wfc/model/conversation";
import ConversationType from "../../../wfc/model/conversationType";
import wfc from "../../../wfc/client/wfc";

class ConferenceManager {

    constructor() {
    }

    vueInstance;

    conferenceInfo = {};
    applyingUnmuteMembers = [];
    isApplyingUnmute = false;
    handUpMembers = [];
    isHandUp = false;
    isMuteAll = false;

    currentFocusUser = null;
    localFocusUser = null;

    selfUserId = null;

    setVueInstance(eventBus) {
        this.vueInstance = eventBus;
        this.selfUserId = wfc.getUserId();
        avenginekitproxy.listenVoipEvent('message', this.onReceiveMessage);
    }

    getConferenceInfo(conferenceId) {
        // TODO password
        conferenceApi.queryConferenceInfo(conferenceId, '')
            .then(info => {
                this.conferenceInfo = info;
            })
            .catch(err => {
                console.log(err)
            })
    }

    onReceiveMessage = async (event, msg) => {
        msg = this._fixLongSerializedIssue(msg)
        if (msg.messageContent.type === MessageContentType.CONFERENCE_CONTENT_TYPE_COMMAND) {
            let command = msg.messageContent;
            if (command.conferenceId !== this.conferenceInfo.conferenceId){
                console.log('not current conference', command.conferenceId, this.conferenceInfo.conferenceId);
                return;
            }
            let senderName;
            switch (command.commandType) {
                case ConferenceCommandMessageContent.ConferenceCommandType.MUTE_ALL:
                    this._reloadCurrentConferenceInfo();
                    this.onMuteAll();
                    break;
                case ConferenceCommandMessageContent.ConferenceCommandType.CANCEL_MUTE_ALL:
                    this._reloadCurrentConferenceInfo();
                    this.onCancelMuteAll(command.boolValue);
                    break;
                case ConferenceCommandMessageContent.ConferenceCommandType.REQUEST_MUTE:
                    if (command.targetUserId === this.selfUserId) {
                        this.onRequestMute(command.boolValue);
                    }
                    break;
                case ConferenceCommandMessageContent.ConferenceCommandType.REJECT_UNMUTE_REQUEST:
                    this.vueInstance.$notify({
                        text: '主持人拒绝了你的发言请求',
                        type: 'info'
                    });
                    break;
                case ConferenceCommandMessageContent.ConferenceCommandType.APPLY_UNMUTE:
                    senderName = wfc.getUserDisplayName(msg.from);
                    this.vueInstance.$notify({
                        text: senderName + '请求发言',
                        type: 'info'
                    });
                    if (command.boolValue) {
                        this.applyingUnmuteMembers.filter(uid => uid !== msg.from)
                    } else {
                        let index = this.applyingUnmuteMembers.findIndex(uid => uid === msg.from);
                        if (index === -1) {
                            this.applyingUnmuteMembers.push(msg.from);
                        }
                    }
                    break;
                case ConferenceCommandMessageContent.ConferenceCommandType.APPROVE_UNMUTE:
                case ConferenceCommandMessageContent.ConferenceCommandType.APPROVE_ALL_UNMUTE:
                    if (this.isApplyingUnmute) {
                        this.isApplyingUnmute = false;
                        if (command.boolValue) {
                            this.vueInstance.$eventBus.$emit('muteAudio', false);
                            this.vueInstance.$notify({
                                text: '主持人已同意了你的发言请求',
                                type: 'info'
                            });
                        }
                    }
                    break;
                case ConferenceCommandMessageContent.ConferenceCommandType.HANDUP:
                    if (command.boolValue) {
                        let index = this.handUpMembers.findIndex(uid => uid === msg.from);
                        if (index === -1) {
                            this.handUpMembers.push(msg.from);
                        }
                    } else {
                        this.handUpMembers = this.handUpMembers.filter(uid => uid !== msg.from);
                    }
                    senderName = wfc.getUserDisplayName(msg.from);
                    this.vueInstance.$notify({
                        text: command.boolValue ? senderName + '举手' : senderName + '放下举手',
                        type: 'info'
                    });
                    break;
                case ConferenceCommandMessageContent.ConferenceCommandType.PUT_HAND_DOWN:
                case ConferenceCommandMessageContent.ConferenceCommandType.PUT_ALL_HAND_DOWN:
                    if (this.isHandUp) {
                        this.isHandUp = false;
                        this.vueInstance.$notify({
                            text: '主持人放下了你的举手',
                            type: 'info'
                        });
                    }
                    break
                case ConferenceCommandMessageContent.ConferenceCommandType.RECORDING:
                    this.conferenceInfo.recording = command.boolValue;
                    this.vueInstance.$notify({
                        text: command.boolValue ? '主持人开始录制' : '主持人结束录制',
                        type: 'info'
                    });
                    break;
                case ConferenceCommandMessageContent.ConferenceCommandType.FOCUS:
                    this.conferenceInfo.focus = command.targetUserId;
                    this.vueInstance.$notify({
                        text: '主持人锁定焦点用户',
                        type: 'info'
                    });
                    break;
                case ConferenceCommandMessageContent.ConferenceCommandType.CANCEL_FOCUS:
                    this.conferenceInfo.focus = null;
                    this.vueInstance.$notify({
                        text: '主持人取消锁定焦点用户',
                        type: 'info'
                    });
                    break;
                default:
                    break;
            }
        }
    }

    applyUnmute(isCancel) {
        this.isApplyingUnmute = !isCancel;
        this._sendCommandMessage(ConferenceCommandMessageContent.ConferenceCommandType.APPLY_UNMUTE, null, isCancel);
    }

    approveUnmute(userId, isAllow) {
        if (!this.isOwner()) {
            return;
        }
        this.applyingUnmuteMembers = this.applyingUnmuteMembers.filter(uid => uid !== userId);
        this._sendCommandMessage(ConferenceCommandMessageContent.ConferenceCommandType.APPROVE_UNMUTE, userId, isAllow);
    }

    approveAllUnmute(isAllow) {
        if (!this.isOwner()) {
            return;
        }
        this.applyingUnmuteMembers.length = 0;
        this._sendCommandMessage(ConferenceCommandMessageContent.ConferenceCommandType.APPROVE_ALL_UNMUTE, null, isAllow);
    }

    requestMemberMute(userId, mute) {
        if (!this.isOwner()) {
            return;
        }

        this._sendCommandMessage(ConferenceCommandMessageContent.ConferenceCommandType.REQUEST_MUTE, userId, mute);
    }

    requestMuteAll(allowMemberUnmute) {
        if (!this.isOwner()) {
            return;
        }
        this.isMuteAll = true;
        this.conferenceInfo.audience = true;
        this.conferenceInfo.allowSwitchMode = allowMemberUnmute;
        conferenceApi.updateConference(this.conferenceInfo)
            .then(r => {
                this._sendCommandMessage(ConferenceCommandMessageContent.ConferenceCommandType.MUTE_ALL, null, allowMemberUnmute);
            })
            .catch(err => {
                console.log('updateConference error', err)
            })
    }

    requestUnmuteAll(unmute) {
        if (!this.isOwner()) {
            return;
        }

        this.isMuteAll = false;
        this.conferenceInfo.audience = false;
        this.conferenceInfo.allowSwitchMode = true;
        conferenceApi.updateConference(this.conferenceInfo)
            .then(r => {
                this._sendCommandMessage(ConferenceCommandMessageContent.ConferenceCommandType.CANCEL_MUTE_ALL, null, unmute);
            })
            .catch(err => {
                console.log('updateConference error', err)
            })
    }

    handUp(isHandUp) {
        this.isHandUp = isHandUp;
        this._sendCommandMessage(ConferenceCommandMessageContent.ConferenceCommandType.HANDUP, null, isHandUp);
        this.vueInstance.$notify({
            text: isHandUp ? "已举手，等待管理员处理" : "已放下举手",
            type: 'info'
        });
    }

    putMemberHnadDown(memberId) {
        if (!this.isOwner()) {
            return;
        }
        this.handUpMembers = this.handUpMembers.filter(uid => uid !== memberId);
        this._sendCommandMessage(ConferenceCommandMessageContent.ConferenceCommandType.PUT_HAND_DOWN, memberId, false);
    }

    putAllHandDown() {
        if (!this.isOwner()) {
            return;
        }
        this.handUpMembers.length = 0;
        this._sendCommandMessage(ConferenceCommandMessageContent.ConferenceCommandType.PUT_ALL_HAND_DOWN, null, false);
    }

    requestRecord(record) {
        if (!this.isOwner()) {
            return;
        }
        conferenceApi.recordConference(this.conferenceInfo.conferenceId, record)
            .then(r => {
                this.conferenceInfo.isRecording = record;
            })
            .catch(err => {
                console.log('recordConference error', err);
            });
    }

    requestFocus(userId) {
        if (!this.isOwner()) {
            return;
        }
        conferenceApi.setConferenceFocusUserId(this.conferenceInfo.conferenceId, userId)
            .then(r => {
                this.conferenceInfo.focus = userId;
            })
            .catch(err => {
                console.log('requestFocus err', err);
            })
    }

    requestCancelFocus() {
        this.requestFocus(null);
    }

    onMuteAll() {
        this.vueInstance.$eventBus.$emit('muteVideo', true);
        this.vueInstance.$eventBus.$emit('muteAudio', true);
        this.vueInstance.$notify({
            text: '管理员将全体成员静音了',
            type: 'info'
        });
    }

    onCancelMuteAll(requestUnmute) {
        if (requestUnmute && this.vueInstance.selfUserInfo._isAudience) {
            this.vueInstance.$alert({
                showIcon: false,
                content: '主持人关闭了全员静音，是否要打开麦克风',
                confirmText: '开启麦克风',
                cancelCallback: () => {
                    // do nothing
                },
                confirmCallback: () => {
                    this.vueInstance.$eventBus.$emit('muteAudio', false);
                }
            })

        }
        this.vueInstance.$notify({
            text: '管理员将取消了全体成员静音',
            type: 'info'
        });
    }

    onRequestMute(mute) {
        if (!mute) {
            this.vueInstance.$alert({
                showIcon: false,
                content: '主持人邀请你发言',
                confirmText: '接受',
                cancelCallback: () => {
                    // do nothing
                },
                confirmCallback: () => {
                    this.vueInstance.$eventBus.$emit('muteAudio', false);
                }
            })
        } else {
            this.vueInstance.$eventBus.$emit('muteVideo', true);
            this.vueInstance.$eventBus.$emit('muteAudio', true);

            this.vueInstance.$notify({
                text: '管理员关闭了你的发言',
                type: 'info'
            });
        }
    }

    addHistory(conferenceInfo, durationMS) {
        console.log('addHistory', conferenceInfo, durationMS);
        let tmp = localStorage.getItem('historyConfList');
        let historyList = JSON.parse(tmp);
        historyList = historyList ? historyList : [];
        conferenceInfo.endTime = Math.ceil(conferenceInfo.startTime + durationMS / 1000);
        let index = historyList.findIndex(info => info.conferenceId === conferenceInfo.conferenceId)
        if (index >= 0) {
            historyList[index] = conferenceInfo;
        } else {
            historyList.push(conferenceInfo);
            if (historyList.length > 50) {
                historyList = historyList.shift();
            }
        }
        localStorage.setItem('historyConfList', JSON.stringify(historyList, null, ''));
    }

    getHistoryConference() {
        let tmp = localStorage.getItem('historyConfList');
        let historyList = JSON.parse(tmp);
        historyList = historyList ? historyList : [];
        return historyList;
    }

    _fixLongSerializedIssue(msg) {
        if (typeof msg !== 'string') {
            return msg;
        }
        msg = JSON.parse(msg);
        if (typeof msg === 'string') {
            msg = JSON.parse(msg);
        }
        return msg;
    }

    _reloadCurrentConferenceInfo() {
        conferenceApi.queryConferenceInfo(this.conferenceInfo.conferenceId, this.conferenceInfo.password)
            .then(info => {
                this.conferenceInfo = info;
            })
            .catch(err => {
                console.log(err)
            })
    }

    isOwner() {
        return this.conferenceInfo.owner === this.selfUserId;
    }

    _sendCommandMessage(commandType, targetUser, boolValue) {
        let content = new ConferenceCommandMessageContent(this.conferenceInfo.conferenceId, commandType, targetUser, boolValue);
        let conversation = new Conversation(ConversationType.ChatRoom, this.conferenceInfo.conferenceId, 0);
        wfc.sendConversationMessage(conversation, content);
    }
}

let self = new ConferenceManager();
export default self;
