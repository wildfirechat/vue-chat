<template>
    <section class="alert-content-container">
        <div v-if="showIcon" class="portrait-container">
            <img :src="require(`@/assets/images/icon.png`)" alt="">
        </div>
        <h2 v-if="title" class="title">{{ this.title }}</h2>
        <p v-if="content" class="content">{{ this.content }}</p>
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
    height: 100%;
    justify-content: center;
    align-items: center;
    box-shadow: 0 4px 8px 0 var(--background-mask), 0 6px 20px 0 var(--background-mask);
}

.portrait-container {
    width: 60px;
    height: 60px;
    margin: 10px 0;
}

.portrait-container > img {
    width: 100%;
    height: 100%;
}

.title {
    font-size: 15px;
    text-align: center;
    padding-top: 10px;
}

.content {
    font-size: 12px;
    padding: 10px;
    flex: 1;
}

.action-container {
    display: flex;
    width: 100%;
    height: 40px;
    margin-bottom: 20px;
    flex-direction: row-reverse;
    justify-content: space-around;
    align-items: center;
}

.action-container button {
    flex: 1;
    border-radius: 4px;
    padding: 5px 0;
    margin: 0 15px;
    border: 1px solid var(--border-primary);
    transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.action-container .confirm.primary {
    background: var(--button-primary-bg);
    color: var(--button-primary-text);
    border-color: var(--button-primary-bg);
}

.action-container .confirm.primary:hover {
    background: var(--button-primary-hover);
    border-color: var(--button-primary-hover);
}

.action-container .confirm.danger {
    background: var(--button-danger-bg);
    color: var(--button-danger-text);
    border-color: var(--button-danger-bg);
}

.action-container .confirm.danger:hover {
    background: var(--button-danger-hover);
    border-color: var(--button-danger-hover);
}

.action-container .cancel {
    color: var(--button-default-text);
    background: var(--button-default-bg);
    border-color: var(--button-default-border);
}

.action-container .cancel:hover {
    background: var(--button-default-hover);
}

.action-container .cancel:active {
    background: var(--button-default-hover);
    color: var(--button-default-text);
}

.action-container .confirm:active {
    opacity: 0.9;
}

</style>
