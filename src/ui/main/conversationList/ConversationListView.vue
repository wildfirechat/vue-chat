<template>
    <section class="conversation-list">
        <virtual-list v-if="true" :data-component="conversationItemView" :data-sources="conversationInfoList" :data-key="conversationInfoKey"
                      ref="virtualList"
                      :onScroll="onScroll"
                      :estimate-size="30"
                      style="height: 100%; overflow-y: auto;"/>

        <div v-else style="height: 100%; overflow-y: auto;">
            <ConversationItemView v-for="conversationInfo in conversationInfoList" :source="conversationInfo" :key="conversationInfoKey(conversationInfo)"/>
        </div>
        <vue-context ref="menu" v-slot="{data:conversationInfo}" v-on:close="onConversationItemContextMenuClose">
            <li>
                <a @click.prevent="setConversationTop(conversationInfo)">{{
                        conversationInfo && conversationInfo.top ? $t('conversation.cancel_sticky_top') : $t('conversation.sticky_top')
                    }}</a>
            </li>
            <li v-if="sharedMiscState.isElectron">
                <a @click.prevent="showConversationFloatPage(conversationInfo.conversation)">{{
                        $t('conversation.show_in_float_window')
                    }}</a>
            </li>
            <li>
                <a @click.prevent="setConversationSilent(conversationInfo)">{{
                        conversationInfo && conversationInfo.isSilent ? $t('conversation.enable_notification') : $t('conversation.disable_notification')
                    }}</a>
            </li>
            <li>
                <a @click.prevent="removeConversation(conversationInfo)">{{ $t('common.delete') }}</a>
            </li>
            <li v-show="conversationInfo
                && (!sharedConversationState.currentConversationInfo || !sharedConversationState.currentConversationInfo.conversation.equal(conversationInfo.conversation))
                && conversationInfo._unread === 0"
                @click.prevent="markConversationAsUnread(conversationInfo.conversation)">
                <a>{{ $t('conversation.mark_as_unread') }}</a>
            </li>
            <li v-show="conversationInfo
                && (!sharedConversationState.currentConversationInfo || !sharedConversationState.currentConversationInfo.conversation.equal(conversationInfo.conversation))
                && conversationInfo._unread > 0"
                @click.prevent="clearConversationUnreadStatus(conversationInfo.conversation)">
                <a>{{ $t('conversation.mark_as_read') }}</a>
            </li>
        </vue-context>
    </section>
</template>

<script>

import ConversationItemView from "./ConversationItemView.vue";
import store from "../../../store";
import wfc from "../../../wfc/client/wfc";
import IpcEventType from "../../../ipcEventType";
import {ipcRenderer} from "../../../platform";
import {markRaw} from "vue";

export default {
    name: 'ConversationListView',
    data() {
        return {
            sharedConversationState: store.state.conversation,
            sharedMiscState: store.state.misc,
            conversationItemView: markRaw(ConversationItemView),
            currentConversationIndex: 0,
        };
    },

    created() {
        this.$eventBus.$on('showConversationContextMenu', ([event, conversationInfo]) => {
            this.showConversationItemContextMenu(event, conversationInfo);
        });
        this.$eventBus.$on('scrollToNextUnreadConversation', this.scrollToNextUnreadConversation);
    },

    unmounted() {
        this.$eventBus.$off('showConversationContextMenu');
        this.$eventBus.$off('scrollToNextUnreadConversation');
    },

    methods: {

        setConversationTop(conversationInfo) {
            store.setConversationTop(conversationInfo.conversation, conversationInfo.top > 0 ? 0 : 1);
        },

        setConversationSilent(conversationInfo) {
            store.setConversationSilent(conversationInfo.conversation, !conversationInfo.isSilent);
        },

        removeConversation(conversationInfo) {
            store.removeConversation(conversationInfo.conversation);
        },

        conversationInfoKey(conversationInfo) {
            let conv = conversationInfo.conversation;
            return conv.target + '-' + conv.type + '-' + conv.line;
        },
        scrollActiveElementCenter() {
            let el = this.$el.getElementsByClassName("active")[0];
            el && el.scrollIntoView({behavior: "instant", block: "center"});
        },

        showConversationItemContextMenu(event, conversationInfo) {
            if (!this.$refs.menu) {
                return;
            }
            this.sharedConversationState.contextMenuConversationInfo = conversationInfo;
            this.$refs.menu.open(event, conversationInfo)
        },

        onConversationItemContextMenuClose() {
            this.sharedConversationState.contextMenuConversationInfo = null;
        },

        clearConversationUnreadStatus(conversation) {
            wfc.clearConversationUnreadStatus(conversation);
        },

        markConversationAsUnread(conversation) {
            wfc.markConversationAsUnread(conversation, true);
        },

        showConversationFloatPage(conversation) {
            let hash = window.location.hash;
            let url = window.location.origin;
            if (hash) {
                url = window.location.href.replace(hash, '#/conversation-window');
            } else {
                url += "/conversation-window"
            }
            ipcRenderer.send(IpcEventType.showConversationFloatPage, {
                url: url,
                type: conversation.type,
                target: conversation.target,
                line: conversation.line,
            });

            store.addFloatingConversation(conversation);
            if (this.sharedConversationState.currentConversationInfo && this.sharedConversationState.currentConversationInfo.conversation.equal(conversation)) {
                store.setCurrentConversation(null);
            }
        },

        onScroll(e, params) {
            if (params) {
                this.currentConversationIndex = params.end
            }
        },

        // 滑动到下一个未读会话
        scrollToNextUnreadConversation() {
            let currentConversationIndex = this.currentConversationIndex
            let nextUnreadConversationIndex = this.conversationInfoList.findIndex((ci, index) => {
                if (index <= currentConversationIndex) {
                    return false;
                }
                return !ci.isSilent && ci._unread > 0
            });

            if (nextUnreadConversationIndex === -1 && currentConversationIndex > -1) {
                nextUnreadConversationIndex = this.conversationInfoList.findIndex((ci, index) => {
                    return !ci.isSilent && ci._unread > 0
                });
            }

            console.log('scrollToNextUnreadConversation', this.currentConversationIndex, nextUnreadConversationIndex, this.$refs['virtualList'].getOffset())
            if (nextUnreadConversationIndex > -1) {
                this.$refs['virtualList'].scrollToIndex(nextUnreadConversationIndex);
            }
        }
    },
    activated() {
        this.scrollActiveElementCenter();
    },
    computed: {
        conversationInfoList() {
            return this.sharedConversationState.conversationInfoList.filter(ci => {
                const index = this.sharedConversationState.floatingConversations.findIndex(c => c.equal(ci.conversation));
                return index === -1;
            })
        }
    },

    components: {ConversationItemView},
};
</script>

<style lang="css" scoped>

.conversation-list {
    height: 100%;
    overflow: auto;
}

</style>
