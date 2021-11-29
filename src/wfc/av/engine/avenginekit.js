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

    /**
     * 返回当前音视频通话session
     * 仅在音视频窗口调用有效
     */
    getCurrentSession() {
    }

    static MAX_AUDIO_PARTICIPANT_COUNT = 16;
    static MAX_VIDEO_PARTICIPANT_COUNT = 9;
    // 是否禁用双流模式
    static DISABLE_DUAL_STREAM = false;
    /**
     禁止双流模式下，小流低帧率。默认为false，小流的帧率为8fps。当为true时使用同大流一样的帧率
     */
     static DISABLE_SMALL_STREAM_LOW_FPS = false;
    // 是否默认使用大流
    static DEFAULT_USE_MAIN_VIDEO = true;
}
