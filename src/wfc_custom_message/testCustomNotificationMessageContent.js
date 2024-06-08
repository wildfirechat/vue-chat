/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */

import CustomMessageContentType from "./customMessageContentType";
import NotificationMessageContent from "../wfc/messages/notification/notificationMessageContent";

/**
 * 对应的 UI 请参考{@link NotificationMessageContentView}，或 {@link RichNotificationMessageContentView}
 */
export default class TestCustomNotificationMessageContent extends NotificationMessageContent {
    tip = '';

    constructor(tip) {
        super(CustomMessageContentType.MESSAGE_CONTENT_TYPE_CUSTOM_MESSAGE_TEST_NOTIFICATION);
        this.tip = tip;
    }

    // 会话界面显示通知时，将显示本函数的返回值
    formatNotification() {
        return this.tip;
    }

    digest() {
        return this.tip;
    }

    encode() {
        let payload = super.encode();
        payload.content = this.tip;
        return payload;
    };

    decode(payload) {
        super.decode(payload);
        this.tip = payload.content;
    }
}
