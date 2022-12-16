import SoundMessageContent from "../../../messages/soundMessageContent";

export default class PttSoundMessageContent extends SoundMessageContent {

    constructor(file, duration) {
        super(file, null, duration);
        this.type = 23;
    }

    digest(message) {
        return '[对讲语音]'
    }

    encode() {
        let payload = super.encode();
        payload.searchableContent = '[对讲语音]';
        return payload;
    }

    decode(payload) {
        super.decode(payload);
    }
}
