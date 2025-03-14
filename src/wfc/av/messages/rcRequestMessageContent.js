/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */

import MessageContent from '../../messages/messageContent';
import MessageContentType from '../../messages/messageContentType';
import wfc from "../../client/wfc"

export default class RcRequestMessageContent extends MessageContent {
    callId;
    pin
    targetIds = [];
    audioOnly = false;

    constructor(callId, pin) {
        super(MessageContentType.VOIP_REMOTE_CONTROL_REQUEST, 0, []);
        this.callId = callId;
        this.pin = pin;
    }

    digest() {
        return ''
    }

    encode() {
        let payload = super.encode();
        payload.content = this.callId;
        let obj = {
            a: this.audioOnly ? 1 : 0,
            ts: this.targetIds,
            p: this.pin,
        }
        payload.binaryContent = wfc.utf8_to_b64(JSON.stringify(obj));
        return payload;
    }

    decode(payload) {
        super.decode(payload);
        this.callId = payload.content;
        let json = wfc.b64_to_utf8(payload.binaryContent);
        let obj = JSON.parse(json);

        this.audioOnly = (obj.a === 1);
        this.targetIds = obj.ts
        this.pin = obj.p;
    }
}
