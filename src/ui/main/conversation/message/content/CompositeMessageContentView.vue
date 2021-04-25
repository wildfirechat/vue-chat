<template>
    <div class="text-message-container"
         v-bind:class="{out:message.direction === 0}">
        <p class="title">{{ title }}</p>
        <p class="content" v-html="this.content"></p>
        <p class="desc">{{ $t('message.records') }}</p>
    </div>
</template>

<script>
import Message from "@/wfc/messages/message";
import {parser as emojiParse} from "@/ui/util/emoji";
import wfc from "@/wfc/client/wfc";
import ConversationType from "@/wfc/model/conversationType";

export default {
    name: "CompositeMessageContentView",
    props: {
        message: {
            type: Message,
            required: true,
        }
    },

    computed: {
        title() {
            let compositeMessageContent = this.message.messageContent;
            return compositeMessageContent.title;
        },
        content() {
            let compositeMessageContent = this.message.messageContent;
            let messages = compositeMessageContent.messages;
            let str = '';
            let conversation = messages[0].conversation;
            let groupId = conversation.type === ConversationType.Group ? conversation.target : '';
            for (let i = 0; i < messages.length && i < 4; i++) {
                str += wfc.getGroupMemberDisplayName(groupId, messages[i].from) + ': ' + emojiParse(messages[i].messageContent.digest(messages[i]));
                str += '\n';
            }
            return str;
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

.text-message-container .title {
    color: #050505;
    font-size: 15px;
}

.text-message-container .content, .desc {
    padding: 5px 0;
    font-size: 14px;
    color: #b2b2b2;
}

.text-message-container .desc {
    border-top: 1px solid #f2f2f2;
    padding: 5px 0 0 0;
}

</style>
