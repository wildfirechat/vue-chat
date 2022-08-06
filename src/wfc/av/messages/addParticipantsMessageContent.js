/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */
import NotificationMessageContent from "../../messages/notification/notificationMessageContent";
import MessageContentType from "../../messages/messageContentType";
import wfc from "../../client/wfc"
import {de, me} from "../../../vendor/pinyin/data/dict-zi-web";

class ParticipantStatus {
    userId;
    acceptTime;
    joinTime;
    videoMuted;
}

export default class AddParticipantsMessageContent extends NotificationMessageContent {
    callId;
    initiator;
    pin;
    participants;
    existParticipants;
    audioOnly;
    autoAnswer;
    clientId;

    constructor() {
        super(MessageContentType.VOIP_CONTENT_TYPE_ADD_PARTICIPANT);
    }

    formatNotification(message) {
        let desc = '';
        if (this.fromSelf){
            desc = '您邀请'
        }else {
            desc = wfc.getGroupMemberDisplayName(message.conversation.target, this.initiator)
            desc += "邀请"
        }

        if (this.participants){
            this.participants.forEach(p => {
                desc += ' ';
                if (p === wfc.getUserId()){
                    desc += '您';
                }else {
                    desc += wfc.getGroupMemberDisplayName(message.conversation.target, p);
                }
            })
        }
        desc += ' 加入了通话';
        return desc;
    }

    encode() {
        let payload = super.encode();
        payload.content = this.callId;

        let obj = {
            initiator: this.initiator,
            audioOnly: this.audioOnly ? 1 : 0,
            pin: this.pin,
            participants: this.participants,
            existParticipants: this.existParticipants,
            autoAnswer: this.autoAnswer,
            clientId: this.clientId,
        };
        payload.binaryContent = wfc.utf8_to_b64(JSON.stringify(obj));

        let epids = this.existParticipants.map(p => p.userId);
        let pushData = {
            callId:this.callId,
            audioOnly:this.audioOnly,
            participants:this.participants,
            existParticipants: epids,
        }
        payload.pushData = JSON.stringify(pushData);
        return payload;
    }

    decode(payload) {
        super.decode(payload);
        this.callId = payload.content;
        let json = wfc.b64_to_utf8(payload.binaryContent);
        let obj = JSON.parse(json);
        this.initiator = obj.initiator;
        this.audioOnly = obj.audioOnly === 1;
        this.pin = obj.pin;
        this.participants = obj.participants;
        this.existParticipants = obj.existParticipants;
        this.autoAnswer = obj.autoAnswer;
        this.clientId = obj.clientId;
    }
}
