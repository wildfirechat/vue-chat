<template>
    <div v-if="visible" class="sub-window-mask" :class="{centered: isCentered}">
        <div class="sub-window-panel" :class="{centered: isCentered}">
            <div class="sub-window-close" @click="close">
                <i class="icon-ion-close"></i>
            </div>
            <!--
                渲染整个栈，非栈顶用 v-show 隐藏而不是卸载：
                压栈打开子页（会话内搜索 → 消息上下文、发起投票 → 投票列表 → 投票详情）时，
                下层页面保持挂载，返回时关键词/筛选/结果等组件内状态天然保留，无需外部持久化。
                栈被 open()/close() 重建时，出栈页面照常卸载并执行各自的清理。
            -->
            <component
                v-for="entry in stack"
                v-show="entry.id === activeEntryId"
                :is="entry.component"
                :key="entry.id"
                :sub-window-query="entry.query"
            />
        </div>
    </div>
</template>

<script>
import PollHome from "../poll/PollHome.vue";
import PollCreate from "../poll/PollCreate.vue";
import PollList from "../poll/PollList.vue";
import PollDetail from "../poll/PollDetail.vue";
import CollectionCreate from "../collection/CollectionCreate.vue";
import CollectionDetail from "../collection/CollectionDetail.vue";
import ConversationMessageSearchPage from "./search/ConversationMessageSearchPage.vue";
import MessageContextPage from "./search/MessageContextPage.vue";

export default {
    name: "SubWindowHost",
    data() {
        return {
            visible: false,
            stack: [],
            registry: {
                '/poll': PollHome,
                '/poll/create': PollCreate,
                '/poll/list': PollList,
                '/poll/detail': PollDetail,
                '/collection/create': CollectionCreate,
                '/collection/detail': CollectionDetail,
                '/conversation-search': ConversationMessageSearchPage,
                '/message-context': MessageContextPage,
            },
            // 居中弹窗展示的路由（会话内搜索/消息上下文：屏幕中央弹窗，而非右侧滑出）
            centeredRoutes: ['/conversation-search', '/message-context'],
        };
    },
    computed: {
        activeEntry() {
            return this.stack.length > 0 ? this.stack[this.stack.length - 1] : null;
        },
        activeEntryId() {
            return this.activeEntry ? this.activeEntry.id : null;
        },
        isCentered() {
            return this.activeEntry && this.centeredRoutes.includes(this.activeEntry.route);
        }
    },
    methods: {
        normalizeQuery(query) {
            return {
                ...(query || {}),
                _inAppSubWindow: '1',
            };
        },
        resolveEntry(route, query) {
            const component = this.registry[route];
            if (!component) {
                return null;
            }
            return {
                id: `${route}-${Date.now()}-${Math.random()}`,
                route,
                component,
                query: this.normalizeQuery(query),
            };
        },
        open(payload = {}) {
            const entry = this.resolveEntry(payload.route, payload.query);
            if (!entry) {
                return;
            }
            this.stack = [entry];
            this.visible = true;
        },
        push(payload = {}) {
            const entry = this.resolveEntry(payload.route, payload.query);
            if (!entry) {
                return;
            }
            if (!this.visible || this.stack.length === 0) {
                this.open(payload);
                return;
            }
            this.stack.push(entry);
        },
        back() {
            if (!this.visible) {
                return;
            }
            if (this.stack.length > 1) {
                this.stack.pop();
            } else {
                this.close();
            }
        },
        close() {
            this.stack = [];
            this.visible = false;
        },
        onOpen(payload) {
            this.open(payload);
        },
        onPush(payload) {
            this.push(payload);
        },
        onBack() {
            this.back();
        },
        onClose() {
            this.close();
        },
    },
    mounted() {
        this.$eventBus.$on('sub-window-open', this.onOpen);
        this.$eventBus.$on('sub-window-push', this.onPush);
        this.$eventBus.$on('sub-window-back', this.onBack);
        this.$eventBus.$on('sub-window-close', this.onClose);
    },
    unmounted() {
        this.$eventBus.$off('sub-window-open', this.onOpen);
        this.$eventBus.$off('sub-window-push', this.onPush);
        this.$eventBus.$off('sub-window-back', this.onBack);
        this.$eventBus.$off('sub-window-close', this.onClose);
    }
}
</script>

<style scoped>
.sub-window-mask {
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    background: var(--background-overlay);
    z-index: 9998;
    display: flex;
    justify-content: flex-end;
}

/* 居中模式：屏幕中央弹窗 */
.sub-window-mask.centered {
    justify-content: center;
    align-items: center;
}

.sub-window-panel {
    width: min(480px, 100vw);
    height: 100%;
    background: var(--background-tertiary);
    position: relative;
    box-shadow: -2px 0 12px var(--background-mask);
}

/* 居中模式：屏幕中央弹窗 */
.sub-window-panel.centered {
    width: min(920px, 90vw);
    height: min(720px, 88vh);
    border-radius: var(--radius-lg, 12px);
    box-shadow: 0 8px 40px var(--background-mask, rgba(0, 0, 0, 0.35));
    overflow: hidden;
}

.sub-window-close {
    position: absolute;
    top: 10px;
    right: 12px;
    width: 24px;
    height: 24px;
    z-index: 10;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
}

.sub-window-close i {
    font-size: var(--font-size-lg);
    color: var(--text-hint);
}

.sub-window-close i:hover {
    color: var(--accent-color);
}
</style>
