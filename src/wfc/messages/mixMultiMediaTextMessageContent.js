// 图片、视频、文字混合消息

import MessageContent from "./messageContent";
import MessageContentType from "./messageContentType";
import wfc from "../client/wfc";

export default class MixMultiMediaTextMessageContent extends MessageContent {
    /**
     * 图片、视频 url 列表
     * @type {MultiMediaEntry[]}
     */
    multiMedias = []
    text = ''

    /**
     *
     * @param multiMedias :MultiMediaEntry[]
     * @param text :string
     */
    constructor(multiMedias, text = '') {
        super(MessageContentType.MESSAGE_CONTENT_TYPE_MIX_MULTI_MEDIA_TEXT);
        if (multiMedias && multiMedias.length > 10) {
            console.error('图文混排消息，一次最多支持 10 张图片')
            multiMedias = multiMedias.slice(0, 9);
        }
        this.multiMedias = multiMedias;
        this.text = text;
    }

    digest() {
        return '[图文混排] ' + this.text;
    }

    encode() {
        let payload = super.encode();
        payload.searchableContent = this.text;
        let obj = {
            "ms": this.multiMedias
        }
        let str = JSON.stringify(obj);
        payload.binaryContent = wfc.utf8_to_b64(str);
        return payload;
    }

    decode(payload) {
        super.decode(payload);
        this.text = payload.searchableContent;
        if (payload.binaryContent && payload.binaryContent.length > 0) {
            let muStr = wfc.b64_to_utf8(payload.binaryContent)
            this.multiMedias = JSON.parse(muStr).ms
        }
    }
}

class MultiMediaEntry {
    url = ''
    type = 'image' // video
    // base64 encoded, 不包含头部:data:image/png;base64,
    thumbnail = '' // thumbnail
    w = 0
    h = 0
}
