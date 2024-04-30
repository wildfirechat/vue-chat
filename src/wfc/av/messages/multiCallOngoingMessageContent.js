/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */
import MessageContent from '../../messages/messageContent';
import wfc from "../../client/wfc"
import MessageContentType from '../../messages/messageContentType';

export default class MultiCallOngoingMessageContent extends MessageContent {
    callId;
    initiator;
    audioOnly;
    targets;

    constructor(callId, initiator, audioOnly, targets) {
        super(MessageContentType.VOIP_Multi_Call_Ongoing);
        this.callId = callId;
        this.initiator = initiator;
        this.audioOnly = audioOnly;
        this.targets = targets;
    }

    digest(message) {
        let displayName = wfc.getGroupMemberDisplayName(message.conversation.target, this.initiator);
        return displayName + ' 发起的通话';
    }

    encode() {
        let payload = super.encode();
        payload.content = this.callId;

        let obj = {
            initiator: this.initiator,
            audioOnly: this.audioOnly ? 1 : 0,
            targets: this.targets
        }
        payload.binaryContent = wfc.utf8_to_b64(JSON.stringify(obj));
        return payload;
    }

    decode(payload) {
        super.decode(payload);
        this.callId = payload.content;
        let json = wfc.b64_to_utf8(payload.binaryContent);
        let obj = JSON.parse(json);
        this.initiator = obj.initiator;
        this.audioOnly = obj.audioOnly === 1;
        this.targets = obj.targets;
    }
}
