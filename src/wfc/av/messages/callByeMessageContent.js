/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */
import MessageContent from '../../messages/messageContent';
import MessageContentType from '../../messages/messageContentType';
import wfc from "../../client/wfc"
import {_patchToJavaLong, _reverseToJsLongString, longValue, stringValue} from "../../util/longUtil"

export default class CallByeMessageContent extends MessageContent {
    callId;
    reason;
    inviteMsgUid;

    constructor(mentionedType = 0, mentionedTargets = []) {
        super(MessageContentType.VOIP_CONTENT_TYPE_END, mentionedType, mentionedTargets);
    }

    digest() {
        return '';
    }

    encode() {
        let payload = super.encode();
        payload.content = this.callId;
        let obj = {
            r: this.reason,
            u: this.inviteMsgUid ? stringValue(this.inviteMsgUid) : undefined,
        };
        let str = JSON.stringify(obj)
        str = _patchToJavaLong(str, 'u');
        payload.binaryContent = wfc.utf8_to_b64(str);
        payload.pushData = str;
        return payload;
    }

    decode(payload) {
        super.decode(payload);
        this.callId = payload.content;
        let str = wfc.b64_to_utf8(payload.binaryContent);
        str = _reverseToJsLongString(str, 'u');
        let obj = JSON.parse(str);
        this.reason = obj.r;
        this.inviteMsgUid = obj.u ? longValue(obj.u) : undefined;
    }
}
