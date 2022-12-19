export default class PttErrorCode{
    static UNKNOWN = -1;
    static OCCUPIED = -2;
    static MAX_SPEAKER = -3;
    static GROUP_MUTED = -4;
    static GROUP_MEMBER_MUTED = -5;
    static TALKING = -6;
    static NOT_IN_GROUP = -7;
    static PTT_DISABLED = -8;
    // 没有录音权限等，会触发
    static RECORDER_ERROR = -9;
}
