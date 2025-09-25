/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */

export default class UserSettingScope {
    //不能直接使用，调用setConversation:silent:方法会使用到此值。
    static ConversationSilent = 1;
    static GlobalSilent = 2;
    //不能直接使用，调用setConversation:top:方法会使用到此值。
    static ConversationTop = 3;
    static HiddenNotificationDetail = 4;
    static GroupHideNickname = 5;
    static FavoriteGroup = 6;
    //不能直接使用，协议栈内会使用此值
    static Conversation_Sync = 7;
    //不能直接使用，协议栈内会使用此值
    static My_Channel = 8;
    //不能直接使用，协议栈内会使用此值
    static Listened_Channel = 9;
    static UserSettingPCOnline = 10;
    static UserSettingConversationReaded = 11;
    static WebOnline = 12;
    static DisableReceipt = 13;
    static FavoriteUser = 14;
    static MuteWhenPCOnline = 15;
    static LinesReaded = 16;
    static NoDisturbing = 17;
    static ConversationClearMessage = 18;
    static ConversationDraft = 19;
    static DisableSyncDraft = 20;
    static VoipSilent = 21;
    static PttReserved = 22;
    static CustomState = 23;
    static DisableSecretChat = 24;
    static PttSilent = 25;
    static GroupRemark = 26;

    static Privacy_Searchable = 27;
    static AddFriend_NoVerify = 28;
    static Sync_Badge = 29;

    // 用户自定义的scope需从1000开始，以防冲突
    static kUserSettingCustomBegin = 1000;
}
