import ConversationType from "./conversationType";
import wfc from "../client/wfc";
import MessageContentType from "../messages/messageContentType";
import Message from "../messages/message";
import TextMessageContent from "../messages/textMessageContent";
import ImageMessageContent from "../messages/imageMessageContent";
import VideoMessageContent from "../messages/videoMessageContent";
import FileMessageContent from "../messages/fileMessageContent";
import CompositeMessageContent from "../messages/compositeMessageContent";
import MessagePayload from "../messages/messagePayload";
import SoundMessageContent from "../messages/soundMessageContent";
import Long from "long";
import UnknownMessageContent from "../messages/unknownMessageContent";
import Config from '../../config'
export default class FavItem {
    id;
    messageUid;
    // 和消息类型对应
    favType;
    timestamp;
    conversation;
    origin;
    sender;
    title;
    url;
    thumbUrl;
    data;

    static fromMessage(message) {
        let favItem = new FavItem();
        favItem.messageUid = message.messageUid;
        favItem.conversation = message.conversation;
        favItem.favType = message.messageContent.type;
        favItem.sender = message.from;
        switch (message.conversation.type) {
            case ConversationType.Group:
                let groupInfo = wfc.getGroupInfo(message.conversation.target, false);
                favItem.origin = groupInfo.name;
                break;
            case ConversationType.Single:
                favItem.origin = wfc.getUserDisplayName(message.from);
                break;
            case ConversationType.Channel:
                let channelInfo = wfc.getChannelInfo(message.conversation.target, false);
                favItem.origin = channelInfo.name;
                break;
            case ConversationType.ChatRoom:
                break;
            default:
                break;
        }

        let data;
        switch (message.messageContent.type) {
            case MessageContentType.Text:
                let textMessageContent = message.messageContent;
                favItem.title = textMessageContent.content;
                break;
            case MessageContentType.Image:
                let imageContent = message.messageContent;
                favItem.url = imageContent.remotePath;
                if (imageContent.thumbnail) {
                    let data = {
                        "thumb": imageContent.thumbnail,
                    }
                    favItem.data = JSON.stringify(data);
                }
                break;
            case MessageContentType.Video:
                let videoContent = message.messageContent;
                favItem.url = videoContent.remotePath;
                data = {
                    duration: videoContent.duration,
                }
                if (videoContent.thumbnail) {
                    data['thumb'] = videoContent.thumbnail;
                }
                favItem.data = JSON.stringify(data);
                break;
            case MessageContentType.File:
                let fileContent = message.messageContent;
                favItem.url = fileContent.remotePath;
                favItem.title = fileContent.name;
                data = {
                    size: fileContent.size,
                }
                favItem.data = JSON.stringify(data);
                break;
            case MessageContentType.Composite_Message:
                let compositeContent = message.messageContent;
                favItem.title = compositeContent.title;
                let payload = compositeContent.encode();
                favItem.data = payload.binaryContent;
                break;
            case MessageContentType.Voice:
                let voiceContent = message.messageContent;
                favItem.url = voiceContent.remotePath;
                data = {
                    duration: voiceContent.duration,
                }
                favItem.data = JSON.stringify(data);
                break;
        // TODO
            // case MessageContentType.Link:
            //     break
            default:
                break;
        }
        if (Config.urlRedirect){
            favItem.url = Config.urlRedirect(favItem.url);
        }
        return favItem;
    }

    toMessage() {
        let content;
        try {
        switch (this.favType) {
            case MessageContentType.Text:
                content = new TextMessageContent(this.title);
                break;
            case MessageContentType.Image:
                content = new ImageMessageContent(null, this.url);
                if (this.data) {
                    content.thumbnail = this.data.thumb;
                }
                break;
            case MessageContentType.Video:
                content = new VideoMessageContent(null, this.url);
                if (this.data) {
                    content.thumbnail = this.data.thumb;
                }
                break;
            case MessageContentType.File:
                content = new FileMessageContent(null, this.url, this.title);
                if (this.data) {
                    content.size = this.data.size;
                }
                break;
            case MessageContentType.Composite_Message:
                content = new CompositeMessageContent();
                content.title = this.title;
                if (this.data) {
                    let payload = new MessagePayload();
                    //let payloadBytes = wfc.b64_to_utf8(this.data)
                    payload.type = this.favType;
                    payload.content = this.title;
                    payload.binaryContent = this.data;
                    content.decode(payload)
                }
                break;
            case MessageContentType.Voice:
                content = new SoundMessageContent(null, this.url)
                if (this.data) {
                    content.duration = this.data.duration;
                }
                break;
        // TODO
            // case MessageContentType.Link:
            //     break
            default:
                break;
        }
        }catch (e) {
            console.log('toMessage Error', e)
            content = new UnknownMessageContent();
        }
        let msg = new Message(this.conversation, content);
        if (this.messageUid) {
            msg.messageUid = Long.fromValue(this.messageUid);
        }

        return msg;
    }
}
