import MessageContent from "../../messages/messageContent";
import MessageContentType from "../../messages/messageContentType";
import wfc from "../../client/wfc";

export default class ConferenceInviteMessageContent extends MessageContent {
    callId;
    host;
    title;
    desc;

    startTime;
    audioOnly;
    audience;
    // 会议PIN码，加入会议时使用
    pin;
    // 会议密码，查询会议时使用
    password;
    advanced;
    callExtra;

    constructor(callId, host, title, desc, startTime, audioOnly, audience, advance, pin, password) {
        super(MessageContentType.CONFERENCE_CONTENT_TYPE_INVITE);
        this.callId = callId;
        this.host = host;
        this.title = title;
        this.desc = desc;
        this.startTime = startTime;
        this.audioOnly = audioOnly;
        this.audience = audience;
        this.advanced = advance;
        this.pin = pin;
        this.password = password;
    }

    digest(message) {
        let str = '[会议邀请]'
        return str;
    }

    encode() {
        let payload = super.encode();
        payload.content = this.callId;
        payload.pushContent = '会议邀请';
        let obj = {
            h: this.host,
            s: this.startTime,
            t: this.title,
            d: this.desc,
            audience: this.audience ? 1 : 0,
            advanced: this.advanced ? 1 : 0,
            a: this.audioOnly ? 1 : 0,
            p: this.pin,
            pwd: this.password,
            ce: this.callExtra
        };
        payload.binaryContent = wfc.utf8_to_b64(JSON.stringify(obj));
        return payload;
    }

    decode(payload) {
        super.decode(payload);
        if (payload.binaryContent) {
            let json = wfc.b64_to_utf8(payload.binaryContent);
            let obj = JSON.parse(json);
            this.host = obj.h;
            this.startTime = obj.s;
            this.title = obj.t;
            this.desc = obj.d;
            this.audience = obj.audience > 0;
            this.advanced = obj.advanced > 0;
            this.audioOnly = obj.a > 0;
            this.pin = obj.p;
            this.password = obj.pwd;
            this.callExtra = obj.ce;
        }
        this.callId = payload.content;
    }
}
