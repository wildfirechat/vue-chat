/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */

// 运行在新的voip window
import VideoType from './videoType'

export default class CallSession {
    conversation;
    initiatorId;
    audioMuted = false
    videoMuted = false
    screenSharing = false
    audioOnly = false

    startTime
    startMsgUid

    // conference 相关
    defaultAudience = false;
    audience = false;
    conference = false;
    advance = false;
    record = false;
    host;
    title;
    desc;
    /**
     * 通话附加信息，会议的所有参与者都能看到
     */
    callExtra;
    /**
     * 本地附加信息，主要用于主窗口向音视频通话窗口传递额外信息
     */
    extra;

    /**
     * 默认成员的视频流类型
     */
    defaultVideoType = VideoType.BIG_STREAM;

    /**
     * 播放来电响铃
     */
    playIncomingRing () {
        // TODO
        //在界面初始化时播放来电铃声
    }

    /**
     * 停止响铃
     */
    stopIncomingRing () {
        // TODO
        //再接听/语音接听/结束媒体时停止播放来电铃声，可能有多次，需要避免出问题
    }

    /**
     * 多人音视频通话中，邀请新成员
     * @param {[string]} newParticipantIds
     * @param {boolean}  autoAnswer 是否自动接听，默认 false
     */
    inviteNewParticipants (newParticipantIds, targetClientId, autoAnswer) {
    }

    /**
     * 接听来电
     * @deprecated  参考{@link answer}
     */
    call () {
        this.answer(false, null);
    }

    /**
     * 接听电话
     * @param {boolean} audioOnly
     * @param {string} callExtra 通话附加信息
     */
    answer(audioOnly, callExtra) {
    }

    /**
     * 挂断
     */
    hangup () {
    }


    // 回落到语音
    downgrade2Voice () {
    }

    /**
     * 打开或关闭摄像头
     * @param enable
     * @deprecated 请使用{@link muteVideo}
     */
    setVideoEnabled (enable) {

    }

    /**
     * 打开或关闭摄像头
     * @param {boolean} mute true，关闭摄像头；false，打开摄像头
     */
    muteVideo(mute){

    }

    /**
     * 静音或取消静音
     * @param {boolean} enable
     * @deprecated 请使用{@link muteAudio}
     */
    setAudioEnabled(enable){

    }

    /**
     * 静音或取消静音
     * @param {boolean} mute true，静音；false，取消静音
     */
    muteAudio(mute){

    }

    /**
     * 仅当桌面是有效，web无效。
     * 获取可用用于共享的源，可以是screen或者某个具体的window
     * @param {[string]} types 媒体源类型，可选screen、window
     * @return {Promise<DesktopCapturerSource[]>}
     */
    getDesktopSources (types) {

    }

    /**
     * @param {{sourceId: source.id,
                minWidth: 1280,
                maxWidth: 1280,
                minHeight: 720,
                maxHeight: 720}} desktopShareOptions 仅当桌面时有效
     * 开始屏幕共享
     */
    async startScreenShare (desktopShareOptions) {

    }

    isScreenSharing () {

    }

    stopScreenShare () {

    }

    /**
     * 请在callState变为connecting 或 connected之后，调用
     * @deprecated
     * @param {string} userId
     * @return {Subscriber}
     */
    getPeerConnectionClient(userId){
        return this.getSubscriber(userId);
    }

    /**
     * 请在callState变为connecting 或 connected之后，调用
     * @param {string} userId
     * @param {boolean} screenSharing
     * @return {Subscriber}
     */
    getSubscriber(userId, screenSharing){
    }


    /**
     * 仅会议时有效
     * 请求参与者切换听众或互动者角色
     * @param {string} userId
     * @param {boolean} audience 切换为听众
     */
    requestChangeMode(userId, audience) {

    }

    /**
     * 仅会议时有效
     * 切换听众或互动者角色
     * @param {boolean} audience 是否为听众
     */
    switchAudience(audience) {

    }

    /**
     * 仅会议时有效
     * 会议踢人
     * @param {string} userId
     * @param {function ()} successCB
     * @param {function (errcode)} failCB
     */
    kickoffParticipant(userId, successCB, failCB) {
    }

    /**
     * 仅会议时有效
     * 离开会议
     * @param {boolean} destroyRoom 是否销毁会议室
     */
    leaveConference(destroyRoom) {
    }

    /**
     * 关闭音视频通话窗口
     */
    closeVoipWindow(){

    }

    /**
     * 仅会议时有效
     * 设置音频输入设备
     * @param {string} audioDeviceId 音频设备 id
     */
    setAudioInputDeviceId(audioDeviceId){

    }

    /**
     * 仅会议时有效
     * 设置音频输入设备
     * @param {string} videoDeviceId  视频设备 id
     */
    setVideoInputDeviceId(videoDeviceId){

    }

    /**
     * 切换摄像头，手机端有效
     * @return true，支持切换摄像头，正在切换；false，不支持切换摄像头
     */
    switchCamera(){

    }

    /**
     * 仅会议版有效
     * 设置视频最大码率
     * @param maxBitrateKbps
     */
    setVideoMaxBitrate(maxBitrateKbps){

    }

    /**
     * 仅会议版有效
     * 只支持缩小或者恢复原大小，不支持放大
     * 相对于原始视频大小按比例缩小分辨率，具体可以参考{@link https://developer.mozilla.org/en-US/docs/Web/API/RTCRtpEncodingParameters/scaleResolutionDownBy}
     * @param {number} scalingFactor
     */
    scaleVideoResolutionDownBy(scalingFactor){

    }

    /**
     * 旋转自己发布的视频角度
     * 请在callState变为connected之后，调用
     * @param {number} ang 旋转角度，可选值为 0，90，180，270
     */
    rotate(ang){

    }

    /**
     *  仅会议版有效
     * 设置参与者的 videoType
     * @param {string} userId 用户 id
     * @param {boolean} isScreenSharing 是否是屏幕共享
     * @param {VideoType} videoType 视频流类型
     */
    setParticipantVideoType(userId, isScreenSharing, videoType){

    }
}
