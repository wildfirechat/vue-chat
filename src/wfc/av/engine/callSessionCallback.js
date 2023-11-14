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
     * @param {number} reason 挂断原因，参考{@link CallEndReason}
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
     * 屏幕共享结束回调
     */
    didScreenShareEnded(){

    }


    /**
     * 本地视频流旋转回调
     * @param {MediaStream} stream
     * @param {boolean} screenSharing
     */
    didRotateLocalVideoTrack(stream, screenSharing) {

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
     * @param {boolean} audience 是否是切换为听众
     */
    onRequestChangeMode(audience) {

    }

    /**
     * 旋转视频流的具体实现方法，由{@link CallSession#rotate} 触发
     * @param {MediaStream} stream 待旋转的视频流
     * @param {number} ang 旋转角度，可选0，90，180，270
     * @param {Object} scaleTo 可选，小流时有效， 值 固定为{width: 200, height: 200}
     * @return MediaStream 返回旋转之后的视频流
     */
    onRotateStream(stream, ang, scaleTo = null){
        console.log('onRotateStream capabilities', stream.getVideoTracks()[0].getCapabilities());
        const canvas = document.createElement("canvas");
        Object.assign(canvas, { width: 200, height: 200 });
        const ctx = canvas.getContext("2d");
        const track = stream.getVideoTracks()[0];
        const drawOnCanvas = (image, width, height) => {
            // MediaStream's video size may change over time
            if (canvas.width !== width || canvas.height !== height) {
                switch (ang){
                    case 90:
                        canvas.width = height;
                        canvas.height = width;
                        // ctx.setTransform(0, 1, -1, 0, ctx.canvas.width, 0);
                        ctx.translate(canvas.width, 0);
                        ctx.rotate(90 * Math.PI / 180)
                        break;
                    case 270:
                        canvas.width = height;
                        canvas.height = width;
                        //ctx.setTransform(0, -1, 1, 0, 0, ctx.canvas.height)
                        ctx.translate(0, canvas.height);
                        ctx.rotate(270 * Math.PI / 180)
                        break;
                    case 0:
                        canvas.width = width;
                        canvas.height = height;
                        ctx.setTransform(1, 0, 0, 1, 0, 0);
                        break;
                    case 180:
                        canvas.width = width;
                        canvas.height = height;
                        ctx.setTransform(-1, 0, 0, -1, ctx.canvas.width, ctx.canvas.height)
                        break;
                    default:
                        break
                }
            }
            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(image, 0, 0);
        };
        // the MediaStreamTrackProcessor API is available, we use it
        if (window.MediaStreamTrackProcessor) {
            const processor = new MediaStreamTrackProcessor(track);
            const reader = processor.readable.getReader();
            reader.read().then(function readChunk({ done, value }) {
                if (!done) {
                    const { displayWidth, displayHeight } = value;
                    drawOnCanvas(value, displayWidth, displayHeight);
                    value.close(); // close the VideoFrame when we're done with it
                    reader.read().then(readChunk);
                }
            });
        } else {
            const vid = document.createElement("video");
            vid.srcObject = stream;
            // in case requestVideoFrameCallback is available, we use it
            // otherwise we fallback on rAF
            const scheduler = vid.requestVideoFrameCallback ?
                (cb) => vid.requestVideoFrameCallback(cb) : requestAnimationFrame;
            const draw = () => {
                const { videoWidth, videoHeight } = vid;
                drawOnCanvas(vid, videoWidth, videoHeight);
                scheduler(draw);
            };
            vid.play().then(draw);
        }
        if (scaleTo && scaleTo.width > 0 && scaleTo.height > 0){
            ctx.scale(scaleTo.width / canvas.width, scaleTo.height / canvas.height);
        }
        return canvas.captureStream();
    }
}
