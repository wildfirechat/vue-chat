import MessageContent from "../../wfc/messages/messageContent";
import MessageContentType from "../../wfc/messages/messageContentType";
import wfc from "../../wfc/client/wfc";
import MediaMessageContent from "../../wfc/messages/mediaMessageContent";
import {stringValue} from "../../wfc/util/longUtil";
import Message from "../../wfc/messages/message";
import Conversation from "../../wfc/model/conversation";
import Long from "long";
import MessagePayload from "../../wfc/messages/messagePayload";

export default class CompositeMessageContent extends MessageContent {
    title = '';
    messages = [];

    constructor() {
        super(MessageContentType.Composite_Message)
    }

    setMessages(msgs) {
        this.messages = msgs;
    }

    digest(message) {
        return '[聊天记录]' + this.title;
    }

    encode() {
        let payload = super.encode();
        payload.content = this.title;
        let arr = [];
        this.messages.forEach(msg => {
            let msgPayload = msg.messageContent.encode();
            let o = {
                uid: stringValue(msg.messageUid),
                type: msg.conversation.type,
                target: msg.conversation.target,
                line: msg.conversation.line,
                from: msg.from,
                tos: msg.to,
                direction: msg.direction,
                status: msg.status,
                serverTime: msg.serverTime,
                ctype: msgPayload.type,
                csc: msgPayload.searchableContent,
                cpc: msgPayload.pushContent,
                cpd: msgPayload.pushData,
                cc: msgPayload.content,
                cmt: msgPayload.mentionedType,
                cmts: msgPayload.mentionedTargets,
                ce: msgPayload.extra,
            };

            if (msgPayload.binaryContent) {
                o.cbc = msgPayload.binaryContent;
            }
            if (msg.messageContent instanceof MediaMessageContent) {
                o.mt = msg.messageContent.mediaType;
                o.mru = msg.messageContent.remotePath;
            }

            arr.push(o);

        });

        let obj = {
            ms: arr,
        }
        let str = JSON.stringify(obj);
        str = str.replace(/"uid":"([0-9]+)"/, "\"uid\":$1");

        payload.binaryContent = wfc.utf8_to_b64(str)
        return payload;
    }

    decode(payload) {
        super.decode(payload);

        this.title = payload.content;
        let str = wfc.b64_to_utf8(payload.binaryContent);
        str = str.replace(/"uid":([0-9]+)/g, "\"uid\":\"$1\"");
        let obj = JSON.parse(str);
        obj.ms.forEach(o => {
            let conv = new Conversation(o.type, o.target, o.line);
            let msg = new Message()
            msg.messageUid = Long.fromValue(o.uid);
            msg.conversation = conv;
            msg.from = o.from;
            msg.to = o.tos;
            msg.direction = o.direction;
            msg.status = o.status;
            msg.serverTime = o.serverTime;

            let payload = new MessagePayload();
            payload.type = o.ctype;
            payload.searchableContent = o.csc;
            payload.pushContent = o.cpc;
            payload.pushData = o.cpd;
            payload.content = o.cc;
            payload.mentionedType = o.cmt;
            payload.mentionedTargets = o.cmts;
            payload.extra = o.ce;

            payload.binaryContent = o.cbc;
            payload.mediaType = o.mt;
            payload.remoteMediaUrl = o.mru;

            msg.messageContent = Message.messageContentFromMessagePayload(payload, msg.from);
            this.messages.push(msg);
        });
    }
}
