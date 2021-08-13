/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */

export default class PeerConnectionClient {
    isInitiator = false;
    userId;
    status;
    joinTime = 0;
    acceptTime = 0;
    videoMuted;

    audience = false;
    useMainVideo = false;

    setUseMainVideo(useMainVideo){
        // will be override

    }
}
