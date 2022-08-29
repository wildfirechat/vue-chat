import MessageContent from "./messageContent";
import MessageContentType from "./messageContentType";

export default class EnterChannelChatMessageContent extends MessageContent {
    constructor() {
        super(MessageContentType.Enter_Channel_Chat);
    }

}
