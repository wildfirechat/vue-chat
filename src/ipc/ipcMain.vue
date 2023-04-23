<template>

</template>

<script>
import localStorageEmitter from "./localStorageEmitter";
import Conversation from "../wfc/model/conversation";
import store from "../store";
import avenginekitproxy from "../wfc/av/engine/avenginekitproxy";
import ConversationType from "../wfc/model/conversationType";
import LocalStorageIpcEventType from "./localStorageIpcEventType";

export default {
    name: "ipcMain",

    mounted() {

        localStorageEmitter.on(LocalStorageIpcEventType.startConversation, (ev, args) => {
            let conversation = Object.assign(new Conversation(), args.conversation);
            store.setCurrentConversation(conversation);
        })

        localStorageEmitter.on(LocalStorageIpcEventType.startCall, (ev, args) => {
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
