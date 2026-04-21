<template>
    <div class="conversation-item"
         @click.stop="onConversationItemClick(source.conversation)">
        <input class="checkbox" v-bind:value="source.conversation" type="checkbox"
               v-model="pickedConversations" placeholder="">
        <div class="header">
            <img class="avatar" :src="source.conversation._target.portrait" alt=""/>
        </div>
        <p class="title single-line">{{ source.conversation._target._displayName }}</p>
    </div>
</template>

<script>
import store from "../../../../../store";

export default {
    name: "ConversationPickItem",
    inject: {
        conversationActiveStore: {
            default: null,
        },
    },
    props: {
        source: {
            type: Object,
            required: true
        },
    },
    computed: {
        activeStore() {
            return this.conversationActiveStore || store;
        },

        pickedConversations: {
            get() {
                return this.activeStore.state.pick.conversations;
            },
            set(value) {
                // 更新选择状态
                this.activeStore.state.pick.conversations = value;
            }
        }
    },
    methods: {
        onConversationItemClick(conversation) {
            this.activeStore.pickOrUnpickConversation(conversation, true)
        },
    }
}
</script>

<style lang="css" scoped>
.conversation-item {
    width: 100%;
    height: 60px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    padding-left: 15px;
}

.conversation-item:hover {
    background-color: var(--background-item-hover);
}

.conversation-item:active {
    background-color: var(--background-item-placeholder);
}

.conversation-item .header {
    height: 100%;
    padding: 10px 12px 10px 15px;
}

.conversation-item .header .avatar {
    position: relative;
    width: 45px;
    height: 45px;
    display: inline-block;
    top: 50%;
    background: var(--background-item-placeholder);
    transform: translateY(-50%);
    border-radius: 3px;
}

.conversation-item .title {
    font-size: 14px;
    color: var(--text-primary);
    font-style: normal;
    font-weight: normal;
    padding-right: 10px;
}

.checkbox {
    margin-right: 0;
}
</style>
