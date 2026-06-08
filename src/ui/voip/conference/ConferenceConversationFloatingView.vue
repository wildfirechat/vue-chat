<template>
    <div class="conversation-container">
        <div class="message-list-container"
             ref="messageList">
            <div v-for="(message, index) in filteredMessages"
                 :key="index"
                 class="message">
                <p class="sender">{{ message._from._displayName + ': ' }}</p>
                <p class="content">{{ message.messageContent.digest(message) }}</p>
            </div>
        </div>
    </div>
</template>

<script>
import {gt} from "../../../wfc/util/longUtil";

export default {
    name: "ConferenceConversationFloatingView",
    props: {
        session: {
            type: Object,
            required: true,
        },
        conversationStore: {
            type: Object,
            required: true,
        }
    },
    data() {
        return {
            sharedConversationState: this.conversationStore.state.conversation,
            filteredMessages: [],
            filterInternal: 0,
        }
    },
    created() {
        this.filterInternal = setInterval(() => {
            this.filterMessage();
        }, 1 * 1000);

    },
    updated() {
        let messageListElement = this.$refs['messageList'];
        messageListElement.scroll({top: messageListElement.scrollHeight, left: 0, behavior: 'auto'})
    },

    unmounted() {
        clearInterval(this.filterInternal)
    },

    methods: {

        filterMessage() {
            let now = new Date().getTime();
            this.filteredMessages = this.sharedConversationState.currentConversationMessageList.filter(m => {
                return m.messageId !== 0 && gt(m.timestamp, now - 30 * 1000)
            })
        }
    },
    watch: {
        'sharedConversationState.currentConversationMessageList': {
            handler(newValue) {
                let now = new Date().getTime();
                this.filteredMessages = this.sharedConversationState.currentConversationMessageList.filter(m => {
                    return m.messageId !== 0 && gt(m.timestamp, now - 30 * 1000)
                })
            }
        }
    }
}
</script>

<style scoped>

.conversation-container {
    width: 100%;
    height: 100%;
    display: flex;
}

.message-list-container {
    flex: 1 1 auto;
    overflow: scroll;
    max-height: 200px;
    flex-direction: column;
    background-color: rgb(128 128 128 / 50%);
    border-radius: var(--radius-sm);
}

.message-list-container:not(:empty){
    padding: 8px;
}

.message-list-container::-webkit-scrollbar {
    display: none;
}

.message {
    display: flex;
    font-size: var(--font-size-base);
}

.message .sender {
    color: var(--text-primary);
    padding-right: 4px;
}

.message .content {
    color: white;
}

</style>
