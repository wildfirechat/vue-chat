/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */

export default class ChannelInfo {
    channelId;
    name;
    portrait;
    desc;
    owner;
    // 0, public; 1, private; 2, destoryed
    status;
    extra;
    updateDt;
    menus;
    //第0位表示是否允许查看用户所有信息，还是只允许看用户id，用户名称，用户昵称和用户头像
    static StatusMaskFullInfo = 0x01;
    //第1位表示是否允许查看非订阅用户信息
    static StatusMaskUnsubscribedUserAccess = 0x02;
    //第2位表示是否允许主动添加用户订阅关系
    static StatusMaskActiveSubscribe = 0x04;
    //第3位表示是否允许给非订阅用户发送消息
    static StatusMaskMessageUnsubscribed = 0x08;
    //第4位表示是否私有
    static StatusMaskPrivate = 0x10;

    //第6位表示是否删除
    static StatusMaskDeleted = 0x40;

    //第8位表示是否全局频道，全局平道发送消息时，会广播给系统所有人
    static StatusMaskGlobal = 0x80;
}
