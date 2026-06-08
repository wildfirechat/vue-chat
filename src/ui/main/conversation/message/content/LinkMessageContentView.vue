<template>
    <div class="link-message-container"
         @click="clickLink"
         v-bind:class="{out:message.direction === 0}">
        <div class="flex-column flex-align-start" style="display: block">
            <p class="title">{{ this.message.messageContent.title }}</p>
            <p class="desc">{{ this.message.messageContent.digest(this.message) }}</p>
        </div>
        <img :src="message.messageContent.thumbnailUrl" alt="">
    </div>
</template>

<script>
import Message from "../../../../../wfc/messages/message";
import {isElectron, shell} from "../../../../../platform";
import Config from "../../../../../config";

export default {
    name: "LinkMessageContentView",
    props: {
        message: {
            type: Message,
            required: true,
        }
    },

    methods: {
        clickLink() {
            let url = this.message.messageContent.url;
            if (Config.OPEN_LINK_POLICY === 2) {
                this.$notify({
                    title: '提示',
                    text: '禁止打开外部链接',
                    type: 'warn'
                });
                return;
            }
            if (Config.OPEN_LINK_POLICY === 1) {
                this.$alert({
                    showIcon: false,
                    content: '谨防钓鱼网站或者带毒网站，只有确认已知安全的链接才可以打开。请确实该链接是否是已知安全的？',
                    confirmText: '确认安全',
                    cancelText: '关闭',
                    confirmCallback: () => {
                        this._doOpenExternal(url);
                    },
                    cancelCallback: () => {
                        // do nothing
                    }
                });
                return;
            }
            this._doOpenExternal(url);
        },
        _doOpenExternal(url) {
            if (isElectron()) {
                shell.openExternal(url);
            } else {
                window.open(url);
            }
        }
    },

    computed: {}
}
</script>

<style lang="css" scoped>

.link-message-container {
    margin: 0 8px;
    padding: 8px;
    background-color: var(--background-primary);
    position: relative;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: flex-start;
    max-width: 500px;
    min-width: 150px;
}

.link-message-container img {
    width: 40px;
    height: 40px;
    margin-left: 8px;
    min-width: 40px;
    background: lightgray;
    border-radius: var(--radius-sm);
}

.link-message-container .title {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
}

.link-message-container .desc {
    color: var(--text-hint);
    font-size: var(--font-size-sm);
    -webkit-line-clamp: 3;
    line-height: 20px;
    max-height: 60px;
    overflow: hidden;
    display: inline-block;
    text-overflow: ellipsis;
}

.rightarrow:before {
    border-left-color: var(--text-on-accent);
}
</style>
