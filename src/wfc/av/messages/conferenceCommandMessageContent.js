import MessageContent from "../../messages/messageContent";
import MessageContentType from "../../messages/messageContentType";
import wfc from "../../client/wfc";

export default class ConferenceCommandMessageContent extends MessageContent {
    conferenceId;
    commandType;
    targetUserId;
    boolValue;

    constructor(conferenceId, commandType, targetUserId, boolValue) {
        super(MessageContentType.CONFERENCE_CONTENT_TYPE_COMMAND);
        this.conferenceId = conferenceId;
        this.commandType = commandType;
        this.targetUserId = targetUserId;
        this.boolValue = boolValue;
    }


    encode() {
        let payload = super.encode();
        payload.content = this.conferenceId;
        let obj = {
            t: this.commandType,
            u: this.targetUserId,
        };
        if (this.boolValue) {
            obj['b'] = this.boolValue;
        }

        payload.binaryContent = wfc.utf8_to_b64(JSON.stringify(obj));
        return payload;
    }

    decode(payload) {
        super.decode(payload);
        if (payload.binaryContent) {
            let json = wfc.b64_to_utf8(payload.binaryContent);
            let obj = JSON.parse(json);
            this.commandType = obj.t;
            this.boolValue = !!obj.b;
            this.targetUserId = obj.u;

        }
        this.conferenceId = payload.content;
    }

    static ConferenceCommandType = Object.freeze({
        //全体静音，只有主持人可以操作，结果写入conference profile中。带有参数是否允许成员自主解除静音。
        MUTE_ALL: 0,
        //取消全体静音，只有主持人可以操作，结果写入conference profile中。带有参数是否邀请成员解除静音。
        CANCEL_MUTE_ALL: 1,

        //要求某个用户更改静音状态，只有主持人可以操作。带有参数是否静音/解除静音。
        REQUEST_MUTE: 2,
        //拒绝UNMUTE要求。（如果同意不需要通知对方同意)
        REJECT_UNMUTE_REQUEST: 3,

        //普通用户申请解除静音，带有参数是请求，还是取消请求。
        APPLY_UNMUTE: 4,
        //管理员批准解除静音申请，带有参数是同意，还是拒绝申请。
        APPROVE_UNMUTE: 5,
        //管理员批准全部解除静音申请，带有参数是同意，还是拒绝申请。
        APPROVE_ALL_UNMUTE: 6,

        //举手，带有参数是举手还是放下举手
        HANDUP: 7,
        //主持人放下成员的举手
        PUT_HAND_DOWN: 8,
        //主持人放下全体成员的举手
        PUT_ALL_HAND_DOWN: 9,

        //录制，有参数是录制还是取消录制
        RECORDING: 10,

        // 设置焦点用户
        FOCUS: 11,
        // 取消设置焦点用户
        CANCEL_FOCUS: 12,
    })
}
