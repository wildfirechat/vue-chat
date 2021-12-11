/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */

import MessageContent from './messageContent'

export default class MediaMessageContent extends MessageContent {
    file;
    remotePath = '';
    localPath = '';
    mediaType = 0;

    /**
     *
     * @param {number} messageType 消息类型
     * @param {number} mediaType 媒体类型
     * @param {File | string} fileOrLocalPath File类型，或者dataUri或者本地路径，本地路径是必须是绝对路径
     * @param {string} remotePath 远端地址
     */
    constructor(messageType, mediaType = 0, fileOrLocalPath, remotePath) {
        super(messageType);
        this.mediaType = mediaType;
        if (!fileOrLocalPath) {
            this.localPath = '';
            this.remotePath = remotePath;
        } else if (typeof fileOrLocalPath === "string" && !fileOrLocalPath.startsWith("http")) {
            this.localPath = fileOrLocalPath;
            this.remotePath = remotePath;
        } else {
            this.file = fileOrLocalPath;
            if (fileOrLocalPath && fileOrLocalPath.path !== undefined) {
                this.localPath = fileOrLocalPath.path;
                // attention: 粘贴的时候，path是空字符串，故采用了这个trick
                if (this.localPath.indexOf(fileOrLocalPath.name) < 0) {
                    this.localPath += fileOrLocalPath.name;
                }
            }

        }
    }

    encode() {
        let payload = super.encode();
        payload.localMediaPath = this.localPath;
        payload.remoteMediaUrl = this.remotePath;
        payload.mediaType = this.mediaType;
        return payload;
    }

    decode(payload) {
        super.decode(payload);
        this.localPath = payload.localMediaPath;
        this.remotePath = payload.remoteMediaUrl;
        this.mediaType = payload.mediaType;
    }
    // TODO 双网环境时，媒体的远程地址需要进行 主网 和 备选网络 之间的转换
    // route 时，返回备选媒体网络信息，然后根据备选网络策略进行转换
    fixedRemotePath(){
        return this.remotePath;
    }
}
