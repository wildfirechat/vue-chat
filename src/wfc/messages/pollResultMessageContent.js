import MessageContentType from "./messageContentType";
import MessageContent from './messageContent'
import wfc from "../client/wfc";

/**
 * 投票结果消息内容
 * 对应 Android 的 PollResultMessageContent
 * 当投票有更新时（如有人投票、投票结束），发送此消息通知群成员
 */
export default class PollResultMessageContent extends MessageContent {
    pollId;
    groupId;
    creatorId;
    title;
    totalVotes;
    voterCount;
    status;

    constructor() {
        super(MessageContentType.Poll_Result);
    }

    digest() {
        if (this.title && this.title.length > 0) {
            return "[投票结果] " + this.title;
        }
        return "[投票结果]";
    }

    encode() {
        let payload = super.encode();
        payload.searchableContent = this.title;

        let obj = {
            pollId: this.pollId,
            groupId: this.groupId,
            creatorId: this.creatorId,
            totalVotes: this.totalVotes,
            voterCount: this.voterCount,
            status: this.status
        };
        payload.binaryContent = wfc.utf8_to_b64(JSON.stringify(obj));
        return payload;
    }

    decode(payload) {
        super.decode(payload);
        this.title = payload.searchableContent;
        if (payload.binaryContent) {
            try {
                let str = wfc.b64_to_utf8(payload.binaryContent);
                let obj = JSON.parse(str);
                this.pollId = obj.pollId;
                this.groupId = obj.groupId;
                this.creatorId = obj.creatorId;
                this.totalVotes = obj.totalVotes;
                this.title = obj.title;
                this.voterCount = obj.voterCount;
                this.status = obj.status;
            } catch (e) {
                console.error("Decode poll result message error", e);
            }
        }
    }
}
