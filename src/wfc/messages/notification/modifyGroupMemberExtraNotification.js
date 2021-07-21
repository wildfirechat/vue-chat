/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */

import wfc from '../../client/wfc'
import MessageContentType from '../messageContentType';

import GroupNotificationContent from './groupNotification';

export default class ModifyGroupMemberExtraNotification extends GroupNotificationContent {
    operator = '';
    groupMemberExtra = '';
    memberId = '';

    constructor(creator, groupMemberExtra) {
        super(MessageContentType.ModifyGroupMemberExtra_Notification);
        this.operator = creator;
        this.groupMemberExtra = groupMemberExtra;
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
        if (this.memberId) {
            let userInfo = wfc.getUserInfo(this.memberId, false);
            if (userInfo.friendAlias) {
                notificationStr += userInfo.friendAlias;
            } else if (userInfo.displayName) {
                notificationStr += userInfo.displayName;
            } else {
                notificationStr += this.memberId;
            }
            notificationStr += '的';
        }
        notificationStr += '群成员信息为';
        notificationStr += this.groupMemberExtra;

        return notificationStr;
    }

    encode() {
        let payload = super.encode();
        let obj = {
            g: this.groupId,
            n: this.groupMemberExtra,
            o: this.operator,
            m: this.memberId,
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
        this.groupMemberExtra = obj.n;
        this.memberId = obj.m;
    }
}
