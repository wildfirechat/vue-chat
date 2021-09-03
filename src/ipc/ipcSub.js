import localStorageEmitter from "./localStorageEmitter";

// 里面是一些通用的ipc方法，可以在不同的地方复用
export default class IpcSub {
    static getUserInfos(userIds, groupId = '', callback) {
        localStorageEmitter.invoke('getUserInfos', {userIds: userIds, groupId: groupId}, callback)
    }

    static getUserId() {
        return localStorageEmitter.promiseInvoke('getUserId', {})
    }

    static sendMessage(conversation, messageContent) {
        localStorageEmitter.send('sendMessage', {conversation: conversation, messagePayload: messageContent.encode()});
    }
}
