<template>
    <div class="text-message-container"
         v-bind:class="{out:message.direction === 0}">
        <p class="text">{{ message.messageContent.digest(message) }}</p>
    </div>
</template>

<script>
import Message from "@/wfc/messages/message";

// pc/web端不支持的消息，比如红包等
export default {
    name: "UnsupportMessageContentView",
    props: {
        message: {
            type: Message,
            required: true,
        }
    },
    mounted() {
        console.log('UnsupportMessageContentView', this.message)
    }
}
</script>

<style lang="css" scoped>
.text-message-container {
    margin: 0 10px;
    padding: 10px;
    background-color: white;
    position: relative;
    border-radius: 5px;
}

.text-message-container.out {
    background-color: #98ea70;
}


.text-message-container .text {
    color: #050505;
    font-size: 16px;
}

</style>
