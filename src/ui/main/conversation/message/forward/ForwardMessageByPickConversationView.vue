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
    inject: {
        conversationActiveStore: {
            default: null,
        },
    },
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
        const activeStore = this.conversationActiveStore || store;
        return {
            activeStore: activeStore,
            sharedConversation: activeStore.state.conversation,
            sharedPickState: activeStore.state.pick,
            query: '',
            sharedSearchState: activeStore.state.search,
            conversationItemComponent: markRaw(ConversationPickItem),
        }
    },
    methods: {
        onConversationItemClick(conversation) {
            this.activeStore.pickOrUnpickConversation(conversation, true)
        },
        unpConversation(conversation) {
            this.activeStore.pickOrUnpickConversation(conversation, false);
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
                infos = this.activeStore.filterConversation(this.query)
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
    margin: 16px 20px 0 16px;
    flex: 1;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-tertiary);
    background-color: var(--background-primary);
    padding-left: 8px;
    text-align: left;
    outline: none;
    color: var(--text-primary);
    font-size: var(--font-size-sm);
    transition: border-color var(--duration-fast);
}

.conversation-list-panel .input-container input::placeholder {
    color: var(--text-hint);
}

.conversation-list-panel .input-container input:focus {
    border-color: var(--accent-color);
}

.conversation-list-panel .create-group {
    background-color: var(--background-item-normal);
    height: 40px;
    font-size: var(--font-size-sm);
    padding-left: 16px;
    display: flex;
    align-items: center;
    transition: background var(--duration-fast);
}

.conversation-list-panel .create-group:hover {
    background-color: var(--background-item-hover);
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
    font-size: var(--font-size-xs);
    color: var(--text-hint);
    padding-left: 16px;
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
    flex-shrink: 0;
    border-bottom: 1px solid var(--border-primary);
}

.checked-conversation-list-container header h2 {
    font-size: var(--font-size-lg);
    font-weight: 500;
    color: var(--text-primary);
    margin-left: 30px;
}

.checked-conversation-list-container header span {
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
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
    padding: 4px 8px;
    overflow: hidden;
}

.checked-conversation-list-container .content .picked-user-container .name {
    text-align: center;
    max-width: 80px;
    font-size: var(--font-size-xs);
}

.checked-conversation-list-container .content .picked-user-container .picked-user {
    position: relative;
    height: 65px;
    width: 65px;
}

.checked-conversation-list-container .content .avatar {
    width: 48px;
    height: 48px;
    margin: 8px 8px;
    display: inline-block;
    background: var(--background-item-placeholder);
    border-radius: var(--default-portrait-border-radius);
    object-fit: cover;
}

.checked-conversation-list-container .content .unpick-button {
    position: absolute;
    width: 20px;
    height: 20px;
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-sm);
    top: 0;
    right: 0;
    background: var(--background-secondary);
    color: var(--text-secondary);
    font-size: var(--font-size-xs);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background var(--duration-fast), color var(--duration-fast), border-color var(--duration-fast);
}

.checked-conversation-list-container .content .unpick-button:hover {
    background: var(--background-error-subtle);
    color: var(--text-danger);
    border-color: var(--text-danger);
}

.checked-conversation-list-container .content .unpick-button:active {
    background-color: var(--border-primary);
}

.checked-conversation-list-container footer {
    height: 55px;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    margin-bottom: 8px;
    flex-shrink: 0;
    border-top: 1px solid var(--border-primary);
}

.checked-conversation-list-container footer button {
    padding: 4px 30px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-primary);
    background: transparent;
    color: var(--text-primary);
    font-size: var(--font-size-sm);
    transition: background var(--duration-fast), color var(--duration-fast), border-color var(--duration-fast);
}

.checked-conversation-list-container footer button.cancel:hover {
    background: var(--background-item-hover);
}

.checked-conversation-list-container footer button.confirm {
    background-color: var(--accent-color);
    border-color: var(--accent-color);
    margin-left: 20px;
    color: var(--text-on-accent);
    margin-right: 20px;
}

.checked-conversation-list-container footer button.confirm:hover {
    background-color: var(--accent-color-active);
    border-color: var(--accent-color-active);
}

.checked-conversation-list-container label {
    width: 100%;
    padding: 4px 8px;
    height: 30px;
}


</style>
