/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */

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
    // 仅超级群有效，消息是否已完整服务器加载
    notLoaded = 0;
}
