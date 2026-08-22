import MessageContent from "./messageContent";
import MessageContentType from "./messageContentType";

/**
 * 流式文本取消消息（20）：生成无产出/失败时由机器人发送，携带 streamId。
 * 客户端按 streamId 找到对应的 generating(14)/generated(15) 消息并从界面删除，
 * 取消消息自身不显示任何内容、不落库（Transparent）。
 */
export default class StreamingTextCancelledMessageContent extends MessageContent {
    text = '';
    streamId = '';

    constructor() {
        super(MessageContentType.Streaming_Text_Cancelled);
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
