<template>

</template>

<script>
import localStorageEmitter from "./localStorageEmitter";
import wfc from "../wfc/client/wfc";
import Message from "../wfc/messages/message";
import Conversation from "../wfc/model/conversation";
import store from "../store";
import avenginekitproxy from "../wfc/av/engine/avenginekitproxy";
import ConversationType from "../wfc/model/conversationType";

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

        localStorageEmitter.handle('getUserInfo', (ev, args) => {
            console.log('getUserInfo', ev, args)
            let userId = args.userId;
            let groupId = args.groupId;
            let refresh = args.refresh;
            let userInfo = wfc.getUserInfo(userId, refresh, groupId);
            console.log('getUserInfo result', userInfo)
            return userInfo;
        });

        localStorageEmitter.handle('getUserId', (ev, args) => {
            return wfc.getUserId();
        });

        localStorageEmitter.handle('getUserDisplayName', (ev, args) => {
            return wfc.getUserDisplayName(args.userId);
        });

        localStorageEmitter.on('sendMessage', (ev, args) => {
            let conversation = Object.assign(new Conversation(), args.conversation);
            let payload = args.messagePayload;
            let messageContent = Message.messageContentFromMessagePayload(payload, wfc.getUserId());
            wfc.sendConversationMessage(conversation, messageContent);
        })

        localStorageEmitter.on('startConversation', (ev, args) => {
            let conversation = Object.assign(new Conversation(), args.conversation);
            store.setCurrentConversation(conversation);
        })

        localStorageEmitter.on('startCall', (ev, args) => {
            let conversation = Object.assign(new Conversation(), args.conversation);
            let audioOnly = args.audioOnly;
            if (conversation.type === ConversationType.Single) {
                avenginekitproxy.startCall(conversation, audioOnly, [conversation.target], '')
            } else {
                this.startGroupVoip(conversation, audioOnly);
            }
        })
    },
    methods: {
        startGroupVoip(conversation, isAudioOnly) {
            let successCB = users => {
                let participantIds = users.map(u => u.uid);
                avenginekitproxy.startCall(conversation, isAudioOnly, participantIds, '')
            };
            this.$pickContact({
                successCB,
                users: store.getGroupMemberUserInfos(this.conversationInfo.conversation.target, true, true),
                initialCheckedUsers: [this.sharedContactState.selfUserInfo],
                uncheckableUsers: [this.sharedContactState.selfUserInfo],
                confirmTitle: this.$t('common.confirm'),
            });
        },

    }
}
</script>

<style scoped>

</style>
