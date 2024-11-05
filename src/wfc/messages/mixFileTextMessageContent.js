// 文件、图片、视频、文字混合消息
// 列表排列，媒体在前，文字在最后

import MessageContent from "./messageContent";
import MessageContentType from "./messageContentType";
import wfc from "../client/wfc";

export default class MixFileTextMessageContent extends MessageContent {
    /**
     * 媒体文件列表
     * @type {FileEntry[]}
     */
    files = []
    text = ''

    /**
     *
     * @param files :FileEntry[]
     * @param text :string
     */
    constructor(files, text = '') {
        super(MessageContentType.MESSAGE_CONTENT_TYPE_MIX_FILE_TEXT);
        if (files && files.length > 10) {
            console.error('文件混排消息，一次最多支持 10 个文件')
            files = files.slice(0, 9);
        }
        this.files = files;
        this.text = text;
    }

    digest() {
        return '[文件混排组合] ' + this.text;
    }

    encode() {
        let payload = super.encode();
        payload.searchableContent = this.text;
        // 发送时，不需要带上 localPath，localPath 只是本地使用
        this.files.forEach(m => m.localPath = '')
        let obj = {
            "mu": this.files
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
            this.files = JSON.parse(muStr).mu
        }
    }
}

class FileEntry {
    url = ''
    localPath = ''
    name = ''
    size = 0
    iv = false // 是否是图片或视频
}
