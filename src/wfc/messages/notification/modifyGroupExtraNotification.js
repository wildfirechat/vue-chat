/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */

import wfc from '../../client/wfc'
import MessageContentType from '../messageContentType';

import GroupNotificationContent from './groupNotification';

export default class ModifyGroupExtraNotification extends GroupNotificationContent {
    operator = '';
    groupExtra = '';

    constructor(creator, groupExtra) {
        super(MessageContentType.ModifyGroupExtra_Notification);
        this.operator = creator;
        this.groupExtra = groupExtra;
    }

    formatNotification() {
        let notificationStr = '';
        if (this.fromSelf) {
            notificationStr += '你';
        } else {
            let userInfo = wfc.getUserInfo(this.operator, false, this.groupId)
            if (userInfo.friendAlias) {
                notificationStr += userInfo.friendAlias;
            } else if (userInfo.displayName) {
                notificationStr += userInfo.displayName;
            } else {
                notificationStr += this.operator;
            }
        }
        notificationStr += '修改';
        notificationStr += '群附加信息为';
        notificationStr += this.groupExtra;

        return notificationStr;
    }

    encode() {
        let payload = super.encode();
        let obj = {
            g: this.groupId,
            n: this.groupExtra,
            o: this.operator,
        };
        payload.binaryContent = wfc.utf8_to_b64(JSON.stringify(obj));
        return payload;
    }

    decode(payload) {
        super.decode(payload);
        let json = wfc.b64_to_utf8(payload.binaryContent)
        let obj = JSON.parse(json);
        this.groupId = obj.g;
        this.operator = obj.o;
        this.groupExtra = obj.n;
    }
}
