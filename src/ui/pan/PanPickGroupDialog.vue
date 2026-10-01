<template>
    <div class="pan-mask" @click.self="$emit('cancel')">
        <div class="pan-dialog">
            <div class="pan-dialog-title">{{ $t('pan.choose_group') }}</div>
            <div v-if="groups.length === 0" class="pan-dialog-empty">{{ $t('pan.no_groups') }}</div>
            <div v-else class="pan-group-list">
                <label v-for="group in groups" :key="group.gid" class="pan-group-row">
                    <input type="checkbox" :value="group.gid" v-model="checked"/>
                    <span class="pan-group-name">{{ group.name }}</span>
                </label>
            </div>
            <div class="pan-dialog-actions">
                <button class="pan-btn" @click="$emit('cancel')">{{ $t('pan.cancel') }}</button>
                <button class="pan-btn primary" :disabled="checked.length === 0" @click="submit">{{ $t('pan.confirm') }}</button>
            </div>
        </div>
    </div>
</template>

<script>
/**
 * 选群：网页端没有原生的群选择器，这里用「我加入的群」列表代替。
 * 选中的群按 [{gid, name}] 交给调用方（分享给群、文档页的 chooseGroup）。
 */
export default {
    name: 'PanPickGroupDialog',
    props: {
        groups: {
            type: Array,
            default: () => [],
        },
    },
    data() {
        return {
            checked: [],
        };
    },
    methods: {
        submit() {
            const selected = this.groups.filter((g) => this.checked.indexOf(g.gid) >= 0);
            this.$emit('confirm', selected);
        },
    },
};
</script>

<style scoped>
.pan-mask {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--background-overlay);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 3000;
}

.pan-dialog {
    width: 360px;
    max-width: calc(100vw - 48px);
    max-height: 70vh;
    display: flex;
    flex-direction: column;
    background: var(--background-modal);
    border-radius: var(--radius-lg);
    padding: 20px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.24);
}

.pan-dialog-title {
    font-size: var(--font-size-lg);
    color: var(--text-primary);
    font-weight: 600;
    margin-bottom: 12px;
}

.pan-dialog-empty {
    color: var(--text-hint);
    font-size: var(--font-size-sm);
    padding: 16px 0;
    text-align: center;
}

.pan-group-list {
    flex: 1;
    overflow-y: auto;
    min-height: 80px;
}

.pan-group-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 4px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    color: var(--text-primary);
    font-size: var(--font-size-base);
}

.pan-group-row:hover {
    background: var(--background-item-hover);
}

.pan-dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 16px;
}

.pan-btn {
    height: 32px;
    padding: 0 16px;
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-primary);
    font-size: var(--font-size-base);
    cursor: pointer;
}

.pan-btn:hover {
    background: var(--background-item-hover);
}

.pan-btn.primary {
    background: var(--accent-color);
    border-color: var(--accent-color);
    color: var(--text-on-accent);
}

.pan-btn.primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
</style>
