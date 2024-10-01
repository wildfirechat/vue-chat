<template>
    <div class="notification-container">
        <p class="notification">{{ message.messageContent.digest(message) }}</p>
        <a v-if="isReeditable" href="#" @click.prevent="reedit">重新编辑</a>
    </div>
</template>

<script>

import Message from "../../../../wfc/messages/message";
import wfc from "../../../../wfc/client/wfc";
import MessageContentType from "../../../../wfc/messages/messageContentType";
import {numberValue} from "../../../../wfc/util/longUtil";
import Config from "../../../../config";

export default {
    name: "RecallNotificationMessageContentView",
    props: {
        message: {
            type: Message,
            required: true
        }
    },
    data() {
        return {
            checkReeditInterval: 0,
            isReeditable: false
        }
    },

    mounted() {
        this.checkReeditable()
    },
    unmounted() {
        this.checkReeditInterval && clearInterval(this.checkReeditInterval)
    },
    methods: {
        checkReeditable() {
            let delta = wfc.getServerDeltaTime();
            let now = new Date().getTime();
            let recallMessageContent = this.message.messageContent;
            if (recallMessageContent.originalContentType === MessageContentType.Text
                && recallMessageContent.fromSelf
                && now - (numberValue(this.message.timestamp) - delta) < Config.RECALL_REEDIT_TIME_LIMIT * 1000) {
                if (!this.checkReeditInterval) {
                    this.checkReeditInterval = setInterval(() => {
                        this.checkReeditable()
                    }, 100)
            }
                this.isReeditable = true
            } else {
                this.isReeditable = false
            }
        },
        reedit() {
            this.$parent.reedit(this.message);
        }
    },
    components: {}
}
</script>

<style lang="css" scoped>
.notification-container {
    display: flex;
    justify-content: center;
    align-items: center;
}

.notification-container .notification {
    color: #b8b8b8;
    margin: 20px 0;
    font-size: 12px;
}

.notification-container a {
    text-decoration: none;
    margin-left: 10px;
    font-size: 14px;
}

</style>
