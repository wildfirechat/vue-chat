<template>
    <div v-if="visible" class="sub-window-mask">
        <div class="sub-window-panel">
            <div class="sub-window-close" @click="close">
                <i class="icon-ion-close"></i>
            </div>
            <component
                v-if="activeEntry"
                :is="activeEntry.component"
                :key="activeEntry.id"
                :sub-window-query="activeEntry.query"
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
            }
        };
    },
    computed: {
        activeEntry() {
            return this.stack.length > 0 ? this.stack[this.stack.length - 1] : null;
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
    background: rgba(0, 0, 0, 0.3);
    z-index: 9998;
    display: flex;
    justify-content: flex-end;
}

.sub-window-panel {
    width: min(480px, 100vw);
    height: 100%;
    background: #f5f6f7;
    position: relative;
    box-shadow: -2px 0 12px rgba(0, 0, 0, 0.18);
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
    font-size: 16px;
    color: #888;
}

.sub-window-close i:hover {
    color: #1f64e4;
}
</style>
