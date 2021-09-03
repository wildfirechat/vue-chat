/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */

// 运行在新的voip window
export default class CallSession {
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
    extra;

    /**
     * 播放来电响铃
     */
    playIncomingRing() {
        // TODO
        //在界面初始化时播放来电铃声
    }

    /**
     * 停止响铃
     */
    stopIncomingRing() {
        // TODO
        //再接听/语音接听/结束媒体时停止播放来电铃声，可能有多次，需要避免出问题
    }

    /**
     * 多人音视频通话中，邀请新成员
     * @param newParticipantIds
     */
    inviteNewParticipants(newParticipantIds) {
    }

    /**
     * 接听来电
     */
    call() {
    }

    /**
     * 挂断
     */
    hangup() {
    }


    // 回落到语音
    downgrade2Voice() {
    }

    /**
     * 打开或关闭摄像头
     * @param enable
     * @deprecated 请使用{@link muteVideo}
     */
    setVideoEnabled(enable) {

    }

    /**
     * 打开或关闭摄像头
     * @param {boolean} mute true，关闭摄像头；false，打开摄像头
     */
    muteVideo(mute) {

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
    muteAudio(mute) {

    }

    /**
     * 仅当桌面是有效，web无效。
     * 获取可用用于共享的源，可以是screen或者某个具体的window
     * @param {[string]} types 媒体源类型，可选screen、window
     * @return {Promise<DesktopCapturerSource[]>}
     */
    getDesktopSources(types) {

    }

    /**
     * @param {{sourceId: source.id,
                minWidth: 1280,
                maxWidth: 1280,
                minHeight: 720,
                maxHeight: 720}} desktopShareOptions 仅当桌面时有效
     * 开始屏幕共享
     */
    async startScreenShare(desktopShareOptions) {

    }

    isScreenSharing() {

    }

    stopScreenShare() {
    }

    /**
     * 请在callState变为connecting 或 connected之后，调用
     * @param {string} userId
     * @return {PeerConnectionClient}
     */
    getPeerConnectionClient(userId) {

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
    closeVoipWindow() {

    }
}
