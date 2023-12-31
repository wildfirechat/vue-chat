import MessageContent from "./messageContent";
import MessageContentType from "./messageContentType";

export default class StreamingTextGeneratingMessageContent extends MessageContent {
    text = '';
    streamId = '';

    constructor() {
        super(MessageContentType.Streaming_Text_Generating);
    }

    digest(message) {
        return this.text;
    }

    encode() {
        let payload = super.encode();
        payload.searchableContent = this.text;
        payload.content = this.streamId;
        return payload;
    }

    decode(payload) {
        super.decode(payload);
        this.text = payload.searchableContent;
        this.streamId = payload.content;
    }
}