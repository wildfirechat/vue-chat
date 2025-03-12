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

    // 单向，只能用来对方发送来的数据，需要向其他人发送数据时，需要使用 publisherImpl.dataChannel
    dataChannel

    constructor (userId) {
        this.userId = userId;
    }

}
