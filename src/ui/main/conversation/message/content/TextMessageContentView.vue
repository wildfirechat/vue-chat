<template>
    <div class="text-message-container"
         v-bind:class="{out:message.direction === 0}">
        <p class="text" v-html="this.$xss(this.textContent)" @click="handleLinkClick" @mouseup="mouseUp" @contextmenu="preventContextMenuTextSelection"></p>
    </div>
</template>

<script>
import Message from "../../../../../wfc/messages/message";
import {parser as emojiParse} from "../../../../util/emoji";
import helper from "../../../../util/helper";
import Config from "../../../../../config";
import {isElectron, shell} from "../../../../../platform";
//import {marked} from "marked";

export default {
    name: "TextMessageContentView",
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
        },
        handleLinkClick(event) {
            let target = event.target;
            while (target && target !== event.currentTarget) {
                if (target.tagName === 'A') {
                    event.preventDefault();
                    let url = target.getAttribute('href');
                    if (Config.OPEN_LINK_POLICY === 2) {
                        this.$notify({
                            title: '提示',
                            text: '禁止打开外部链接',
                            type: 'warn'
                        });
                        return;
                    }
                    if (Config.OPEN_LINK_POLICY === 1) {
                        this.$alert({
                            showIcon: false,
                            content: '谨防钓鱼网站或者带毒网站，只有确认已知安全的链接才可以打开。请确实该链接是否是已知安全的？',
                            confirmText: '确认安全',
                            cancelText: '关闭',
                            confirmCallback: () => {
                                this._openExternal(url);
                            },
                            cancelCallback: () => {
                                // do nothing
                            }
                        });
                        return;
                    }
                    this._openExternal(url);
                    return;
                }
                target = target.parentElement;
            }
        },
        _openExternal(url) {
            if (isElectron()) {
                shell.openExternal(url);
            } else {
                window.open(url);
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

            content = helper.linkify(content);
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
    margin: 0 8px;
    padding: 8px;
    background-color: var(--background-primary);
    position: relative;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
}

.text-message-container >>> p {
    user-select: text;
    white-space: pre-line;
}

.text-message-container >>> code {
    background: var(--background-tertiary);
    display: inline-block;
    border-radius: var(--radius-sm);
    padding: 0 4px;
    user-select: text;
}

.text-message-container.out {
    background-color: var(--background-message-out);
}

.text-message-container .text {
    color: var(--text-primary);
    font-size: var(--font-size-sm);
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
