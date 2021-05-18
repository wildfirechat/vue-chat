<template>

</template>

<script>
import localStorageEmitter from "./localStorageEmitter";
import ForwardMessageByPickConversationView
    from "../ui/main/conversation/message/forward/ForwardMessageByPickConversationView";
import {remote} from "../platform";

export default {
    name: "ipcMain",

    mounted() {
        // just for example
        localStorageEmitter.on('pick-conversation', (ev, args) => {
            remote.getCurrentWindow().focus();
            console.log('pick-conversation')
            let beforeClose = (event) => {
                console.log('Closing...', event, event.params)
                // What a gamble... 50% chance to cancel closing
                if (event.params.toCreateConversation) {
                    console.log('to show')
                    // this.createConversationAndForwardMessage(forwardType, messages)
                } else if (event.params.confirm) {
                    let conversations = event.params.conversations;
                    let extraMessageText = event.params.extraMessageText;
                    // TODO 多选转发
                    // store.forwardMessage(0, conversations, messages, extraMessageText)
                } else {
                    console.log('cancel')
                    // TODO clear pick state
                }
                ev.reply('pick-conversation-done')
            };

            this.$modal.show(
                ForwardMessageByPickConversationView,
                {
                    forwardType: 0,
                    messages: [],
                }, {
                    name: 'forward-by-pick-conversation-modal',
                    width: 600,
                    height: 480,
                    clickToClose: false,
                }, {
                    'before-close': beforeClose,
                })
        })
    }
}
</script>

<style scoped>

</style>
