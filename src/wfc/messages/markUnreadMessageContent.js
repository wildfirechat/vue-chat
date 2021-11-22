import MessageContent from "./messageContent";
import MessageContentType from "./messageContentType";
import {_patchToJavaLong, _reverseToJsLongString, longValue, stringValue} from "../util/longUtil";
import wfc from "../client/wfc";

export default class MarkUnreadMessageContent extends MessageContent {
    messageUid;

    constructor(messageUid) {
        super(MessageContentType.Mark_Unread_Sync);
        this.messageUid = messageUid;
    }

    encode() {
        let payload = super.encode();
        let obj = {
            u: stringValue(this.messageUid),
        }
        let str = JSON.stringify(obj)
        str = _patchToJavaLong(str, 'u');
        payload.binaryContent = wfc.utf8_to_b64(str);

        return payload;
    }

    decode(payload) {
        super.decode(payload);

        let str = wfc.b64_to_utf8(payload.binaryContent);
        str = _reverseToJsLongString(str, 'u');
        let obj = JSON.parse(str);
        this.messageUid = obj.u ? longValue(obj.u) : undefined;
    }

}
