import MessageContent from "../../messages/messageContent";
import MessageContentType from "../../messages/messageContentType";

export default class ConferenceKickoffMemberMessageContent extends MessageContent {
    callId;

    constructor(callId) {
        super(MessageContentType.CONFERENCE_CONTENT_TYPE_KICKOFF_MEMBER)
        this.callId = callId;
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
