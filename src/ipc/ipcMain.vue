<template>

</template>

<script>
import localStorageEmitter from "./localStorageEmitter";
import wfc from "../wfc/client/wfc";
import Message from "../wfc/messages/message";
import Conversation from "../wfc/model/conversation";

export default {
    name: "ipcMain",

    mounted() {

        localStorageEmitter.handle('getUserInfos', (ev, args) => {
            console.log('getUserInfos', ev, args)
            let userIds = args.userIds;
            let groupId = args.groupId ? args.groupId : '';
            let userInfos = wfc.getUserInfos(userIds, groupId);
            console.log('getUserInfos result', userInfos)
            return userInfos;
        });

        localStorageEmitter.handle('getUserId', (ev, args) => {
            return wfc.getUserId();
        });

        localStorageEmitter.on('sendMessage', (ev, args) => {
            let conversation = Object.assign(new Conversation(), args.conversation);
            let payload = args.messagePayload;
            let messageContent = Message.messageContentFromMessagePayload(payload, wfc.getUserId());
            wfc.sendConversationMessage(conversation, messageContent);
        })
    }
}
</script>

<style scoped>

</style>
