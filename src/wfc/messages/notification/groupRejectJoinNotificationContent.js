/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */

import GroupNotificationContent from "./groupNotification";
import wfc from "../../client/wfc";
import MessageContentType from "../messageContentType";

export default class GroupRejectJoinNotificationContent extends GroupNotificationContent {
    operator;

    rejectUserMap;

    constructor(operator) {
        super(MessageContentType.RejectJoinGroup);
        this.operator = operator;
        this.rejectUserMap = new Map();
    }

    formatNotification(message) {

        let rejectMembersStr = "";
        let userInfos = wfc.getUserInfos(this.rejectUserMap.keys().toArray(), this.groupId);
        userInfos.forEach(userInfo => {
            rejectMembersStr += userInfo.displayName + " ";
        });

        return rejectMembersStr + " 拒绝加入群组";
    }

    encode() {
        let payload = super.encode();
        let obj = {
            g: this.groupId,
            o: this.operator,
            mi: this.rejectUserMap
        };
        payload.binaryContent = wfc.utf8_to_b64(JSON.stringify(obj));
        return payload;
    }

    decode(payload) {
        super.decode(payload);
        let obj = JSON.parse(wfc.b64_to_utf8(payload.binaryContent));
        this.groupId = obj.g;
        this.operator = obj.o;
        this.rejectUserMap = new Map(JSON.parse(obj.mi));
    }
}
