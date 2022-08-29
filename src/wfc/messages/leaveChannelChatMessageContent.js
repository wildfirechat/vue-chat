import MessageContent from "./messageContent";
import MessageContentType from "./messageContentType";

export default class LeaveChannelChatMessageContent extends MessageContent {
    constructor() {
        super(MessageContentType.Leave_Channel_Chat);
    }

}
