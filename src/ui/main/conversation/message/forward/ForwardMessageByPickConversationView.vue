<template>
    <div class="pick-conversation-container">
        <section class="conversation-list-panel">
            <div class="input-container">
                <input type="text" :placeholder="$t('common.search')"
                       v-model="query">
            </div>
            <section class="conversation-list-container">
                <div class="create-group" @click="showForwardByCreateConversationModal">
                    <p>{{ $t('conversation.create_group') }}</p>
                </div>
                <p>{{ $t('conversation.recent_conversation') }}</p>
                <virtual-list
                    v-if="conversationInfos.length"
                    :data-component="conversationItemComponent"
                    :data-sources="conversationInfos"
                    :data-key="conversationKey"
                    :estimate-size="70"
                    style="height: 100%; overflow-y: auto;">
                </virtual-list>
            </section>
        </section>
        <section class="checked-conversation-list-container">
            <header>
                <h2>{{ $t('conversation.forward_title') }}</h2>
                <span
                    v-if="sharedPickState.conversations.length === 0">{{
                        $t('conversation.not_select_conversation')
                    }}</span>
                <span v-else>{{
                        $t('conversation.select_conversation_desc', [this.sharedPickState.conversations.length])
                    }}</span>
            </header>
            <div class="content">
                <div class="picked-user-container" v-for="(conversation, index) in sharedPickState.conversations"
                     :key="index">
                    <div class="picked-user">
                        <img class="avatar" :src="conversation._target.portrait" alt="">
                        <button @click="unpConversation(conversation)" class="unpick-button">X</button>
                    </div>
                    <span class="name single-line">{{ conversation._target._displayName }}</span>
                </div>
            </div>
            <ForwardMessageView ref="forwardMessageView" v-if="sharedPickState.conversations.length > 0"
                                :forward-type="forwardType" :messages="messages"/>
            <footer>
                <button @click="cancel" class="cancel">{{ $t('common.cancel') }}</button>
                <button @click="confirm" class="confirm">{{ $t('common.send') }}</button>
            </footer>
        </section>
    </div>
</template>

<script>
import store from "../../../../../store";
import ForwardMessageView from "./ForwardMessageView.vue";
import ConversationPickItem from "./ConversationPickItem.vue";
import {markRaw} from "vue";

export default {
    name: "ForwardMessageByPickConversationView",
    props: {
        forwardType: {
            // 可参考ForwardType
            type: Number,
            required: false,
        },
        messages: {
            type: Array,
            required: true,
        },
    },
    data() {
        return {
            sharedConversation: store.state.conversation,
            sharedPickState: store.state.pick,
            query: '',
            sharedSearchState: store.state.search,
            conversationItemComponent: markRaw(ConversationPickItem),
        }
    },
    methods: {
        onConversationItemClick(conversation) {
            store.pickOrUnpickConversation(conversation, true)
        },
        unpConversation(conversation) {
            store.pickOrUnpickConversation(conversation, false);
        },

        conversationKey(conversationInfo) {
            return conversationInfo.id;
        },

        showForwardByCreateConversationModal() {
            this.sharedPickState.conversations.length = 0;
            this.$modal.hide('forward-by-pick-conversation-modal',
                {
                    toCreateConversation: true,
                    forwardType: this.forwardType,
                    messages: this.messages
                })
        },

        cancel() {
            this.sharedPickState.conversations.length = 0
            this.$modal.hide('forward-by-pick-conversation-modal', {confirm: false})
        },

        confirm() {
            let pickedConversations = [...this.sharedPickState.conversations];
            this.sharedPickState.conversations.length = 0
            this.$modal.hide('forward-by-pick-conversation-modal',
                {
                    confirm: true,
                    conversations: pickedConversations,
                    forwardType: this.forwardType,
                    messages: this.messages,
                    extraMessageText: this.$refs['forwardMessageView'].extraMessageText,
                })
        },
    },

    computed: {
        conversationInfos() {
            let infos;
            if (this.query && this.query.trim()) {
                infos = store.filterConversation(this.query)
            } else {
                infos = this.sharedConversation.conversationInfoList;
            }
            // Add id to each item for virtual-list
            return infos.map((info, index) => ({
                ...info,
                id: `${info.conversation.type}_${info.conversation.target}_${info.conversation.line}_${index}`
            }));
        }
    },

    components: {
        ForwardMessageView
    },
}
</script>

<style lang="css" scoped>
.pick-conversation-container {
    display: flex;
    height: 100%;
    width: 100%;
}

.conversation-list-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    background-color: var(--background-item-normal);
    overflow: hidden;
}

.conversation-list-panel .input-container {
    display: flex;
    width: 100%;
}

.conversation-list-panel .input-container input {
    height: 25px;
    margin: 15px 20px 0 15px;
    flex: 1;
    border-radius: 3px;
    border: 1px solid var(--border-tertiary);
    background-color: var(--background-primary);
    padding-left: 10px;
    text-align: left;
}

.conversation-list-panel .create-group {
    background-color: var(--background-item-normal);
    height: 40px;
    font-size: 13px;
    padding-left: 15px;
    display: flex;
    align-items: center;
}

.conversation-list-panel .create-group:active {
    background-color: var(--border-primary);
}

.conversation-list-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.conversation-list-container > p {
    background-color: var(--background-item-normal);
    font-size: 12px;
    color: var(--text-hint);
    padding-left: 15px;
    padding-top: 8px;
    padding-bottom: 8px;
    flex-shrink: 0;
}

.checked-conversation-list-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    background-color: var(--background-primary);
}

.checked-conversation-list-container header {
    height: 55px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.checked-conversation-list-container header h2 {
    font-size: 16px;
    font-weight: normal;
    margin-left: 30px;
}

.checked-conversation-list-container header span {
    font-size: 12px;
    margin-right: 20px;
}


.checked-conversation-list-container .content {
    height: 100%;
    flex: 1;
    display: flex;
    padding: 0 30px;
    flex-wrap: wrap;
    justify-content: flex-start;
    align-items: flex-start;
    align-content: flex-start;
    overflow: auto;
}

.checked-conversation-list-container .content .picked-user-container {
    width: 33%;
    display: flex;
    flex-direction: column;
    column-count: 1;
    justify-content: center;
    align-items: center;
    padding: 5px 10px;
    overflow: hidden;
}

.checked-conversation-list-container .content .picked-user-container .name {
    text-align: center;
    max-width: 80px;
    font-size: 12px;
}

.checked-conversation-list-container .content .picked-user-container .picked-user {
    position: relative;
    height: 65px;
    width: 65px;
}

.checked-conversation-list-container .content .avatar {
    width: 45px;
    height: 45px;
    margin: 10px 10px;
    display: inline-block;
    background: var(--background-item-placeholder);
    border-radius: 3px;
}

.checked-conversation-list-container .content .unpick-button {
    position: absolute;
    width: 20px;
    height: 20px;
    border: 1px solid var(--border-primary);
    border-radius: 10px;
    top: 0;
    right: 0;
}

.checked-conversation-list-container .content .unpick-button:active {
    background-color: var(--border-primary);
}

.checked-conversation-list-container footer {
    height: 55px;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    margin-bottom: 10px;
}

.checked-conversation-list-container footer button {
    padding: 5px 30px;
    border-radius: 4px;
    border: 1px solid var(--border-primary);
}

.checked-conversation-list-container footer button.confirm {
    background-color: var(--accent-color);
    margin-left: 20px;
    color: var(--text-on-accent);
    margin-right: 20px;
}

.checked-conversation-list-container label {
    width: 100%;
    padding: 5px 10px;
    height: 30px;
}


</style>
