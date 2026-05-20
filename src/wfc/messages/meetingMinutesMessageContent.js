/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */

import MessageContent from './messageContent'
import MessageContentType from './messageContentType';
import wfc from '../client/wfc'

export default class MeetingMinutesMessageContent extends MessageContent {
    text;
    title;
    meetingId;

    constructor(text, title = '', meetingId = '') {
        super(MessageContentType.Meeting_Minutes);
        this.text = text;
        this.title = title;
        this.meetingId = meetingId;
    }

    digest() {
        if (this.title && this.title.length > 0) {
            return this.title;
        }
        return this.text;
    }

    encode() {
        let payload = super.encode();
        payload.searchableContent = this.text;
        payload.content = this.title;
        let obj = {
            meetingId: this.meetingId
        };
        payload.binaryContent = wfc.utf8_to_b64(JSON.stringify(obj));
        return payload;
    }

    decode(payload) {
        super.decode(payload);
        this.text = payload.searchableContent;
        this.title = payload.content;
        if (payload.binaryContent && payload.binaryContent.length > 0) {
            let json = wfc.b64_to_utf8(payload.binaryContent);
            let obj = JSON.parse(json);
            this.meetingId = obj.meetingId;
        }
    }
}
