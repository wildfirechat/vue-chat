/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */

import MessageContent from '../../messages/messageContent';
import MessageContentType from '../../messages/messageContentType';
import wfc from "../../client/wfc"
import {_patchToJavaLong, stringValue} from "../../util/longUtil";

export default class RcEndMessageContent extends MessageContent {
    callId;
    reason; // 1, reject, 2, hangup, 3, timeout, 4, busy

    constructor(callId, reason) {
        super(MessageContentType.VOIP_REMOTE_CONTROL_END, 0, []);
        this.callId = callId;
        this.reason = reason;
    }

    digest() {
        return ''
    }

    encode() {
        let payload = super.encode();
        payload.content = this.callId;
        let obj = {
            r: this.reason,
        };
        payload.binaryContent = wfc.utf8_to_b64(JSON.stringify(obj));
        return payload;
    }

    decode(payload) {
        super.decode(payload);
        this.callId = payload.content;
        if (payload.binaryContent) {
            let json = wfc.b64_to_utf8(payload.binaryContent);
            let obj = JSON.parse(json);
            this.reason = obj.r
        }
    }
}
