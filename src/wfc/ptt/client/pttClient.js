import {EventEmitter} from "events";
import wfc from "../../client/wfc";
import PttClientImpl from "../internal/ptt.min";
import PttErrorCode from "./pttErrorCode";
import ConversationType from "../../model/conversationType";
import GroupMemberType from "../../model/groupMemberType";
import NullGroupInfo from "../../model/nullGroupInfo";
import ModifyGroupInfoType from "../../model/modifyGroupInfoType";
import UserSettingScope from "../../client/userSettingScope";
import PttEventType from "./pttEventType";

export class PttClient {

    /**
     * 只在正常模式下生效
     * 单聊会话里面，最多允许几个人同时说话
     */
    static SINGLE_CHAT_MAX_SPEAKER_COUNT = 1;

    /**
     * 只在正常模式下生效
     * 群会话里面，最多允许几个人同时说话
     */
    static GROUP_CHAT_MAX_SPEAKER_COUNT = 3;

    // 对讲时，是否发送额外的语音消息
    static SINGLE_CHAT_SEND_VOICE_MESSAGE = true;
    static GROUP_CHAT_SEND_VOICE_MESSAGE = true;
    /**
     * 单位是秒
     */
    static SINGLE_CHAT_MAX_SPEAK_TIME = 60;

    /**
     * 单位是秒
     */
    static GROUP_CHAT_MAX_SPEAK_TIME = 60;

    /**
     * 对讲模式
     * 默认是正常模式
     * 1. 正常模式，用户可以同时播放多路对讲，一个会话里面，可以配置允许多个人同时说话
     * 2. 优先级模式，用户只能播放优先级最高的那路对讲，一个会话里面，只允许一个人说话
     */
    static ENABLE_PRIORITY_MODE = false;

    /**
     * 全局开启对讲功能，为false时，会话需要分别开启 {@link PTTClient#setEnablePtt}
     */
    static ENABLE_GLOBAL_PTT = true;

    //  是否支持双工模式，双工模式下，说话的时候，允许收听其他人的说话。
    static ENABLE_FULL_DUPLEX = false;


    /**
     * 事件通知，{@link PttEventType}中定义的事件，都会采用本{@link eventEmitter} 通知
     * @type {module:events.internal.EventEmitter}
     */
    eventEmitter = new EventEmitter();
    deltaTime;
    conversationPttStatusMap = new Map();


    pttClientImpl;

    // 初始化
    init() {
        if (this.pttClientImpl) {
            console.warn('already init')
            return;
        }
        this.deltaTime = wfc.getServerDeltaTime();
        this.pttClientImpl = new PttClientImpl(this.eventEmitter);
        this.pttClientImpl.init();

        this._eventTest();
    }

    uninit() {
        if (!this.pttClientImpl) {
            return;
        }
        this.pttClientImpl.end();
        this.pttClientImpl = null;
    }

