/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */

import wfc from '../../client/wfc'
import MessageContentType from '../messageContentType';

import NotificationMessageContent from "./notificationMessageContent";

export default class RichNotificationMessageContent extends NotificationMessageContent {

    // 富通知消息
    title;
    desc;
    remark;

    // @[@{@"key":@"登陆账户", @"value":@"野火IM", @"color":@"#173155"}, @{@"key":@"登陆地点", @"value":@"北京", @"color":@"#173155"}]
    datas;

    // 附加信息
    exName;
    exPortrait;
    exUrl;

    // 应用信息
    appId;

    constructor() {
        super(MessageContentType.Rich_Notification);
    }

    formatNotification() {
        return this.title;
    }

    encode() {
        let payload = super.encode();
        payload.pushContent = this.title;
        payload.content = this.desc;

        let obj = {
            remark: this.remark,
            exName: this.exName,
            exPortrait: this.exPortrait,
            exUrl: this.exUrl,
            appId: this.appId,
            datas: this.datas,
        }
        payload.binaryContent = wfc.utf8_to_b64(JSON.stringify(obj))

        return payload;
    }

    decode(payload) {
        super.decode(payload);
        this.title = payload.pushContent;
        this.desc = payload.content;
        let json = wfc.b64_to_utf8(payload.binaryContent)
        let obj = JSON.parse(json);
        this.remark = obj.remark;
        this.exName = obj.exName;
        this.exPortrait = obj.exPortrait;
        this.exUrl = obj.exUrl;
        this.appId = obj.appId;
        this.datas = obj.datas;
    }
}
