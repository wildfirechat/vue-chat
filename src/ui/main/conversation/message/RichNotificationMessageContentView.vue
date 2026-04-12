<template>
    <div style="display: flex; justify-content: center">
        <div class="notification-container" @click="onClickRichNotification">
            <p class="title">{{ message.messageContent.title }}</p>
            <p class="desc">{{ message.messageContent.desc }}</p>
            <div v-if="message.messageContent.datas">
                <div v-for="(data, index) in message.messageContent.datas" :key="index" class="data">
                    <p class="key single-line">{{ data.key }}</p>
                    <p class="value">{{ data.value }}</p>
                </div>
            </div>
            <div class="ex-info-container">
                <p class="exName">{{ message.messageContent.exName }}</p>
            </div>
        </div>
    </div>
</template>

<script>

import Message from "../../../../wfc/messages/message";
import {ipcRenderer, isElectron} from "../../../../platform";
import IpcEventType from "../../../../ipcEventType";

export default {
    name: "RichNotificationMessageContentView",
    props: {
        message: {
            type: Message,
            required: true
        }
    },
    methods: {
        onClickRichNotification() {
            console.log('onClickRichNotification');
            const targetUrl = this.message.messageContent.exUrl;
            if (isElectron()) {
                // Electron 环境：打开独立工作台窗口
                let hash = window.location.hash;
                let url = window.location.origin;
                if (hash) {
                    url = window.location.href.replace(hash, '#/workspace');
                } else {
                    url += "/workspace"
                }

                url += '?url=' + encodeURIComponent(targetUrl);


                ipcRenderer.send(IpcEventType.OPEN_H5_APP_WINDOW, {hostUrl: location.href, url: encodeURI(url)})
            } else {
                // Web 环境：在工作台中打开
                this.$router.push({
                    path: '/home/h-wp',
                    query: { url: targetUrl }
                });
            }
        }
    },
    components: {}
}
</script>

<style lang="css" scoped>
.notification-container {
    background-color: var(--background-primary);
    width: 400px;
    padding: 5px 10px;
    border-radius: 5px;
    margin: 5px 0;
}

.notification-container:active {
    background-color: lightgrey;
}

.notification-container .title {
    margin: 5px 0;
}

.desc {
    font-size: 14px;
}

.data {
    display: flex;
}

.data .key {
    width: 100px;
    font-size: 14px;
}

.data .value {
    flex: 1;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.ex-info-container {
    border-top: 1px solid var(--border-tertiary);
    padding-top: 5px;
    margin: 5px 0;
    font-size: 14px;
}

</style>
