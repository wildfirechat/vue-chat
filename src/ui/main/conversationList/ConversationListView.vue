<template>
    <section class="conversation-list">
        <div class="conversation-filter-tabs" v-if="sharedMiscState.enableConversationListFilter"
             :style="{backgroundColor: headerBgColor, borderBottom : headerBorderBottom}">
            <a v-for="tab in filterTabs" :key="tab.value"
               class="filter-tab" :class="{active: currentFilter === tab.value}"
               @click="switchFilter(tab.value)">{{ $t(tab.label) }}{{ tabCount(tab.value) > 0 ? ` (${tabCount(tab.value)})` : '' }}</a>
        </div>
        <div v-if="showFilterEmptyHint" class="filter-empty-hint">
            <span>{{ filterEmptyHintText }}</span>
        </div>
        <virtual-list v-else :data-component="conversationItemView" :data-sources="conversationInfoList" :data-key="conversationInfoKey"
                      ref="virtualList"
                      :onScroll="onScroll"
                      :estimate-size="30"
                      class="conversation-virtual-list"
                      style="overflow-y: auto;"/>

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
            <li>
                <a class="danger-action" @click.prevent="removeConversation(conversationInfo)">{{ $t('common.delete') }}</a>
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
            currentFilter: 'all',
            // 进入未读/@我分组时冻结的会话 key 快照，保证清除未读数后会话仍保留在列表，
            // 切换分组时才刷新。null 表示不过滤（全部分组或功能关闭）
            filterKeys: null,
            filterTabs: [
                {value: 'all', label: 'conversation.filter_all'},
                {value: 'unread', label: 'conversation.filter_unread'},
                {value: 'mention', label: 'conversation.filter_mention'},
            ],
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
            this.$alert({
                title: '删除会话?',
                content: '删除会话后，聊天记录也将被清空',
                confirmText: '确定',
                confirmButtonType: 'danger',
                cancelText: '取消',
                cancelCallback: () => {
                    // do nothing
                },
                confirmCallback: () => {
                    store.removeConversation(conversationInfo.conversation);
                }
            })
        },

        conversationInfoKey(conversationInfo) {
            let conv = conversationInfo.conversation;
            return conv.target + '-' + conv.type + '-' + conv.line;
        },

        // 某个会话是否匹配指定分组
        matchFilter(conversationInfo, filter) {
            if (filter === 'unread') {
                return conversationInfo._unread > 0;
            }
            if (filter === 'mention') {
                let uc = conversationInfo.unreadCount;
                return !!uc && (uc.unreadMention > 0 || uc.unreadMentionAll > 0);
            }
            return true;
        },

        // 切换分组：重新计算分组快照；若当前会话不在分组内，则清空会话界面
        switchFilter(filter) {
            this.currentFilter = filter;
            if (filter === 'all') {
                this.filterKeys = null;
                return;
            }
            let keys = new Set();
            this.baseConversationInfoList.forEach(ci => {
                if (this.matchFilter(ci, filter)) {
                    keys.add(this.conversationInfoKey(ci));
                }
            });
            this.filterKeys = keys;

            let current = this.sharedConversationState.currentConversationInfo;
            if (current && !keys.has(this.conversationInfoKey(current))) {
                store.setCurrentConversation(null);
            }
            this.$nextTick(() => this.updateHeaderPinned());
        },

        // 分组标签后展示的会话数：当前激活分组取已显示列表长度（与快照一致），其余分组取实时匹配数
        tabCount(filter) {
            if (filter === 'all') {
                return 0;
            }
            if (filter === this.currentFilter && this.filterKeys) {
                return this.conversationInfoList.length;
            }
            return this.baseConversationInfoList.filter(ci => this.matchFilter(ci, filter)).length;
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
            this.updateHeaderPinned();
        },

        // 顶部搜索栏/分组栏背景跟随：判断列表最上方可见项是否为置顶会话
        // 置顶会话恒排在列表最前；滚动到其下方的普通会话时切换为普通背景
        updateHeaderPinned() {
            let list = this.conversationInfoList;
            let pinnedCount = 0;
            for (let i = 0; i < list.length; i++) {
                if (list[i].top > 0) {
                    pinnedCount++;
                } else {
                    break;
                }
            }
            if (pinnedCount === 0) {
                this.sharedConversationState.conversationListHeaderPinned = false;
                return;
            }
            let scroller = this.$refs.virtualList && this.$refs.virtualList.$el;
            let scrollTop = scroller ? scroller.scrollTop : 0;
            let itemHeight = this.measureItemHeight(scroller);
            // 最上方可见项索引；若该项仍处于置顶区间，则使用置顶背景
            let topIndex = itemHeight > 0 ? Math.floor(scrollTop / itemHeight) : 0;
            this.sharedConversationState.conversationListHeaderPinned = topIndex < pinnedCount;
        },

        measureItemHeight(scroller) {
            let el = scroller && scroller.querySelector('.conversation-item-container');
            return el ? el.offsetHeight : 0;
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
    mounted() {
        this.$nextTick(() => this.updateHeaderPinned());
    },
    activated() {
        this.scrollActiveElementCenter();
        this.$nextTick(() => this.updateHeaderPinned());
    },
    watch: {
        // 处于未读/@我分组时，新收到消息使会话命中分组，将其加入快照使其在被读后依然保留
        filterMatchFingerprint() {
            if (!this.filterKeys || this.currentFilter === 'all') {
                return;
            }
            this.baseConversationInfoList.forEach(ci => {
                if (this.matchFilter(ci, this.currentFilter)) {
                    this.filterKeys.add(this.conversationInfoKey(ci));
                }
            });
        },
        // 列表内容变化（置顶增删、排序、过滤）时，刷新顶部背景跟随状态
        conversationInfoList() {
            this.$nextTick(() => this.updateHeaderPinned());
        }
    },
    computed: {
        // 排除独立窗口会话后的完整列表
        baseConversationInfoList() {
            return this.sharedConversationState.conversationInfoList.filter(ci => {
                const index = this.sharedConversationState.floatingConversations.findIndex(c => c.equal(ci.conversation));
                return index === -1;
            })
        },
        conversationInfoList() {
            let list = this.baseConversationInfoList;
            if (!this.sharedMiscState.enableConversationListFilter || this.currentFilter === 'all' || !this.filterKeys) {
                return list;
            }
            // 显示：快照内的会话（已读后仍保留）+ 当前实时命中分组的会话（新收到的未读/@我会话即时出现）
            // 新命中的会话会通过 watch 加入快照，从而在被读后依然保留，直至下次切换分组
            return list.filter(ci => this.filterKeys.has(this.conversationInfoKey(ci)) || this.matchFilter(ci, this.currentFilter));
        },
        // 当前实时命中分组的会话 key 指纹，用于监听未读/@我变化（即使会话未重排也能触发）
        filterMatchFingerprint() {
            if (!this.sharedMiscState.enableConversationListFilter || this.currentFilter === 'all') {
                return '';
            }
            return this.baseConversationInfoList
                .filter(ci => this.matchFilter(ci, this.currentFilter))
                .map(ci => this.conversationInfoKey(ci))
                .join(',');
        },
        showFilterEmptyHint() {
            return this.sharedMiscState.enableConversationListFilter
                && this.currentFilter !== 'all'
                && this.conversationInfoList.length === 0;
        },
        filterEmptyHintText() {
            if (this.currentFilter === 'mention') {
                return this.$t('conversation.filter_mention_empty');
            }
            return this.$t('conversation.filter_unread_empty');
        },
        // 分组栏背景：跟随最上方可见项是置顶/普通会话切换
        headerBgColor() {
            return this.sharedConversationState.conversationListHeaderPinned
                ? 'var(--background-item-top)'
                : 'var(--background-item-normal)';
        },
        headerBorderBottom() {
            return '1px solid ' + (this.sharedConversationState.conversationListHeaderPinned ? 'var(--border-strong)' : 'var(--border-separator)');
        }
    },

    components: {ConversationItemView},
};
</script>

<style lang="css" scoped>

.conversation-list {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.conversation-virtual-list {
    flex: 1;
    min-height: 0;
}

.filter-empty-hint {
    flex: 1;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 20px;
    text-align: center;
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
}

.conversation-filter-tabs {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-bottom: 1px solid var(--border-separator);
}

.filter-tab {
    padding: 3px 12px;
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
    border-radius: var(--radius-md);
    cursor: pointer;
    user-select: none;
    transition: background-color var(--duration-fast) ease, color var(--duration-fast) ease;
}

.filter-tab:hover {
    background-color: var(--background-item-hover);
}

.filter-tab.active {
    background-color: var(--background-selected-alt);
    color: var(--accent-color);
    font-weight: 600;
}

</style>
