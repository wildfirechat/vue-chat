/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */

export default class CallSessionCallback {

    /**
     * session 初始化回调
     * @param {CallSession} session 会话信息
     * @param {UserInfo} selfUserInfo 自己的用户信息
     * @param {UserInfo} initiatorUserInfo 发起者用户信息
     * @param {[UserInfo]} participantUserInfos 参与者用户信息，不包含自己
     * @param {[UserInfo]} groupMemberUserInfos 多人音视频通话是有效。 发起音视频通话所在群的群成员信息。
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

    didError(error) {

    }

    didGetStats(reports) {

    }

    didReceiveRemoteVideoTrack(userId, stream) {

    }

    didRemoveRemoteVideoTrack(userId) {

    }

    didReportAudioVolume(userId, volume) {

    }

    didVideoMuted(userId, muted) {
    }

    didChangeInitiator(initiator){

    }
}
