import PttSoundMessageContent from "./messages/pttSoundMessageContent";

export default class TalkingCallback {

    // 对讲优先级，默认优先级都是0，数字越高，优先级越高
    talkingPriority(conversation) {
        console.log('talkingPriority', conversation)
        return 0;
    }

    //可以开始讲话了
    onStartTalking(conversation) {
        console.log('onStartTalking', conversation)
    }

    //reason包括超时，被禁言，被强制抢麦等
    onTalkingEnd(conversation, reason) {
        console.log('onTalkingEnd', conversation, reason)
    }

    //errorCode包括单工模式下没有抢到麦，全工模式下超过最大发言人数，被禁言。
    onRequestFail(conversation, errorCode) {
        console.log('onRequestFail', conversation, errorCode);
    }

    // 说话音量通知，每400秒通知一次
    // 暂不支持
    onAmplitudeUpdate(averageAmplitude) {
        console.log('onAmplitudeUpdate', averageAmplitude);
    }

    /**
     * 默认发送的是 PTTSoundMessageContent，正常不用修改
     * @param conversation
     * @param {File | string} fileOrLocalPath File类型，或者dataUri或者本地路径，本地路径是必须是绝对路径
     * @param {number} duration
     */
    onCreateSoundMessageContent(conversation, fileOrLocalPath, duration) {
        console.log('onCreateSoundMessageContent', fileOrLocalPath, duration);
        return new PttSoundMessageContent(fileOrLocalPath, duration);
    }
}
