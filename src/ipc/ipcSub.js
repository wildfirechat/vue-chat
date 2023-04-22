import localStorageEmitter from "./localStorageEmitter";

// pc 端，可以直接使用 wfc.js 里面的接口，这儿的实现，已经没有意义，应尽量避免使用
// web 端，实现音视频窗口和主窗口通信
export default class IpcSub {

    static startConversation(conversation) {
        localStorageEmitter.send('startConversation', {
            conversation: conversation
        })
    }

    static startCall(conversation, audioOnly) {
        localStorageEmitter.send('startCall', {
            conversation: conversation,
            audioOnly: audioOnly,
        })
    }
}
