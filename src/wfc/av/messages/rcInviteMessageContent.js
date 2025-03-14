/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */

import MessageContent from '../../messages/messageContent';
import MessageContentType from '../../messages/messageContentType';
import wfc from "../../client/wfc"

export default class RCInviteMessageContent extends MessageContent {
    callId;

    constructor(callId) {
        super(MessageContentType.VOIP_REMOTE_CONTROL_INVITE, 0, []);
        this.callId = callId;
    }

    digest() {
        return ''
    }

    encode() {
        let payload = super.encode();
        payload.content = this.callId;
        return payload;
    }

    decode(payload) {
        super.decode(payload);
        this.callId = payload.content;
    }
}
