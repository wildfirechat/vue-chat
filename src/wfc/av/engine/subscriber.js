/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */
export default class Subscriber {
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
    currentVideoType;

    constructor (userId) {
        this.userId = userId;
    }

}
