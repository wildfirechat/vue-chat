<template>
    <div class="conversation-item"
         @click.stop="onConversationItemClick(source.conversation)">
        <input class="checkbox" v-bind:value="source.conversation" type="checkbox"
               v-model="pickedConversations" placeholder="">
        <div class="header">
            <img class="avatar" :src="portrait" alt=""/>
        </div>
        <p class="title single-line">{{ conversationTitle }}</p>
    </div>
</template>

<script>
import store from "../../../../../store";
import ConversationType from '../../../../../wfc/model/conversationType';
import wfc from '../../../../../wfc/client/wfc';
import Config from '../../../../../config';

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
        // target（头像/名称）在展示时才按需解析，详见 store.ensureConversationTarget
        conversationTarget() {
            return this.activeStore.ensureConversationTarget(this.source.conversation);
        },
        conversationTitle() {
            let target = this.conversationTarget;
            return target ? target._displayName : '';
        },
        portrait() {
            let info = this.source;
            let target = this.conversationTarget;
            if (!target) {
                return info.conversation.type === ConversationType.Group ? Config.DEFAULT_GROUP_PORTRAIT_URL : Config.DEFAULT_PORTRAIT_URL;
            }
            if (info.conversation.type === ConversationType.Group) {
                if (target.portrait) {
                    return target.portrait;
                } else {
                    let dp = wfc.defaultGroupPortrait(target);
                    target.portrait = dp;
                    return dp;
                }
            } else {
                return target.portrait;
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
