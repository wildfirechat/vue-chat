/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */

/**
 *
 message in json format
 {
        "conversation":{
            "conversationType": 0,
            "target": "UZUWUWuu",
            "line": 0,
        }
        "from": "UZUWUWuu",
        "content": {
            "type": 1,
            "searchableContent": "1234",
            "pushContent": "",
            "content": "",
            "binaryContent": "",
            "localContent": "",
            "mediaType": 0,
            "remoteMediaUrl": "",
            "localMediaPath": "",
            "mentionedType": 0,
            "mentionedTargets": [ ]
        },
        "messageId": 52,
        "direction": 1,
        "status": 5,
        "messageUid": 75735276990792720,
        "timestamp": 1550849394256,
        "to": ""
    }
 */
import Conversation from '../model/conversation'
import NotificationMessageContent from './notification/notificationMessageContent'
import wfc from '../client/wfc'
import MessageConfig from '../client/messageConfig';
import UnknownMessageContent from './unknownMessageContent';
import PersistFlag from './persistFlag';
import MessageStatus from './messageStatus';
import ConversationType from '../model/conversationType';
import {encode} from 'base64-arraybuffer';
import Config from '../../config.js';

import Long from 'long'
import UnsupportMessageContent from "../messages/unsupportMessageConten";
import RecallMessageNotification from "../messages/notification/recallMessageNotification";

export default class Message {
    conversation = {};
    from = '';
    content = {}; // 实际是payload
    messageContent = {};
    messageId = 0;
    direction = 0;
    status = 0;
    messageUid = 0;
    timestamp = 0;
    to = '';
    localExtra = '';

    constructor(conversation, messageContent) {
        this.conversation = conversation;
        this.messageContent = messageContent;
    }

    static fromProtoMessage(obj) {
        // osx or windows
        if (Config.getWFCPlatform() === 3 || Config.getWFCPlatform() === 4) {
            let msg = Object.assign(new Message(), obj);
            // big integer to number
            msg.messageId = Number(msg.messageId);
            if (msg.messageId === -1) {
                return null;
            }

            msg.messageUid = Long.fromValue(msg.messageUid);
            msg.timestamp = Long.fromValue(msg.timestamp).toNumber();
            msg.localExtra = obj.localExtra;
            msg.conversation = new Conversation(obj.conversation.conversationType, obj.conversation.target, obj.conversation.line);
            let contentClazz = MessageConfig.getMessageContentClazz(msg.content.type);
            if (contentClazz) {
                let content = new contentClazz();
                try {
                    content.decode(msg.content);
                    if (content instanceof NotificationMessageContent) {
                        content.fromSelf = msg.from === wfc.getUserId();
                    }
                } catch (error) {
                    console.log('decode message payload failed, fallback to unkownMessage', msg.content, error);
                    let flag = MessageConfig.getMessageContentPersitFlag(msg.content.type);
                    if (PersistFlag.Persist === flag || PersistFlag.Persist_And_Count === flag) {
                        content = new UnknownMessageContent(msg.content);
                    } else {
                        return null;
                    }
                }
                msg.messageContent = content;

            } else {
                console.error('message content not register', obj);
            }

            return msg;

        } else {
            let msg = new Message();
            msg.from = obj.fromUser;
            msg.content = obj.content;
            msg.messageUid = obj.messageId;

            msg.localExtra = obj.localExtra;
            msg.timestamp = obj.serverTimestamp;
            let contentClazz = MessageConfig.getMessageContentClazz(obj.content.type);
            if (contentClazz) {
                let content = new contentClazz();
                try {
                    if (obj.content.data && obj.content.data.length > 0) {
                        obj.content.binaryContent = encode(obj.content.data);
                    }
                    content.decode(obj.content);
                    content.extra = obj.content.extra;
                    if (content instanceof NotificationMessageContent) {
                        content.fromSelf = msg.from === wfc.getUserId();
                    }
                } catch (error) {
                    console.log('decode message payload failed, fallback to unkownMessage', obj.content, error);
                    let flag = MessageConfig.getMessageContentPersitFlag(obj.content.type);
                    if (PersistFlag.Persist === flag || PersistFlag.Persist_And_Count === flag) {
                        content = new UnknownMessageContent(obj.content);
                    } else {
                        return null;
                    }
                }
                msg.messageContent = content;

            } else {
                console.error('message content not register', obj);
            }


            if (msg.from === wfc.getUserId()) {
                msg.conversation = new Conversation(obj.conversation.type, obj.conversation.target, obj.conversation.line);
                // out
                msg.direction = 0;
                msg.status = MessageStatus.Sent;
            } else {
                if (obj.conversation.type === ConversationType.Single) {
                    msg.conversation = new Conversation(obj.conversation.type, obj.fromUser, obj.conversation.line);
                } else {
                    msg.conversation = new Conversation(obj.conversation.type, obj.conversation.target, obj.conversation.line);
                }

                // in
                msg.direction = 1;
                msg.status = MessageStatus.Unread;

                if (msg.content.mentionedType === 2) {
                    msg.status = MessageStatus.AllMentioned;
                } else if (msg.content.mentionedType === 1) {
                    for (const target of msg.content.mentionedTarget) {
                        if (target === wfc.getUserId()) {
                            msg.status = MessageStatus.Mentioned;
                            break;
                        }
                    }
                }
            }
            return msg;
        }

    }

    static messageContentFromMessagePayload(payload, from) {
        let contentClazz = MessageConfig.getMessageContentClazz(payload.type);
        contentClazz = contentClazz ? contentClazz : UnsupportMessageContent;
        let content = new contentClazz();
        content.decode(payload);

        let selfUid = wfc.getUserId();
        if (content instanceof NotificationMessageContent) {
            if (content instanceof RecallMessageNotification) {
                if (content.operatorId === selfUid) {
                    content.fromSelf = true;
                }
            } else if (from === selfUid) {
                content.fromSelf = true;
            }
        }

        return content;
    }

    static toMessagePayload(message) {

        return message.messageContent.encode();
    }
}