    /**
     * 请求说话
     * @param conversation
     * @param talkingCallback
     */
    requestTalk(conversation, talkingCallback) {
        console.log('requestTalk', conversation, talkingCallback)
        if (!talkingCallback || !this.pttClientImpl || !conversation) {
            console.error('can not requestTalk, callback is null or not init')
            return;
        }
        if (!PttClient.ENABLE_GLOBAL_PTT) {
            let enabled = this.conversationPttStatusMap.get(this._conversationKey(conversation));
            if (!enabled) {
                talkingCallback.onRequestFail(conversation, PttErrorCode.PTT_DISABLED);
                return;
            }
        }

        if (this.pttClientImpl.recordingSession) {
            talkingCallback.onRequestFail(conversation, PttErrorCode.TALKING);
            return;
        }

        let maxSpeakerCount = 1;
        if (!PttClient.ENABLE_PRIORITY_MODE) {
            maxSpeakerCount = conversation.type === ConversationType.Single ? PttClient.SINGLE_CHAT_MAX_SPEAKER_COUNT : PttClient.GROUP_CHAT_MAX_SPEAKER_COUNT;
        }

        let maxDurationMillis = PttClient.SINGLE_CHAT_MAX_SPEAK_TIME * 1000;
        let sendVoiceMessage = conversation.type === ConversationType.Single ? PttClient.SINGLE_CHAT_SEND_VOICE_MESSAGE : PttClient.GROUP_CHAT_SEND_VOICE_MESSAGE;

        if (conversation.type === ConversationType.Group) {
            maxDurationMillis = PttClient.GROUP_CHAT_MAX_SPEAK_TIME * 1000;
            let groupInfo = wfc.getGroupInfo(conversation.target, false);
            if (!groupInfo || groupInfo instanceof NullGroupInfo) {
                console.error('requestTalk failed, groupInfo is null')
                talkingCallback.onRequestFail(conversation, -1);
                return;
            }

            let selfUid = wfc.getUserId();
            let groupMember = wfc.getGroupMember(conversation.target, selfUid);
            if (groupInfo.mute === 1 && (groupMember.type !== GroupMemberType.Owner && groupMember.type !== GroupMemberType.Manager)) {
                talkingCallback.onRequestFail(conversation, PttErrorCode.GROUP_MUTED);
                return;
            } else if (groupMember.type === GroupMemberType.Muted) {
                talkingCallback.onRequestFail(conversation, PttErrorCode.GROUP_MEMBER_MUTED);
                return;
            }

            let groupExtra = groupInfo.extra;
            if (groupExtra) {
                try {
                    let obj = JSON.parse(groupExtra);
                    maxSpeakerCount = !PttClient.ENABLE_PRIORITY_MODE && obj.hasOwnProperty('n') ? obj.n : 1;
                    sendVoiceMessage = obj.hasOwnProperty('s') ? obj.s : sendVoiceMessage;
                    maxDurationMillis = obj.hasOwnProperty('t') ? obj.t : PttClient.GROUP_CHAT_MAX_SPEAK_TIME;
                    maxDurationMillis = maxDurationMillis * 1000;
                } catch (e) {
                    console.error('parse groupExtra error', e);
                }
            }
        }

        let talkingMemberCount = this.getTalkingMembers(conversation);
        if (maxSpeakerCount === 1) {
            if (talkingMemberCount === 1) {
                talkingCallback.onRequestFail(conversation, PttErrorCode.MAX_SPEAKER);
            } else {
                let priority = talkingCallback.talkingPriority(conversation);
                wfc.requireLock('WFPTT_' + conversation.target, 5, () => {
                    this.pttClientImpl._startTalk(conversation, maxDurationMillis, sendVoiceMessage, priority, talkingCallback)
                }, err => {
                    talkingCallback.onRequestFail(conversation, PttErrorCode.OCCUPIED);
                })
            }
        } else if (maxSpeakerCount === 0 || maxSpeakerCount > talkingMemberCount) {
            let priority = talkingCallback.talkingPriority(conversation);
            this.pttClientImpl._startTalk(conversation, maxDurationMillis, sendVoiceMessage, priority, talkingCallback)
        } else {
            talkingCallback.onRequestFail(conversation, PttErrorCode.MAX_SPEAKER);
        }
    }

    // 说话结束
    releaseTalk(conversation) {
        if (!this.pttClientImpl) {
            return;
        }
        this.pttClientImpl.stopRecord();
    }

    /**
     * 获取频道允许同时说话人数
     */
    getMaxSpeakCount(conversation) {
        if (conversation.type === ConversationType.Group) {
            let extra = this._getGroupExtra(conversation.target);
            return extra.hasOwnProperty('n') ? extra.n : PttClient.GROUP_CHAT_MAX_SPEAKER_COUNT;
        } else {
            return PttClient.SINGLE_CHAT_MAX_SPEAKER_COUNT;
        }
    }

    isSendVoiceMessage(conversation) {
        if (conversation.type === ConversationType.Group) {
            let extra = this._getGroupExtra(conversation.target);
            return extra.hasOwnProperty('s') ? extra.s : PttClient.GROUP_CHAT_SEND_VOICE_MESSAGE;
        } else {
            return PttClient.SINGLE_CHAT_SEND_VOICE_MESSAGE;
        }
    }

    getMaxSpeakTime(conversation) {
        if (conversation.type === ConversationType.Group) {
            let extra = this._getGroupExtra(conversation.target);
            return extra.hasOwnProperty('t') ? extra.t : PttClient.GROUP_CHAT_MAX_SPEAK_TIME;
        } else {
            return PttClient.SINGLE_CHAT_MAX;
        }
    }

    setSendVoiceMessage(conversation, send, successCB, failCB) {
        if (conversation.type === ConversationType.Group) {
            let obj = this._getGroupExtra(conversation.target);
            obj['s'] = send;
            this._updateGroupExtra(conversation.target, conversation.line, obj, successCB, failCB)
        } else {
            failCB && failCB(-1);
            console.error('错误，此方法只在群组有效')
        }
    }

