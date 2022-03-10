<template>
    <div class="quoted-message-container">
        <div class="quoted-message">

            <div class="media-content" v-if="[3, 6, 7].indexOf(this.quotedMessage.messageContent.type) >= 0">
                <p> {{ this.quotedMessage._from._displayName + ':' }} </p>
                <img :src="mediaSrc" alt=""
                     @click="onMessageClick">
            </div>
            <div v-else-if="enableMessagePreview && this.quotedMessage.messageContent.type === 1" class="other-content">
                <tippy
                    :to="'messagePreview' + this.message.messageId + this.quotedMessage.messageId + enableMessagePreview"
                    interactive
                    :animate-fill="false"
                    placement="left"
                    distant="7"
                    theme="light"
                    animation="fade"
                    trigger="click"
                >
                    <PreviewQuotedMessageView :message="quotedMessage"/>
                </tippy>
                <p
                    :name="'messagePreview' + this.message.messageId  + this.quotedMessage.messageId + enableMessagePreview">
                    {{ this.quotedMessageStr }}
                </p>
            </div>
            <p v-else
               @click="onMessageClick">
                {{ this.quotedMessageStr }}
            </p>
        </div>
        <i v-if="showCloseButton" @click="cancelQuoteMessage" class="icon-ion-close"></i>
    </div>
</template>

<script>
import store from "@/store";
import MessageContentType from "@/wfc/messages/messageContentType";
import Message from "@/wfc/messages/message";
import PreviewQuotedMessageView from "@/ui/main/conversation/message/PreviewQuotedMessageView";
import {fs, isElectron, shell} from "../../../../platform";
import {downloadFile} from "../../../../platformHelper";

export default {
    name: "QuoteMessageView",
    props: {
        showCloseButton: {
            type: Boolean,
            required: false,
            default: false,
        },
        // 原始消息
        message: {
            type: Message,
            required: false,
        },
        // 被引用的消息
        quotedMessage: {
            type: Message,
            required: true,
        },
        quotedMessageDigest: {
            type: String,
            required: false,
            default: '',
        },
        enableMessagePreview: {
            type: Boolean,
            required: false,
            default: false,
        }
    },

    data() {
        return {
            shareConversation: store.state.conversation,
        }
    },
    methods: {
        cancelQuoteMessage() {
            this.$emit('cancelQuoteMessage')
        },

        onMessageClick() {
            if (!this.enableMessagePreview) {
                return;
            }
            if (this.quotedMessage) {
                switch (this.quotedMessage.messageContent.type) {
                    case MessageContentType.Video:
                    case MessageContentType.Image:
                        store.previewMessage(this.quotedMessage, false);
                        break;
                    case MessageContentType.File:
                        this.downloadQuotedFile(this.quotedMessage)
                        break;
                    case MessageContentType.Text:
                        // do nothing
                        break;

                    default:
                        // TODO
                        console.log('TODO: preview quotedMessage')
                        break

                }
            }
        },

        downloadQuotedFile(quotedFileMessage){
            if (isElectron()) {
                let localPath = quotedFileMessage.messageContent.localPath;
                if (localPath && fs.existsSync(localPath)) {
                    shell.openPath(localPath);
                } else {
                    if (!store.isDownloadingMessage(quotedFileMessage.messageId)) {
                        downloadFile(quotedFileMessage)
                        store.addDownloadingMessage(quotedFileMessage.messageId)
                    } else {
                        // TODO toast 下载中
                        console.log('file isDownloading')
                    }
                }
            } else {
                downloadFile(quotedFileMessage)
            }
        }
    },
    computed: {
        quotedMessageStr() {
            let str = '';
            if (this.quotedMessage) {
                str = this.quotedMessage._from._displayName + ':';
                if ([MessageContentType.Image, MessageContentType.Video, MessageContentType.Sticker].indexOf(this.quotedMessage.messageContent.type) < 0) {
                    str += this.quotedMessage.messageContent.digest(this.quotedMessage);
                }
                if(MessageContentType.RecallMessage_Notification === this.quotedMessage.messageContent.type){
                    str = "引用内容已撤回"
                }
            } else {
                str = this.quotedMessageDigest;
            }
            return str;
        },
        mediaSrc() {
            let src;
            let msgCnt = this.quotedMessage.messageContent;
            src = msgCnt.thumbnail ? 'data:video/jpeg;base64,' + msgCnt.thumbnail : msgCnt.remotePath;
            return src;
        }
    },
    components: {
        PreviewQuotedMessageView,
    }
}

</script>

<style lang="css" scoped>
.quoted-message-container {
    display: flex;
    align-items: center;
}

.quoted-message {
    display: flex;
    max-width: 100%;
    background-color: #e9e9e9;
    border-radius: 5px;
    padding: 5px 10px;
    margin-right: 10px;
}

.quoted-message > p {
    max-width: 100%;
    max-height: 50px;
    flex: 1;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    outline: none;
}

.other-content p {
    max-width: 100%;
    max-height: 50px;
    flex: 1;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    outline: none;
}

.media-content {
    max-width: 100%;
    display: flex;
    flex-direction: row;
}

.media-content p {
    width: 100px;
    max-height: 50px;
    max-width: 100px;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
}

.quoted-message img {
    margin-left: 10px;
    border-radius: 3px;
    max-width: 100px;
    max-height: 100px;
}

</style>
