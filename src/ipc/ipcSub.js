import localStorageEmitter from "./localStorageEmitter";
import {isElectron} from "../platform";
import wfc from "../wfc/client/wfc";

// pc 端，可以直接使用 wfc.js 里面的接口，这儿的实现，已经没有意义，应尽量避免使用
// web 端，实现音视频窗口和主窗口通信
export default class IpcSub {
    static getUserInfos(userIds, groupId = '', callback) {
        localStorageEmitter.invoke('getUserInfos', {userIds: userIds, groupId: groupId}, callback)
    }

    static getUserInfo(userId, groupId = '', refresh = false, callback) {
        localStorageEmitter.invoke('getUserInfo', {userId: userId, groupId: groupId, refresh: refresh}, callback)
    }

    static async getUserDisplayName(userId) {
        if (isElectron()) {
            return wfc.getUserDisplayName(userId);
        } else {
            return await localStorageEmitter.promiseInvoke('getUserDisplayName', {userId: userId})
        }
    }

    static async getUserId() {
        if (isElectron()) {
            let userId = wfc.getUserId();
            return userId;
        } else {
            return await localStorageEmitter.promiseInvoke('getUserId', {})
        }
    }

    static sendMessage(conversation, messageContent) {
        if (isElectron()) {
            wfc.sendConversationMessage(conversation, messageContent);
        } else {
            localStorageEmitter.send('sendMessage', {conversation: conversation, messagePayload: messageContent.encode()});
        }
    }

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
