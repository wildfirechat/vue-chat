<template>
    <div class="notification-container">
        <p class="time" v-if="message._showTime">{{ message._timeStr }}</p>
        <p class="notification">{{ message.messageContent.digest(message) }}</p>
    </div>
</template>

<script>

import Message from "../../../../wfc/messages/message";

export default {
    name: "NotificationMessageContentView",
    props: {
        message: {
            type: Message,
            required: true
        }
    },
    components: {}
}
</script>

<style lang="css" scoped>
.notification-container {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.notification-container .time {
    color: #b4b4b4;
    font-size: 10px;
    text-align: center;
}

.notification-container .notification {
    color: #b8b8b8;
    margin: 20px 20px;
    font-size: 12px;
}

</style>
