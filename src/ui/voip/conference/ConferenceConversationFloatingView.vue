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
        <div class="send-message-container">
            <input placeholder="说点什么..." @change="sendMessage" v-model.trim="text">
        </div>
    </div>
</template>

<script>
import Conversation from "../../../wfc/model/conversation";
import ConversationType from "../../../wfc/model/conversationType";
import store from "../../../store";
import wfc from "../../../wfc/client/wfc";
import TextMessageContent from "../../../wfc/messages/textMessageContent";
import {gt} from "../../../wfc/util/longUtil";

export default {
    name: "ConferenceConversationFloatingView",
    props: {
        session: {
            type: Object,
            required: true,
        }
    },
    data() {
        return {
            sharedConversationState: store.state.conversation,
            sharedMiscState: store.state.misc,
            filteredMessages: [],
            filterInternal: 0,
            text: '',
        }
    },
    created() {
        let conversation = new Conversation(ConversationType.ChatRoom, this.session.callId, 0);
        console.log('setCurrentConversation ', conversation)
        store.setCurrentConversation(conversation);
        this.filterInternal = setInterval(() => {
            this.filterMessage();
        }, 1 * 1000);

    },
    updated() {
        let messageListElement = this.$refs['messageList'];
        messageListElement.scroll({top: messageListElement.scrollHeight, left: 0, behavior: 'auto'})
    },

    unmounted() {
        console.log('setCurrentConversation null')
        store.setCurrentConversation(null);
        clearInterval(this.filterInternal)
    },

    methods: {
        sendMessage() {
            let conversation = new Conversation(ConversationType.ChatRoom, this.session.callId, 0);
            wfc.sendConversationMessage(conversation, new TextMessageContent(this.text))
            this.text = '';
        },

        filterMessage() {
            let now = new Date().getTime();
            this.filteredMessages = this.sharedConversationState.currentConversationMessageList.filter(m => {
                return gt(m.timestamp, now - 30 * 1000)
            })
        }
    },
    watch: {
        'sharedConversationState.currentConversationMessageList': {
            handler(newValue) {
                let now = new Date().getTime();
                this.filteredMessages = this.sharedConversationState.currentConversationMessageList.filter(m => {
                    return gt(m.timestamp, now - 30 * 1000)
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
    flex-direction: column;
}

.message-list-container {
    flex: 1 1 auto;
    overflow: scroll;
    max-height: 200px;
}

.message-list-container::-webkit-scrollbar {
    display: none;
}

.message {
    display: flex;
    font-size: 13px;
}

.message .sender {
    color: #f66868;
    padding-right: 5px;
}

.message .content {
    color: lightgrey;
}

.send-message-container {
    height: 40px;
    z-index: 100000;
}

.send-message-container input {
    width: 100%;
    height: 100%;
    background: transparent;
    border: none;
    color: lightgrey;
    padding: 0 10px;
}

.send-message-container input:focus {
    outline: none;
}

</style>
