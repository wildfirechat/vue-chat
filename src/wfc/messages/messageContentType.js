/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */

/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */
export default class MessageContentType {
    // 基本消息类型
    static Unknown = 0;
    static Text = 1;
    static Voice = 2;
    static Image = 3;
    static Location = 4;
    static File = 5;
    static Video = 6;
    static Sticker = 7;
    static Link = 8;
    static P_Text = 9;
    static UserCard = 10;
    static Composite_Message = 11;
    static Rich_Notification = 12;
    static Articles = 13;

    //流式文本正在生成消息
    static Streaming_Text_Generating = 14;
    //流式文本消息
    static Streaming_Text_Generated = 15;
    static Mark_Unread_Sync = 31;

    static StartSecretChat_Notification = 40;

    //频道进出消息
    static Enter_Channel_Chat = 71;
    static Leave_Channel_Chat = 72;
    static Channel_Menu_Event = 73

    // 提醒消息
    static RecallMessage_Notification = 80;
    static DeleteMessage_Notification = 81; //不存储的
    static Tip_Notification = 90;
    static Typing = 91;
  // //以上是打招呼的内容
  // int ContentType_Friend_Greeting = 92;
  // //您已经添加XXX为好友了，可以愉快地聊天了
  // int ContentType_Friend_Added = 93;
  //
  // int ContentType_PC_LOGIN_REQUSET = 94;

    static Friend_Greeting = 92;
    static Friend_Added = 93;
    static PC_Login_Request = 94;

    // 群相关消息
    static CreateGroup_Notification = 104;
    static AddGroupMember_Notification = 105;
    static KickOffGroupMember_Notification = 106;
    static QuitGroup_Notification = 107;
    static DismissGroup_Notification = 108;
    static TransferGroupOwner_Notification = 109;
    static ChangeGroupName_Notification = 110;
    static ModifyGroupAlias_Notification = 111;
    static ChangeGroupPortrait_Notification = 112;
    static MuteGroup_Notification = 113;
    static ChangeJoinType_Notification = 114;
    static ChangePrivateChat_Notification = 115;
    static ChangeSearchable_Notification = 116;
    static SetGroupManager_Notification = 117;
    //禁言/取消禁言群成员的通知消息
    static MuteGroupMember_Notification = 118;
    // 全局禁言之后，允许群成员发言的通知消息
    static AllowGroupMember_Notification = 119;
    //踢出群成员的可见通知消息
    static KickOffGroupMember_Visible_Notification = 120;
    //退群的可见通知消息
    static QuitGroup_Visible_Notification = 121;

    static ModifyGroupExtra_Notification = 122;
    static ModifyGroupMemberExtra_Notification = 123;

    static ModifyGroupSetting_Notification = 124;
    static RejectJoinGroup = 125;

    static VOIP_CONTENT_TYPE_START = 400;
    static VOIP_CONTENT_TYPE_END = 402;
    static VOIP_CONTENT_TYPE_ACCEPT = 401;
    static VOIP_CONTENT_TYPE_SIGNAL = 403;
    static VOIP_CONTENT_TYPE_MODIFY = 404;
    static VOIP_CONTENT_TYPE_ACCEPT_T = 405;
    static VOIP_CONTENT_TYPE_ADD_PARTICIPANT = 406;
    static VOIP_CONTENT_TYPE_MUTE_VIDEO = 407;
    static CONFERENCE_CONTENT_TYPE_INVITE = 408;
    static CONFERENCE_CONTENT_TYPE_CHANGE_MODE = 410;
    static CONFERENCE_CONTENT_TYPE_KICKOFF_MEMBER = 411;
    static CONFERENCE_CONTENT_TYPE_COMMAND = 412;

    static VOIP_Multi_Call_Ongoing = 416;
    static VOIP_Join_Call_Request = 417;

    static MESSAGE_CONTENT_TYPE_FEED = 501;
    static MESSAGE_CONTENT_TYPE_COMMENT = 502;
    static MESSAGE_CONTENT_TYPE_MIX_MULTI_MEDIA_TEXT= 510;
    static MESSAGE_CONTENT_TYPE_MIX_FILE_TEXT= 511;
}
