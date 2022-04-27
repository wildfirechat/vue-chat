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

    /**
     *  自己挂断回调
     * @param {CallEndReason} reason 挂断原因
     */
    didCallEndWithReason(reason) {

    }

    /**
     * 可用来实现响铃相关
     * 1. outgoing -> connecting: 开始 -> 结束播放呼出铃声
     * 2. incoming -> connecting: 开始 -> 结束播放呼入铃声
     *  自己通话状态变化时调用
     * @param {CallState} state 状态
     */
    didChangeState(state) {

    }

    /**
     * 新参与者加入回调
     * @param {string} userId 用户 id
     * @param {boolean} screenSharing 是否是屏幕共享
     */
    didParticipantJoined(userId, screenSharing = false) {

    }

    /**
     * 参与者连接成功
     * @param {string} userId 用户 id
     * @param {boolean} screenSharing 是否是屏幕共享
     */
    didParticipantConnected(userId, screenSharing = false) {

    }

    /**
     * 参与者挂断回调
     * @param {string} userId 用户 id
     * @param {CallEndReason} callEndReason 挂断原因
     * @param {boolean} screenSharing 是否是屏幕共享
     */
    didParticipantLeft(userId, callEndReason, screenSharing = false) {

    }

    /**
     * 视频通话切换到语音通话回调
     * @param {boolean} audioOnly 目前都是 true
     */
    didChangeMode(audioOnly) {

    }

    /**
     * 本地音视频流创建成功回调
     * @param {MediaStream} stream 音视频流
     * @param {boolean} screenSharing 是否是屏幕共享
     */
    didCreateLocalVideoTrack(stream, screenSharing) {

    }

    /**
     * 创建本地音视频流失败 回调，可能原因可能是没有摄像头、或者没有麦克风
     * @param {Error} e
     */
    didCreateLocalVideoTrackError(e) {

    }

    didError(error) {

    }

    didGetStats(reports) {

    }

    /**
     * 收到其他参与者音视频流回调
     * @param {string} userId 用户 id
     * @param {MediaStream} stream 音视频流
     * @param {boolean} screenSharing 是否是屏幕共享
     */
    didReceiveRemoteVideoTrack(userId, stream, screenSharing = false) {

    }

    /**
     *  其他参与者音视频流结束回调
     * @param {string} userId 用户 id
     */
    didRemoveRemoteVideoTrack(userId) {

    }

    /**
     * 音量通知
     * @param {string} userId 用户 id
     * @param {number} volume  音量，取值范围是 0-1
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
     * @param {boolean} screenSharing
     */
    didMediaLostPacket(media, lostPacket, screenSharing = false) {

    }

    /**
     * 接收用户媒体丢包回调
     * @param userId 用户id
     * @param media 媒体类型，audio 或 video
     * @param lostPacket 丢包数
     * @param uplink 方向，true是对方丢的，false是己方丢的
     * @param {boolean} screenSharing
     */
    didUserMediaLostPacket(userId, media, lostPacket, uplink, screenSharing = false) {

    }

    /**
     * 发起者变更回调，多人通话过程中，原始发起者退出通话，会触发选举新的发起者
     * @param {string} initiator 新的发起者
     */
    didChangeInitiator(initiator) {

    }

    /**
     * 会议时有效
     * 听众或互动者角色变更回调
     * @param {string} userId
     * @param {boolean} audience
     * @param {boolean} screenSharing
     */
    didChangeType(userId, audience, screenSharing = false) {

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
