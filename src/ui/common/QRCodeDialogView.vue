<template>
    <section class="qr-code-dialog-container">
        <h2 class="title">{{ title }}</h2>
        <div class="qr-code-container">
            <img v-if="qrCodeDataUri" :src="qrCodeDataUri" alt="">
        </div>
        <div class="action-container">
            <button class="cancel" @click="close">关闭</button>
            <button class="confirm" @click="share">分享</button>
        </div>
    </section>
</template>

<script>
import jrQRCode from 'jr-qrcode';
import ForwardType from "../main/conversation/message/forward/ForwardType";
import Message from "../../wfc/messages/message";
import ImageMessageContent from "../../wfc/messages/imageMessageContent";

export default {
    name: "QRCodeDialogView",
    props: {
        name: {
            type: String,
            required: false,
            default: 'qr-code-dialog-modal',
        },
        title: {
            type: String,
            required: false,
            default: '二维码',
        },
        // 二维码编码的内容
        content: {
            type: String,
            required: true,
        },
    },
    data() {
        return {
            qrCodeDataUri: '',
        }
    },
    mounted() {
        this.qrCodeDataUri = jrQRCode.getQrBase64(this.content, {width: 280, height: 280});
    },
    methods: {
        close() {
            this.$modal.hide(this.name);
        },

        share() {
            let message = new Message();
            message.messageContent = new ImageMessageContent(this.qrCodeDataUri, null, this.qrCodeDataUri.split(',')[1]);
            this.$forwardMessage({
                forwardType: ForwardType.NORMAL,
                messages: [message],
            });
        }
    }
}
</script>

<style scoped>
.qr-code-dialog-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    padding: 20px 20px 16px;
    background-color: var(--background-modal);
    box-sizing: border-box;
}

.title {
    font-size: var(--font-size-lg);
    font-weight: 600;
    text-align: center;
    color: var(--text-primary);
    margin-bottom: 16px;
}

.qr-code-container {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
}

.qr-code-container img {
    width: 240px;
    height: 240px;
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

.action-container .confirm {
    background: var(--button-primary-bg);
    color: var(--button-primary-text);
    border-color: var(--button-primary-bg);
}

.action-container .confirm:hover {
    background: var(--button-primary-hover);
    border-color: var(--button-primary-hover);
    box-shadow: var(--shadow-accent);
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
