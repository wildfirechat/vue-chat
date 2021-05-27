<template>
    <section class="alert-content-container">
        <h2 v-if="title" class="title">{{ this.title }}</h2>
        <p v-if="content" class="content">{{ this.content }}</p>
        <div class="action-container">
            <button class="confirm" @click="confirm">{{ this.confirmText }}</button>
            <button class="cancel" @click="cancel">{{ this.cancelText }}</button>
        </div>
    </section>
</template>

<script>
export default {
    name: "AlertView",
    props: {
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
            this.$modal.hide('alert-modal', {cancel: true})
        },

        confirm() {
            this.$modal.hide('alert-modal', {confirm: true})
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
}

.title {
    font-weight: normal;
    text-align: center;
    padding: 20px 30px 0 30px;
}

.content {
    padding: 20px 20px 20px 20px;
    flex: 1;
}

.action-container {
    display: flex;
    flex-direction: row-reverse;
    margin-right: 20px;
    margin-bottom: 20px;
}

.action-container button {
    padding: 5px 30px;
    border-radius: 4px;
    border: 1px solid #cccccc;
}

.action-container .cancel {
    margin-right: 20px;
    color: lightgrey;
}

.action-container .cancel:active {
    background: lightgrey;
    color: white;
}

.action-container .confirm:active {
    background: lightgrey;
    color: white;
}

</style>
