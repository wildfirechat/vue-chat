/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */
export default class WfcAVEngineKit {
    sessionCallback;

    /**
     * 音视频window显示的时候调用
     */
    // TODO 将sessionCallback作为参数传递进来吧
    setup() {
    }

    static MAX_AUDIO_PARTICIPANT_COUNT = 16;
    static MAX_VIDEO_PARTICIPANT_COUNT = 9;
    // 是否支持双流
    static DISABLE_DUAL_STREAM = false;
    // 是否默认使用大流
    static DEFAULT_USE_MAIN_VIDEO = true;
}
