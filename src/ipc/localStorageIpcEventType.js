// 不同窗口间通信事件定义
export default class LocalStorageIpcEventType {
    static startConversation = 'start-conversation';
    static startVoipCall = 'start-voip-call';
    static joinConferenceFailed = 'join-conference-failed';
}
