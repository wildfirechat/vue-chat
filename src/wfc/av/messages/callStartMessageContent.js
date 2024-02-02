/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */

import MessageContent from '../../messages/messageContent';
import MessageContentType from '../../messages/messageContentType';
import wfc from "../../client/wfc"

export default class CallStartMessageContent extends MessageContent {
    callId;
    targetIds = [];
    connectTime;
    endTime;
    /**
     * 0, UnKnown,
     * 1, Busy,
     * 2, SignalError,
     * 3, Hangup,
     * 4, MediaError,
     * 5, RemoteHangup,
     * 6, OpenCameraFailure,
     * 7, Timeout,
     * 8, AcceptByOtherClient
     */
    status = 0;
    audioOnly;
    pin;
    //  0，未知；1，多人版音视频；2，高级版音视频
    sdkType = 0;

    constructor(mentionedType = 0, mentionedTargets = []) {
        super(MessageContentType.VOIP_CONTENT_TYPE_START, mentionedType, mentionedTargets);
    }

    digest() {
        if (this.audioOnly) {
            return '[语音通话]';
        } else {
            return '[视频通话]';
        }
    }

    encode() {
        let payload = super.encode();
        payload.content = this.callId;
        payload.pushContent = '音视频通话邀请';

        let obj = {
            c: this.connectTime,
            e: this.endTime,
            s: this.status,
            a: this.audioOnly ? 1 : 0,
            ts: this.targetIds,
            t: this.targetIds[0],
            p: this.pin,
            ty: this.sdkType
        };
        payload.binaryContent = wfc.utf8_to_b64(JSON.stringify(obj));

        let pushData = {
            callId: this.callId,
            audioOnly: this.audioOnly,
            participants: this.targetIds,
        }
        payload.pushData = JSON.stringify(pushData);

        return payload;
    }

    decode(payload) {
        super.decode(payload);
        this.callId = payload.content;
        let json = wfc.b64_to_utf8(payload.binaryContent);
        let obj = JSON.parse(json);

        this.connectTime = obj.c;
        this.endTime = obj.e;
        this.status = obj.s;
        this.audioOnly = (obj.a === 1);
        this.targetIds = obj.ts;
        if (!this.targetIds) {
            this.targetIds = [obj.t];
        }
        this.pin = obj.p;
        this.sdkType = obj.ty
    }
}
