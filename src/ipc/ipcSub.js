import localStorageEmitter from "./localStorageEmitter";
import LocalStorageIpcEventType from "./localStorageIpcEventType";

// pc 端，可以直接使用 wfc.js 里面的接口，这儿的实现，已经没有意义，应尽量避免使用
// web 端，实现音视频窗口和主窗口通信
export default class IpcSub {

    static startConversation(conversation) {
        localStorageEmitter.send(LocalStorageIpcEventType.startConversation, {
            conversation: conversation
        })
    }

    static startVoipCall(conversation, audioOnly) {
        localStorageEmitter.send(LocalStorageIpcEventType.startVoipCall, {
            conversation: conversation,
            audioOnly: audioOnly,
        })
    }

    static openConversation(conversation){
        localStorageEmitter.send(LocalStorageIpcEventType.openConversation, {conversation: conversation})
    }
}
