<template>
    <section class="alert-content-container">
        <div v-if="showIcon" class="portrait-container">
            <img :src="require(`@/assets/images/icon.png`)" alt="">
        </div>
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
    box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);
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
    font-size: 14px;
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
    border: 1px solid #cccccc;
}

.action-container .confirm {
    background: #4168e0ef;
    color: white;
}

.action-container .cancel {
    color: black;
    background: white;
}

.action-container .cancel:active {
    background: lightgrey;
    color: black;
}

.action-container .confirm:active {
    background: #4168e0;
    color: white;
}

</style>
