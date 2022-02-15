import MessageContent from "./messageContent";
import MessageContentType from "./messageContentType";
import wfc from "../client/wfc";

export default class LinkMessageContent extends MessageContent {
    title;
    contentDigest;
    url;
    thumbnail;


    constructor() {
        super(MessageContentType.Link);
    }

    encode() {
        let payload = super.encode();
        let obj = {
            d: this.contentDigest,
            u: this.url,
            t: this.thumbnail
        }

        payload.searchableContent = this.title;
        payload.binaryContent = wfc.utf8_to_b64(JSON.stringify(obj));

        return payload;
    }

    decode(payload) {
        super.decode(payload);
        this.title = payload.searchableContent;
        let obj = JSON.parse(wfc.b64_to_utf8(payload.binaryContent));
        this.contentDigest = obj.d;
        this.url = obj.u;
        this.thumbnail = obj.t;
    }
}
