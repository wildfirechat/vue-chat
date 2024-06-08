import CustomMessageContentType from "./customMessageContentType";


import MessageContent from '../wfc/messages/messageContent'

/**
 * 对应的 UI，请参考{@link TestCustomMessageContentView}
 */
export default class TestCustomMessageContent extends MessageContent {
    content;

    constructor(content) {
        super(CustomMessageContentType.MESSAGE_CONTENT_TYPE_CUSTOM_MESSAGE_TEST);
        this.content = content;
    }

    // 会话列表显示对应会话时，会显示会话最后一条消息的摘要信息
    digest() {
        return this.content;
    }

    // 发送消息时，会进行 encode 操作，实际发送的是 payload
    encode() {
        let payload = super.encode();
        payload.searchableContent = this.content;
        return payload;
    }

    // 收到消息时，会执行 decode 操作，从 payload 解析到具体的消息内容，encode 和 decode 的操作要对应起来
    decode(payload) {
        super.decode(payload);
        this.content = payload.searchableContent;
    }
}

