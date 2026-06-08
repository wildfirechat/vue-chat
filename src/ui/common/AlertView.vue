<template>
    <section class="alert-content-container">
        <div v-if="showIcon" class="portrait-container">
            <img :src="require(`@/assets/images/icon.png`)" alt="">
        </div>
        <h2 v-if="title" class="title">{{ this.title }}</h2>
        <p v-if="content" :class="['content', {alone: !title}]">{{ this.content }}</p>
        <div class="action-container">
            <button :class="['confirm', confirmButtonType]" @click="confirm">{{ this.confirmText }}</button>
            <button class="cancel" @click="cancel">{{ this.cancelText }}</button>
        </div>
    </section>
</template>

<script>
export default {
    name: "AlertView",
    props: {
        name: {
            type: String,
            required: true,
            default: '',
        },
        showIcon: {
            type: Boolean,
            required: false,
            default: true,
        },
        title: {
            type: String,
            required: false,
            default: '',
        },
        content: {
            type: String,
            required: false,
            default: '',
        },
        cancelText: {
            type: String,
            required: false,
            default: '取消',
        },
        confirmText: {
            type: String,
            required: false,
            default: '确定',
        },
        confirmButtonType: {
            type: String,
            required: false,
            default: 'primary',
        },

        cancelCallback: {
            type: Function,
            required: false,
        },
        confirmCallback: {
            type: Function,
            required: false,
        }
    },
    methods: {
        cancel() {
            this.$modal.hide(this.name, {cancel: true})
        },

        confirm() {
            this.$modal.hide(this.name, {confirm: true})
        },
    }
}
</script>

<style scoped>
.alert-content-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    padding: 20px 20px 16px;
    background-color: var(--background-modal);
    box-sizing: border-box;
}

.portrait-container {
    width: 56px;
    height: 56px;
    margin: 0 auto 12px;
}

.portrait-container > img {
    width: 100%;
    height: 100%;
}

.title {
    font-size: var(--font-size-lg);
    font-weight: 600;
    text-align: center;
    color: var(--text-primary);
    margin-bottom: 8px;
}

.content {
    font-size: var(--font-size-sm);
    line-height: 1.6;
    color: var(--text-secondary);
    word-break: break-word;
    max-height: 180px;
    overflow-y: auto;
    margin-bottom: 20px;
}

.content.alone {
    font-size: var(--font-size-sm);
    color: var(--text-primary);
    text-align: center;
}

.action-container {
    display: flex;
    gap: 8px;
    flex-direction: row-reverse;
}

.action-container button {
    flex: 1;
    height: 34px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-primary);
    font-size: var(--font-size-sm);
    font-weight: 500;
    transition: background-color var(--duration-fast) ease,
                border-color var(--duration-fast) ease,
                box-shadow var(--duration-fast) ease;
}

.action-container .confirm.primary {
    background: var(--button-primary-bg);
    color: var(--button-primary-text);
    border-color: var(--button-primary-bg);
}

.action-container .confirm.primary:hover {
    background: var(--button-primary-hover);
    border-color: var(--button-primary-hover);
    box-shadow: var(--shadow-accent);
}

.action-container .confirm.danger {
    background: var(--button-danger-bg);
    color: var(--button-danger-text);
    border-color: var(--button-danger-bg);
}

.action-container .confirm.danger:hover {
    background: var(--button-danger-hover);
    border-color: var(--button-danger-hover);
    box-shadow: 0 2px 8px rgba(249, 85, 105, 0.35);
}

.action-container .cancel {
    color: var(--text-primary);
    background: var(--background-input);
    border-color: var(--border-primary);
}

.action-container .cancel:hover {
    background: var(--background-item-active);
    border-color: var(--border-strong);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.action-container button:active {
    opacity: 0.85;
    box-shadow: none;
}
</style>
