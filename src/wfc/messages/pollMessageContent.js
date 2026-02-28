import MessageContentType from "./messageContentType";
import MessageContent from './messageContent'
import wfc from "../client/wfc";

/**
 * 投票消息内容
 * 对应 Android 的 PollMessageContent
 */
export default class PollMessageContent extends MessageContent {
    pollId = '';
    groupId = '';
    creatorId = '';
    title = '';
    desc = '';
    visibility = 1;  // 1=仅群内, 2=公开
    pollType = 1;        // 1=单选, 2=多选
    anonymous = 0;   // 0=实名, 1=匿名
    status = 0;      // 0=进行中, 1=已结束
    endTime = 0;
    totalVotes = 0;

    constructor() {
        super(MessageContentType.Poll);
    }

    digest() {
        if (this.title && this.title.length > 0) {
            return "[投票] " + this.title;
        }
        return "[投票]";
    }

    encode() {
        let payload = super.encode();
        payload.searchableContent = this.title;

        let obj = {
            pollId: this.pollId,
            groupId: this.groupId,
            creatorId: this.creatorId,
            title: this.title,
            desc: this.desc,
            visibility: this.visibility,
            type: this.pollType,
            anonymous: this.anonymous,
            status: this.status,
            endTime: this.endTime,
            totalVotes: this.totalVotes
        };
        payload.binaryContent = wfc.utf8_to_b64(JSON.stringify(obj));
        return payload;
    }

    decode(payload) {
        super.decode(payload);
        // this.title = payload.searchableContent;
        if (payload.binaryContent) {
            try {
                let str = wfc.b64_to_utf8(payload.binaryContent);
                let obj = JSON.parse(str);
                this.pollId = obj.pollId;
                this.groupId = obj.groupId;
                this.creatorId = obj.creatorId;
                this.title = obj.title;
                this.desc = obj.desc;
                this.visibility = obj.visibility;
                this.pollType = obj.type;
                this.anonymous = obj.anonymous;
                this.status = obj.status;
                this.endTime = obj.endTime;
                this.totalVotes = obj.totalVotes;
            } catch (e) {
                console.error("Decode poll message error", e);
            }
        }
    }
}
