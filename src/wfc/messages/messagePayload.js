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

    /**
     *
     * 由于Java long类型，在js里面，不能用number类型表示，故js里面采用js long对象表示
     * java long数据和js long对象序列成json格式的字符串时，格式并一样，为了处理跨平台需求，
     * 将序列化后的json格式字符串
     * java long "uid":12345678
     *
     * 当Java long类型的值，需要序列化为json字符串进行传输时，js long对象序列化出来的
      */
    static _patchToJavaLong(jsonStr, key){
        if(!jsonStr){
            return jsonStr;
        }

        let reg = new RegExp(`"${key}":"([0-9]+)"`, 'g')
        return  jsonStr.replace(reg, `\"${key}\":$1`);
    }

    static _reverseToJsLongString(jsonStr, key){
        if(!jsonStr){
            return jsonStr;
        }
        let reg = new RegExp(`"${key}":([0-9]+)`, 'g')
        return  jsonStr.replace(reg, `\"${key}\":\"$1\"`);
    }
}
