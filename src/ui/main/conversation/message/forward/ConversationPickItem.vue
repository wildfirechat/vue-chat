<template>
    <div class="conversation-item"
         @click.stop="onConversationItemClick(source.conversation)">
        <input class="checkbox" v-bind:value="source.conversation" type="checkbox"
               v-model="pickedConversations" placeholder="">
        <div class="header">
            <img class="avatar" :src="portrait" alt=""/>
        </div>
        <p class="title single-line">{{ source.conversation._target._displayName }}</p>
    </div>
</template>

<script>
import store from "../../../../../store";
import ConversationType from '../../../../../wfc/model/conversationType';
import wfc from '../../../../../wfc/client/wfc';

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
        },
        portrait() {
            let info = this.source;
            if (info.conversation.type === ConversationType.Group) {
                if (info.conversation._target.portrait) {
                    return info.conversation._target.portrait;
                } else {
                    let dp = wfc.defaultGroupPortrait(info.conversation._target);
                    info.conversation._target.portrait = dp;
                    return dp;
                }
            } else {
                return info.conversation._target.portrait;
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
    height: 56px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    padding-left: 16px;
}

.conversation-item:hover {
    background-color: var(--background-item-hover);
}

.conversation-item:active {
    background-color: var(--background-item-placeholder);
}

.conversation-item .header {
    height: 100%;
    padding: 8px 12px 8px 12px;
}

.conversation-item .header .avatar {
    position: relative;
    display: inline-block;
    top: 50%;
    background: var(--background-item-placeholder);
    transform: translateY(-50%);
}

.conversation-item .title {
    font-size: var(--font-size-base);
    color: var(--text-primary);
    font-style: normal;
    font-weight: normal;
    padding-right: 8px;
}

.checkbox {
    margin-right: 0;
}
</style>
