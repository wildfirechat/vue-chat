<template>
    <div class="message-container">
        <p class="text" v-html="this.textContent"></p>
    </div>
</template>

<script>
import Message from "@/wfc/messages/message";
import {parser as emojiParse} from "@/ui/util/emoji";

export default {
    name: "previewQuotedMessageView",
    props: {
        message: {
            type: Message,
            required: true,
        }
    },

    computed: {
        textContent() {
            return emojiParse(this.message.messageContent.digest(this.message))
        }
    }
}
</script>

<style lang="css" scoped>
.message-container {
    padding: 5px;
    max-height: 400px;
    max-width: 400px;
    overflow: auto;
    position: relative;
}

.message-container p {
    user-select: text;
    white-space: pre-line;
    text-align: left;
}

.message-container .text {
    color: #050505;
    font-size: 16px;
}

</style>
