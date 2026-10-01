<template>
    <div class="pan-mask" @click.self="$emit('cancel')">
        <div class="pan-dialog">
            <div class="pan-dialog-title">{{ title }}</div>
            <input
                ref="input"
                v-model="value"
                class="pan-input"
                type="text"
                :placeholder="hint"
                @keyup.enter="submit"/>
            <div class="pan-dialog-actions">
                <button class="pan-btn" @click="$emit('cancel')">{{ $t('pan.cancel') }}</button>
                <button class="pan-btn primary" :disabled="!value.trim()" @click="submit">{{ $t('pan.confirm') }}</button>
            </div>
        </div>
    </div>
</template>

<script>
/**
 * 网盘里要起名的地方都用它：新建文件夹、重命名、新建文档。
 * 改名时只选中扩展名前面那段，直接打字就把名字换了、扩展名还在。
 */
export default {
    name: 'PanNameDialog',
    props: {
        title: {
            type: String,
            default: '',
        },
        hint: {
            type: String,
            default: '',
        },
        initial: {
            type: String,
            default: '',
        },
    },
    data() {
        return {
            value: this.initial,
        };
    },
    mounted() {
        this.$nextTick(() => {
            const input = this.$refs.input;
            if (!input) {
                return;
            }
            input.focus();
            const dot = this.value.lastIndexOf('.');
            const end = dot > 0 ? dot : this.value.length;
            try {
                input.setSelectionRange(0, end);
            } catch (e) {
                // 某些输入类型不支持选择范围，忽略
            }
        });
    },
    methods: {
        submit() {
            const name = this.value.trim();
            if (!name) {
                return;
            }
            this.$emit('confirm', name);
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
    background: var(--background-modal);
    border-radius: var(--radius-lg);
    padding: 20px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.24);
}

.pan-dialog-title {
    font-size: var(--font-size-lg);
    color: var(--text-primary);
    font-weight: 600;
    margin-bottom: 14px;
}

.pan-input {
    width: 100%;
    box-sizing: border-box;
    height: 36px;
    padding: 0 10px;
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-sm);
    background: var(--background-input);
    color: var(--text-primary);
    font-size: var(--font-size-base);
    outline: none;
}

.pan-input:focus {
    border-color: var(--accent-color);
}

.pan-dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 18px;
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
