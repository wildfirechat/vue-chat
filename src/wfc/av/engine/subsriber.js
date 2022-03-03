/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */
import WfcAVEngineKit from "./avenginekit";
export default class Subsriber {
    isInitiator = false;
    userId;
    callExtra;
    status;
    joinTime = 0;
    acceptTime = 0;
    audioMuted = false;
    videoMuted = false;
    stream;
    audience = false;
    useMainVideo = WfcAVEngineKit.DEFAULT_USE_MAIN_VIDEO;

    setUseMainVideo(useMainVideo){
        // will be override

    }
}
