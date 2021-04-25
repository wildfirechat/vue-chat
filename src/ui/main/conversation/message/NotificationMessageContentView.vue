<template>
    <div class="notification-container">
        <p class="notification">{{ message.messageContent.digest(message) }}</p>
    </div>
</template>

<script>

import Message from "@/wfc/messages/message";

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
    justify-content: center;
}

.notification-container .notification {
    color: #b8b8b8;
    margin: 20px 0;
    font-size: 14px;
}

</style>
