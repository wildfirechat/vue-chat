<template>
    <div class="composite-message-container"
         @click="showCompositePage"
         v-bind:class="{out:message.direction === 0}">
        <p class="title">{{ title }}</p>
        <p class="content" v-html="this.$xss(this.content)"></p>
        <p class="desc">{{ $t('message.records') }}</p>
    </div>
</template>

<script>
import Message from "../../../../../wfc/messages/message";
import {parser as emojiParse} from "../../../../util/emoji";
import wfc from "../../../../../wfc/client/wfc";
import ConversationType from "../../../../../wfc/model/conversationType";
import {ipcRenderer, isElectron} from "../../../../../platform";
import {stringValue} from "../../../../../wfc/util/longUtil";
import IpcEventType from "../../../../../ipcEventType";
import TextMessageContent from "../../../../../wfc/messages/textMessageContent";
import helper from "../../../../util/helper";

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
                if (messages[i].messageContent instanceof TextMessageContent) {
                    str += wfc.getGroupMemberDisplayName(groupId, messages[i].from) + ': ' + this.textMessageContent(messages[i]);
                } else {
                    str += wfc.getGroupMemberDisplayName(groupId, messages[i].from) + ': ' + messages[i].messageContent.digest(messages[i]);
                }
                str += '\n';
            }
            return str;
        }
    },

    methods: {
        textMessageContent(message) {
            let content = message.messageContent.digest(message);
            let lines = content.split('\n');
            if (lines.length > 1) {
                content = lines.map(line => `<span>${helper.escapeHtml(line)}</span>\n`).reduce((total, cv, ci, arr) => total + cv, '');
            } else {
                content = helper.escapeHtml(content)
            }

            content = emojiParse(content);
            // tmp = marked.parse(tmp);
            if (content.indexOf('<img') >= 0) {
                content = content.replace(/<img/g, '<img style="max-width:400px;"')
                return content;
            }
            return content;
        },
        showCompositePage() {
            if (isElectron()) {
                let hash = window.location.hash;
                let url = window.location.origin;
                if (hash) {
                    url = window.location.href.replace(hash, '#/composite');
                } else {
                    url += "/composite"
                }
                ipcRenderer.send(IpcEventType.SHOW_COMPOSITE_MESSAGE_WINDOW, {
                    messageUid: stringValue(this.message.messageUid),
                    url: url,
                });
            } else {
                let CompositeMessagePage = require('../../../CompositeMessagePage').default;
                let beforeClose = () => {
                    // todo
                };
                this.$modal.show(
                    CompositeMessagePage,
                    {
                        message: this.message,
                        isInCompositeView:true,
                    }, null, {
                        name: 'show-composite-message-modal' + '-' + stringValue(this.message.messageUid),
                        width: 800,
                        height: 600,
                        clickToClose: true,
                    }, {
                        'before-close': beforeClose,
                    });

            }
        }
    }
}
</script>

<style lang="css" scoped>
.composite-message-container {
    margin: 0 10px;
    padding: 10px;
    background-color: white;
    position: relative;
    border-radius: 5px;
    overflow: hidden;
}

.composite-message-container p {
    user-select: text;
    white-space: pre-line;
}

.composite-message-container .title {
    color: #050505;
    font-size: 15px;
}

.composite-message-container .content, .desc {
    padding: 5px 0;
    font-size: 14px;
    color: #b2b2b2;
}

.composite-message-container .desc {
    border-top: 1px solid #f2f2f2;
    padding: 5px 0 0 0;
}

.composite-message-container .content >>> img {
    max-width: 400px !important;
    display: inline-block;
}

.composite-message-container .content >>> a {
    white-space: normal;
}

.composite-message-container .content >>> .emoji {
    vertical-align: middle;
}

</style>
