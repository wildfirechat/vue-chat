<template>
    <section class="forward-message-container">
        <div class="forward-message">
            <div v-if="forwardType === 0">
                <img v-if="[3, 6].indexOf(messages[0].messageContent.type) >= 0"
                     :src="'data:video/jpeg;base64,' + messages[0].messageContent.thumbnail" alt="">
                <p v-else>
                    {{ this.forwardMessageStr }}
                </p>
            </div>
            <div v-else>
                <p>
                    {{ this.forwardMessageStr }}
                </p>
            </div>
        </div>
        <label>
            <input type="text" :placeholder="$t('conversation.forward_extra')" v-model="extraMessageText">
        </label>
    </section>
</template>

<script>
import MessageContentType from "@/wfc/messages/messageContentType";
import ForwardType from "@/ui/main/conversation/message/forward/ForwardType";
import ConversationType from "@/wfc/model/conversationType";

export default {
    name: "ForwardMessageView",
    props: {
        forwardType: {
            // 可参考ForwardType
            type: Number,
            required: false,
        },
        messages: {
            type: Array,
            required: true,
        },
    },
    data() {
        return {
            extraMessageText: '',
        }
    },
    methods: {},
    computed: {
        forwardMessageStr() {
            let str;
            let firstMsg = this.messages[0];
            switch (this.forwardType) {
                case ForwardType.NORMAL:
                    str = !firstMsg._from ? '' : firstMsg._from._displayName + ':';
                    if ([MessageContentType.Image, MessageContentType.Video].indexOf(firstMsg.messageContent.type) < 0) {
                        str += firstMsg.messageContent.digest(this.quotedMessage);
                    }
                    break;
                case ForwardType.ONE_BY_ONE:
                    str = '[' + this.$t('conversation.forward_one_by_one') + ']'
                    if (firstMsg.conversation.type === ConversationType.Single) {
                        str += this.$t('conversation.user_message_records', [firstMsg._from._displayName]);
                    } else {
                        str += this.$t('conversation.group_message_records');
                    }
                    break;
                case ForwardType.COMPOSITE:
                    str = '[' + this.$t('conversation.forward_composite') + ']'
                    if (firstMsg.conversation.type === ConversationType.Single) {
                        str += this.$t('conversation.user_message_records', [firstMsg._from._displayName]);
                    } else {
                        str += this.$t('conversation.group_message_records');
                    }
                    break;
                default:
                    break;
            }
            return str;
        }
    },
}
</script>

<style lang="css" scoped>
.forward-message-container {
    width: 100%;
    padding: 0 30px;
}

.forward-message {
    display: flex;
    max-width: 100%;
    border-radius: 5px;
    justify-content: center;
    max-height: 100px;
    overflow: hidden;
}

.forward-message p {
    padding: 5px 10px;
    border-radius: 5px;
    word-wrap: break-word;
    word-break: break-all;
    color: #aaaaaa;
    font-size: 13px;
    overflow: hidden;
    background-color: #e7e7e7;
    text-overflow: ellipsis;
}

.forward-message img {
    max-width: 200px;
    max-height: 200px;
    border-radius: 3px;
}

.forward-message-container label input {
    width: 100%;
    margin: 20px 0;
    outline: none;
    border-top: 0;
    border-right: 0;
    border-left: 0;
    border-bottom: 1px solid #e6e6e6;
}

</style>
