export default class PttEventType {
    //某人开始在频道中讲话
    // function (conversation, userId) {}
    static userStartTalking = 'userStartTalking'

    //某人结束在频道中讲话
    // function (conversation, userId) {}
    static userEndTalking = 'userEndTalking'

    //接收到用户自定义数据
    // function (conversation, userId, data) {}
    static receiveData = 'receiveData';

    //用户说话音量大小回调
    // function (conversation, userId, averageAmplitude) {}
    static userAmplitudeUpdate = 'userAmplitudeUpdate';

}
