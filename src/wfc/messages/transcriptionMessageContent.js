/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */

import MessageContent from './messageContent'
import MessageContentType from './messageContentType';

export default class TranscriptionMessageContent extends MessageContent {
    transcriptionId;
    meetingId;
    userId;
    timestamp;
    duration;
    content;

    constructor(transcriptionId = 0, meetingId = '', userId = '', timestamp = 0, duration = 0, content = '') {
        super(MessageContentType.Transcription);
        this.transcriptionId = transcriptionId;
        this.meetingId = meetingId;
        this.userId = userId;
        this.timestamp = timestamp;
        this.duration = duration;
        this.content = content;
    }

    digest() {
        return this.content;
    }

    encode() {
        let payload = super.encode();
        let obj = {
            id: this.transcriptionId,
            meetingId: this.meetingId,
            userId: this.userId,
            timestamp: this.timestamp,
            duration: this.duration,
            content: this.content
        };
        payload.content = JSON.stringify(obj);
        return payload;
    }

    decode(payload) {
        super.decode(payload);
        let obj = JSON.parse(payload.content);
        this.transcriptionId = obj.id;
        this.meetingId = obj.meetingId;
        this.userId = obj.userId;
        this.timestamp = obj.timestamp;
        this.duration = obj.duration;
        this.content = obj.content;
    }
}
