import MessageContent from "../../messages/messageContent";
import MessageContentType from "../../messages/messageContentType";
import wfc from "../../client/wfc";

export default class ConferenceChangeModeContent extends MessageContent {
    callId;
    audience;

    constructor(callId, audience) {
        super(MessageContentType.CONFERENCE_CONTENT_TYPE_CHANGE_MODE);
        this.callId = callId;
        this.audience = audience;
    }

    encode() {
        let payload = super.encode();
        payload.content = this.callId;
        let obj = {'a': this.audience};
        payload.binaryContent = wfc.utf8_to_b64(JSON.stringify(obj))
        return payload;
    }

    decode(payload) {
        super.decode(payload);
        this.callId = payload.content;
        if (payload.binaryContent) {
            let json = wfc.b64_to_utf8(payload.binaryContent);
            let obj = JSON.parse(json);
            this.audience = !!obj.a;
        }
    }
}
