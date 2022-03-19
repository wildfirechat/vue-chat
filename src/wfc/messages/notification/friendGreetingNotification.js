/*
 * Copyright (c) 2022 WildFireChat. All rights reserved.
 */

import NotificationMessageContent from "./notificationMessageContent";
import MessageContentType from "../messageContentType";

export default class FriendGreetingNotification extends NotificationMessageContent {
    constructor() {
        super(MessageContentType.Friend_Greeting);
    }

    formatNotification(message) {
        return "以上是打招呼的内容";
    }
}
