import localStorageEmitter from "./localStorageEmitter";
import LocalStorageIpcEventType from "./localStorageIpcEventType";

// pc 端，用于跨窗口通信
// web 端，现在是单窗口，已经无意义
export default class IpcSub {

    static startConversation(conversation, focusConversationWindow = false) {
        localStorageEmitter.send(LocalStorageIpcEventType.startConversation, {
            conversation: conversation,
            focusConversationWindow
        })
    }

    static startVoipCall(conversation, audioOnly) {
        localStorageEmitter.send(LocalStorageIpcEventType.startVoipCall, {
            conversation: conversation,
            audioOnly: audioOnly,
        })
    }
}