    setConversationMaxSpeakTime(conversation, duration, successCB, failCB) {
        if (conversation.type === ConversationType.Group) {
            let obj = this._getGroupExtra(conversation.target);
            obj['t'] = duration;
            this._updateGroupExtra(conversation.target, conversation.line, obj, successCB, failCB)
        } else {
            failCB && failCB(-1);
            console.error('错误，此方法只在群组有效')
        }
    }

    setConversationMaxSpeakerCount(conversation, count, successCB, failCB) {
        if (conversation.type === ConversationType.Group) {
            let obj = this._getGroupExtra(conversation.target);
            obj['n'] = count;
            this._updateGroupExtra(conversation.target, conversation.line, obj, successCB, failCB)
        } else {
            failCB && failCB(-1);
            console.error('错误，此方法只在群组有效')
        }
    }

    setConversationPttSilent(conversation, silent, successCB, failCB) {
        let key = conversation.target + '-' + conversation.type + '-' + conversation.line;
        wfc.setUserSetting(UserSettingScope.PttSilent, key, silent ? "1" : 0, successCB, failCB);
        if (this.pttClientImpl){
            this.pttClientImpl.setConversationPttSilent(conversation, silent)
        }
    }

    isConversationPttSilent(conversation) {
        let key = conversation.target + '-' + conversation.type + '-' + conversation.line;
        let value = wfc.getUserSetting(UserSettingScope.PttSilent, key);
        return value === '1';
    }

    getTalkingConversation() {
        return this.pttClientImpl.getTalkingConversation();
    }

    getTalkingStartTime() {
        return this.pttClientImpl.getTalkingStartTime();
    }

    getTalkingMembers(conversation) {
        return this.pttClientImpl.getTalkingMembers(conversation);
    }

    getTalkingMemberCount(conversation) {
        return this.pttClientImpl.getTalkingMembers(conversation).length;
    }

    setEnablePtt(conversation, enable) {
        if (!conversation) {
            this.conversationPttStatusMap.set(this._conversationKey(conversation), enable);
        }
    }

    _conversationKey(conversation) {
        return conversation.type + '-' + conversation.target + '-' + conversation.line;
    }

    _getGroupExtra(groupId) {
        let groupInfo = wfc.getGroupInfo(groupId, false);
        let obj = {};
        if (!groupInfo || groupInfo instanceof NullGroupInfo || !groupInfo.extra) {
            return obj;
        }
        try {
            return JSON.parse(groupInfo.extra);
        } catch (e) {
            console.error('parse group extra error', e)
        }
        return obj;
    }

    // TODO more api
    _updateGroupExtra(groupId, notifyLine, extra, successCB, failCB) {
        extra = !extra ? {} : extra;
        wfc.modifyGroupInfo(groupId, ModifyGroupInfoType.Modify_Group_Extra, JSON.stringify(extra), [notifyLine], null, successCB, failCB);

    }

    _eventTest() {
        // //某人开始在频道中讲话
        // // function (conversation, userId) {}
        // static userStartTalking = 'userStartTalking'
        //
        // //某人结束在频道中讲话
        // // function (conversation, userId) {}
        // static userEndTalking = 'userEndTalking'
        //
        // //接收到用户自定义数据
        // // function (conversation, userId, data) {}
        // static receiveData = 'receiveData';
        //
        // //用户说话音量大小回调
        // // function (conversation, userId, averageAmplitude) {}
        // static userAmplitudeUpdate = 'userAmplitudeUpdate';
        this.eventEmitter.on(PttEventType.userStartTalking, (conversation, userId) => {
            console.log('userStartTalking', conversation, userId);
        })
        this.eventEmitter.on(PttEventType.userEndTalking, (conversation, userId) => {
            console.log('userEndTalking', conversation, userId);
        })
        this.eventEmitter.on(PttEventType.receiveData, (conversation, userId, data) => {
            console.log('receiveData', conversation, userId, data);
        })
        this.eventEmitter.on(PttEventType.userAmplitudeUpdate, (conversation, userId, averageAmplitude) => {
            console.log('userAmplitudeUpdate', conversation, userId, averageAmplitude);
        })
    }
}

const self = new PttClient();
export default self;
