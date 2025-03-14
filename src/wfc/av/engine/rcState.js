export default class RCState {
    /**
     * 远程控制状态，单人视频通话时有效
     * 0，idle
     * 1，outgoing inviting，发送远程协助邀请
     * 2, incoming inviting，收到远程协助邀请
     * 3, outgoing request，发出远程控制请求
     * 4, incoming request，收到远程控制请求
     * 5, connected，远程协助/远程控制中
     */
    static STATUS_IDLE = 0;
    static STATUS_OUTGOING_INVITE = 1;
    static STATUS_INCOMING_INVITE = 2;
    static STATUS_OUTGOING_REQUEST = 3;
    static STATUS_INCOMING_REQUEST = 4;
    static STATUS_CONNECTED = 5;

}