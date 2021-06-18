<template>
    <div class="text-message-container"
         v-bind:class="{out:message.direction === 0}">
        <p class="text" v-html="this.textContent"></p>
    </div>
</template>

<script>
import Message from "@/wfc/messages/message";
import {parser as emojiParse} from "@/ui/util/emoji";

export default {
    name: "TextMessageContentView",
    props: {
        message: {
            type: Message,
            required: true,
        }
    },
    mounted() {
    },

    computed: {
        textContent() {
            let tmp = emojiParse(this.message.messageContent.digest(this.message));
            // pls refer to https://stackoverflow.com/questions/4522124/replace-leading-spaces-with-nbsp-in-javascript
            tmp = tmp.replace(/^[ \t]+/gm, function(x){ return new Array(x.length + 1).join('&nbsp;') })
            return tmp;
        }
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

.text-message-container p {
    user-select: text;
    white-space: pre-line;
}

.text-message-container.out {
    background-color: #98ea70;
}


.text-message-container .text {
    color: #050505;
    font-size: 16px;
}

</style>
