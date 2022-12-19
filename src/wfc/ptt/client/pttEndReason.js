export default class PttEndReason{
    //用户主动释放
    static User_Release = 0;
    //讲话超时
    static Timeout = 1;
    //被抢占
    static Take_Over = 2;
    //网络错误
    static Network_Error = 3;
    //频道禁言，只有频道主能讲话
    static Channel_Muted = 4;
    //成员被禁言
    static Member_Muted = 5;
    //音频服务错误
    static Media_Error = 6;
    //不在频道内
    static Not_InChannel = 7;
    //用户被封禁
    static User_Disabled = 8;

}
