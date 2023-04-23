// 不同窗口间通信事件定义
export default class LocalStorageIpcEventType {
    static openConversation = 'open-conversation';
    static startConversation = 'start-conversation';
    static startCall = 'start-call';
    static inviteConferenceParticipant = 'invite-conference-participant';
    static joinConferenceFailed = 'join-conference-failed';
}
