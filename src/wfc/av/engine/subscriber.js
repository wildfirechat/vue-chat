/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */
import WfcAVEngineKit from "./avenginekit";
export default class Subscriber {
    isInitiator = false;
    userId;
    callExtra;
    status;
    joinTime = 0;
    acceptTime = 0;
    audioMuted;
    videoMuted;
    stream;
    audience = false;
    useMainVideo = WfcAVEngineKit.DEFAULT_USE_MAIN_VIDEO;
    videoDisabled = false;

    setUseMainVideo(useMainVideo){
        // will be override
    }

    /**
     * 会议版 sdk 有效
     * 视频通话时，订阅或取消订阅视频流
     * @param {boolean} enable 是否订阅视频流
     */
    setVideoEnable(enable) {

    }
}
