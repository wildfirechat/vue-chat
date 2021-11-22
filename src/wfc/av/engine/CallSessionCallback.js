/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */

// TODO 后续移除所有userInfo相关参数，采用ipc调用获取
export default class CallSessionCallback {

    /**
     * session 初始化回调
     * @param {CallSession} session 会话信息
     * @param {UserInfo} selfUserInfo 自己的用户信息
     * @param {UserInfo} initiatorUserInfo 发起者用户信息
     * @param {[UserInfo]} participantUserInfos 参与者用户信息，不包含自己
     * @param {[UserInfo]} groupMemberUserInfos 多人音视频通话时有效。 发起音视频通话所在群的群成员信息。
     */
    onInitial(session, selfUserInfo, initiatorUserInfo, participantUserInfos, groupMemberUserInfos) {

    }

    didCallEndWithReason(reason) {

    }

    /**
     * 可用来实现响铃相关
     * 1. outgoing -> connecting: 开始 -> 结束播放呼出铃声
     * 2. incoming -> connecting: 开始 -> 结束播放呼入铃声
     * 通话状态变化时调用
     * @param {CallState} state
     */
    didChangeState(state) {

    }

    didParticipantJoined(userId, userInfo) {

    }

    didParticipantConnected(userId) {

    }

    didParticipantLeft(userId, callEndReason) {

    }

    didChangeMode(audioOnly) {

    }

    didCreateLocalVideoTrack(stream) {

    }

    /**
     * 创建本地音视频流失败，可能原因可能是没有摄像头、或者没有麦克风
     */
    didCreateLocalVideoTrackError(){

    }
    didError(error) {

    }

    didGetStats(reports) {

    }

    didReceiveRemoteVideoTrack(userId, stream) {

    }

    didRemoveRemoteVideoTrack(userId) {

    }

    /**
     * 音量通知
     * @param {string} userId
     * @param {number} volume 0 -1
     */
    didReportAudioVolume(userId, volume) {

    }

    /**
     * 多人版生效，高级版调用的是 {@link didMuteStateChanged}
     * @param {string} userId
     * @param {boolean} muted
     */
    didVideoMuted(userId, muted) {
    }

    /**
     * 高级版生效，多人版调用的是 {@link didVideoMuted}
     * @param {[string]} participants
     */
    didMuteStateChanged(participants) {
    }

    /**
     * 当前用户发送媒体丢包回调
     * @param media 媒体类型，audio 或 video
     * @param lostPacket 丢包数
     */
    didMediaLostPacket(media, lostPacket) {

    }

    /**
     * 接收用户媒体丢包回调
     * @param userId 用户id
     * @param media 媒体类型，audio 或 video
     * @param lostPacket 丢包数
     * @param uplink 方向，true是对方丢的，false是己方丢的
     */
    didUserMediaLostPacket(userId, media, lostPacket, uplink) {
    }

    didChangeInitiator(initiator) {

    }

    /**
     * 会议时有效
     * 听众或互动者角色变更回调
     * @param {string} userId
     * @param {boolean} audience
     */
    didChangeType(userId, audience) {

    }

    /**
     * 会议时有效
     * 听众和互动者角色切换回调
     * @param {string} userId 用户id
     * @param {boolean} audience 是否是切换为听众
     */
    onRequestChangeMode(userId, audience) {

    }
}
