import MessageContentType from "../messages/messageContentType";
import wfc from "../client/wfc";
import MediaMessageContent from "../messages/mediaMessageContent";
import {stringValue} from "../util/longUtil";
import Message from "../messages/message";
import Conversation from "../model/conversation";
import Long from "long";
import {compare} from "../util/longUtil";
import MessagePayload from "../messages/messagePayload";
import {isElectron} from "../../platform";
import ArticlesMessageContent from "./articlesMessageContent";
import MessageContentMediaType from "./messageContentMediaType";

export default class CompositeMessageContent extends MediaMessageContent {
    title = '';
    messages = [];
    // web 端有效，仅仅是用来标识 mediaCompositeMessage 是否已加载
    loaded = false;

    constructor() {
        super(MessageContentType.Composite_Message, MessageContentMediaType.General, '')
    }

    setMessages(msgs) {
        this.messages = [];
        msgs.forEach(m => {
            if (m.messageContent instanceof ArticlesMessageContent) {
                let linkMessageContents = m.messageContent.toLinkMessageContent();
                linkMessageContents.forEach(lm => {
                    let msg = Object.assign(new Message(), m);
                    msg.messageContent = lm;
                    this.messages.push(msg);
                })
            } else {
                this.messages.push(m)
            }
        })
        this.messages = this.messages.sort((m1, m2) => {
            return compare(m1.messageUid, m2.messageUid);
        })
    }

    digest(message) {
        return '[聊天记录]' + this.title;
    }

    encode() {
        let payload = super.encode();
        payload.content = this.title;
        let arr = [];
        let binArr;
        let size = 0;
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
                serverTime: stringValue(msg.timestamp),
                ctype: msgPayload.type,
                csc: msgPayload.searchableContent,
                cpc: msgPayload.pushContent,
                cpd: msgPayload.pushData,
                cc: msgPayload.content,
                cmt: msgPayload.mentionedType,
                cmts: msgPayload.mentionedTargets,
                ce: msgPayload.extra,
            };
            if (msgPayload.searchableContent) {
                payload.searchableContent = payload.searchableContent + msgPayload.searchableContent + ' ';
            }

            if (msgPayload.binaryContent) {
                o.cbc = msgPayload.binaryContent;
            }
            if (msg.messageContent instanceof MediaMessageContent) {
                o.mt = msg.messageContent.mediaType;
                o.mru = msg.messageContent.remotePath;
            }

            if (!binArr) {
                size += JSON.stringify(o).length;
                if (size > 20480 && arr.length > 0) {
                    binArr = arr.map((value) => value);
                }
            }

            arr.push(o);

        });

        let obj;
        if (binArr && !this.file) {
            obj = {
                ms: arr,
            }
            let str = JSON.stringify(obj);
            str = str.replace(/"uid":"([0-9]+)"/, "\"uid\":$1");
            str = str.replace(/"serverTime":"([0-9]+)"/, "\"serverTime\":$1");

            let blob = new Blob([str]);
            let fileName = 'wcf-' + new Date().getTime() + '.data';
            this.file = new File([blob], fileName);
            if (isElectron()) {
                let fs = require('fs');
                let sep = require('path').sep;
                let cmsDir = wfc.getAppPath() + sep + 'cms' + sep;
                if(!fs.existsSync(cmsDir)){
                    fs.mkdirSync(cmsDir);
                }
                this.localPath = cmsDir + fileName;
                fs.writeFileSync(this.localPath, str);
                payload.localMediaPath = this.localPath;
                payload.mediaType = MessageContentType.File;
            }
            obj = {
                ms: binArr,
            }
        } else {
            if (binArr) {
                obj = {
                    ms: binArr,
                }
            } else {
                obj = {
                    ms: arr,
                }
            }
        }

        let str = JSON.stringify(obj);
        str = str.replace(/"uid":"([0-9]+)"/, "\"uid\":$1");
        str = str.replace(/"serverTime":"([0-9]+)"/, "\"serverTime\":$1");

        payload.binaryContent = wfc.utf8_to_b64(str)
        return payload;
    }

    decode(payload) {
        super.decode(payload);

        this.title = payload.content;
        let str;
        if (this.file) {
            // web
            let fileReader = new FileReader();
            fileReader.onload(ev => {
                this._decodeMessages(ev.target.result);
            });
            fileReader.readAsBinaryString(this.file);

        } else if (this.localPath) {
            // electron
            if (isElectron()) {
                const fs = require("fs");
                if (fs.existsSync(this.localPath)) {
                    const buffer = fs.readFileSync(this.localPath);
                    str = buffer.toString();
                    this._decodeMessages(str);
                } else {
                    console.log('media composite message not downloaded', this.remotePath);
                }
            }
        }

        if (!str) {
            str = wfc.b64_to_utf8(payload.binaryContent);
            this._decodeMessages(str);
        }
    }

    _decodeMessages(str) {
        if (this.loaded) {
            return;
        }
        this.messages = [];
        // FIXME node 环境，decodeURIComponent 方法，有时候会在最后添加上@字符，目前尚未找到原因，先规避
        str = str.substring(0, str.lastIndexOf('}') + 1);
        str = str.replace(/"uid":([0-9]+)/g, "\"uid\":\"$1\"");
        str = str.replace(/"serverTime":([0-9]+)/g, "\"serverTime\":\"$1\"");
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
            msg.timestamp = Long.fromValue(o.serverTime);

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
        console.log('cp ms', this.messages)
    }

}
