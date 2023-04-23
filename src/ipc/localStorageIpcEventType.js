// 不同窗口间通信事件定义
export default class LocalStorageIpcEventType {
    static openConversation = 'open-conversation';
    static startConversation = 'start-conversation';
    static startVoipCall = 'start-voip-call';
    static inviteConferenceParticipant = 'invite-conference-participant';
    static joinConferenceFailed = 'join-conference-failed';
}
