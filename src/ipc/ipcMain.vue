<template>

</template>

<script>
import localStorageEmitter from "./localStorageEmitter";
import Conversation from "../wfc/model/conversation";
import store from "../store";
import avenginekitproxy from "../wfc/av/engine/avenginekitproxy";
import ConversationType from "../wfc/model/conversationType";
import LocalStorageIpcEventType from "./localStorageIpcEventType";
import {remote} from "../platform";
import CallEndReason from "../wfc/av/engine/callEndReason";
import wfc from "../wfc/client/wfc";

export default {
    name: "ipcMain",

    mounted() {
        localStorageEmitter.on(LocalStorageIpcEventType.startConversation, (ev, args) => {
            let conversation = Object.assign(new Conversation(), args.conversation);
            store.setCurrentConversation(conversation);
        })

        localStorageEmitter.on(LocalStorageIpcEventType.startVoipCall, (ev, args) => {
            let conversation = Object.assign(new Conversation(), args.conversation);
            let audioOnly = args.audioOnly;
            if (conversation.type === ConversationType.Single) {
                avenginekitproxy.startCall(conversation, audioOnly, [conversation.target], '')
            } else {
                this.startGroupVoip(conversation, audioOnly);
            }
        })

        localStorageEmitter.on(LocalStorageIpcEventType.openConversation, (events, args) => {
            let conversation = args.conversation;
            let win = remote.getCurrentWindow();
            win.focus();
            store.setCurrentConversation(Object.assign(new Conversation(), conversation));
        })

        localStorageEmitter.on(LocalStorageIpcEventType.joinConferenceFailed, (sender, args) => {
            let reason = args.reason;
            let session = args.session;
            if (reason === CallEndReason.RoomNotExist) {
                if (session.host === wfc.getUserId()) {
                    this.$alert({
                        showIcon: false,
                        content: '会议已结束，是否重新开启会议？',
                        cancelCallback: () => {
                            // do nothing
                        },
                        confirmCallback: () => {
                            // 等待之前的音视频通话窗口完全关闭
                            setTimeout(() => {
                                avenginekitproxy.startConference(session.callId, session.audioOnly, session.pin, session.host, session.title, session.desc, session.audience, session.advance)
                            }, 1000);
                        }
                    })
                } else {
                    this.$notify({
                        title: '会议已结束',
                        text: '请联系主持人开启会议',
                        type: 'warn'
                    });
                }
            } else if (reason === CallEndReason.RoomParticipantsFull) {
                this.$notify({
                    title: '加入会议失败',
                    text: '参与者已满，请重试',
                    type: 'warn'
                });
            }
        });
    },
    methods: {
        startGroupVoip(conversation, isAudioOnly) {
            this.$startVoipCall({audioOnly: isAudioOnly, conversation: conversation});
        },

    }
}
</script>

<style scoped>

</style>
