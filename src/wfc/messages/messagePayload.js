/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */

import MessageConfig from "@/wfc/client/messageConfig";
import UnsupportMessageContent from "@/wfc/messages/unsupportMessageConten";
import NotificationMessageContent from "@/wfc/messages/notification/notificationMessageContent";
import RecallMessageNotification from "@/wfc/messages/notification/recallMessageNotification";
import wfc from "@/wfc/client/wfc";

/**
 *
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
 */
export default class MessagePayload {
    type;
    searchableContent;
    pushContent;
    pushData;
    content;
    binaryContent; // base64 string, 图片时，不包含头部信息:data:image/png;base64,
    localContent;
    mediaType;
    remoteMediaUrl;
    localMediaPath;
    mentionedType = 0;
    mentionedTargets = [];
    extra;

    toMessageContent(from) {
        let contentClazz = MessageConfig.getMessageContentClazz(this.type);
        contentClazz = contentClazz ? contentClazz : UnsupportMessageContent;
        let content = new contentClazz();
        content.decode(this);

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
}
