/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */
export default class WfcAVEngineKit {
    /**
     * CallSession 相关回调
     * @deprecated 可能被移除，请勿直接设置，可通过{@link setup}参数直接传入
     */
    sessionCallback;

    /**
     * 音视频window显示的时候调用
     */
    setup(sessionCallback) {
    }

    static MAX_AUDIO_PARTICIPANT_COUNT = 16;
    static MAX_VIDEO_PARTICIPANT_COUNT = 9;
    // 是否支持双流
    static DISABLE_DUAL_STREAM = false;
    // 是否默认使用大流
    static DEFAULT_USE_MAIN_VIDEO = true;
}
