/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */

import MessageContent from '../../messages/messageContent';
import wfc from "../../client/wfc"
import {_patchToJavaLong, _reverseToJsLongString, longValue, stringValue} from '../../util/longUtil'
import MessageContentType from '../../messages/messageContentType';

export default class CallAnswerMessageContent extends MessageContent {
    callId;
    audioOnly;
    inviteMessageUid;

    constructor(mentionedType = 0, mentionedTargets = []) {
        super(MessageContentType.VOIP_CONTENT_TYPE_ACCEPT, mentionedType, mentionedTargets);
    }

    digest() {
        return '';
    }

    encode() {
        let payload = super.encode();
        payload.content = this.callId;

        var obj;
        if (this.audioOnly) {
            obj = '1';
        } else {
            obj = '0';
        }
        payload.binaryContent = wfc.utf8_to_b64(obj);
        let obj2 = {
            u: stringValue(this.inviteMessageUid),
        }
        let str = JSON.stringify(obj2);
        str = _patchToJavaLong(str, 'u');
        payload.extra = str;
        return payload;
    }

    decode(payload) {
        super.decode(payload);
        this.callId = payload.content;
        let str = wfc.b64_to_utf8(payload.binaryContent);

        this.audioOnly = (str === '1');
        str = payload.extra;
        if (str) {
            str = _reverseToJsLongString(str, 'u');
            this.inviteMessageUid = longValue(JSON.parse(str).u);
        }
    }
}
