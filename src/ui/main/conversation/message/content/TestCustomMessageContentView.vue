<template>
    <div class="text-message-container"
         v-bind:class="{out:message.direction === 0}">
        <p class="text" v-html="this.$xss(this.textContent)" @mouseup="mouseUp" @contextmenu="preventContextMenuTextSelection"></p>
    </div>
</template>

<script>
import Message from "../../../../../wfc/messages/message";
import {parser as emojiParse} from "../../../../util/emoji";
import helper from "../../../../util/helper";
//import {marked} from "marked";

export default {
    name: "TestCustomMessageContentView",
    props: {
        message: {
            type: Message,
            required: true,
        }
    },
    data() {
        return {
            textSelected: false,
        }
    },
    mounted() {
    },

    methods: {
        mouseUp(event) {
            let selection = window.getSelection().toString();
            this.textSelected = !!selection;

        },
        preventContextMenuTextSelection(event) {
            if (!this.textSelected) {
                if (window.getSelection) {
                    if (window.getSelection().empty) {  // Chrome
                        window.getSelection().empty();
                    } else if (window.getSelection().removeAllRanges) {  // Firefox
                        window.getSelection().removeAllRanges();
                    }
                } else if (document.selection) {  // IE?
                    document.selection.empty();
                }
            }
        }
    },

    computed: {
        textContent() {
            let content = this.message.messageContent.digest(this.message).trim();
            let lines = content.replace(/\r\n/g, '\n').split('\n');
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
    display: flex;
    align-items: center;
}

.text-message-container >>> p {
    user-select: text;
    white-space: pre-line;
}

.text-message-container >>> code {
    background: #f5f5f5;
    display: inline-block;
    border-radius: 3px;
    padding: 0 5px;
    user-select: text;
}

.text-message-container.out {
    background-color: #a8bdff;
}

.text-message-container .text {
    color: #050505;
    font-size: 13px;
    line-height: 20px;
    /*max-height: 1000px;*/
    max-width: 400px;
    word-spacing: normal;
    word-break: break-word;
    overflow: hidden;
    display: inline-block;
    text-overflow: ellipsis;
    user-select: text;
}

/*style for v-html */
.text-message-container .text >>> img {
    max-width: 400px !important;
    display: inline-block;
}

.text-message-container .text >>> a {
    white-space: normal;
}

.text-message-container .text >>> .emoji {
    vertical-align: middle;
}

</style>
