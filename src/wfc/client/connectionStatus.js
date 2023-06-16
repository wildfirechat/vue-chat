/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */

export default class ConnectionStatus {
    static ConnectionStatusTimeInconsistent = -9;
    static ConnectionStatusNotLicensed = -8;
    static ConnectionStatusKickedOff = -7;
    static ConnectionStatusSecretKeyMismatch = -6;
    static ConnectionStatusTokenIncorrect = -5;
    static ConnectionStatusServerDown = -4;
    static ConnectionStatusRejected = -3;
    static ConnectionStatusLogout = -2;
    static ConnectionStatusUnconnected = -1;
    static ConnectionStatusConnecting = 0;
    static ConnectionStatusConnected = 1;
    static ConnectionStatusReceiveing = 2;

    static desc(status) {
        const desc = {
            '-9': '客户端和IM 服务端时间不同步，请进行时钟同步',
            '-8': 'IM 服务未授权，专业版IM-Server 是绑定域名或者 ip 的，只能通过所绑定的域名去连接',
            '-7': '被踢下线',
            '-6': '会话密钥错误，请参考 https://docs.wildfirechat.cn/faq/general.html 第12个问题排查',
            '-5': 'token错误',
            '-4': 'IM Server服务无法连通，请检查服务器是否宕机或者网络出现问题',
            '-3': '连接被服务器拒绝，一般是用户被封禁',
            '-2': '退出登录',
            '-1': '连接失败',
            '0': '连接中',
            '1': '连接成功，正常状态，所有业务可用',
            '2': '正在同步信息，登录以后要先同步消息，可能同步数据量比较大，这时可以选择等待连接状态变为1时来统一更新UI'
        };
        return desc[status]
    }
}
