<template>
    <div>
        <div class="streaming-text-message-container"
            v-bind:class="{out:message.direction === 0}">
            <div class="text" v-html="this.$xss(this.textContent)" @click="handleLinkClick" @mouseup="mouseUp" @contextmenu="preventContextMenuTextSelection"></div>
            <FadeLoader :loading="message.messageContent.type === 14" color="var(--text-hint)" style="margin: 8px" width="3px" height="8px" margin="2px" radius="8px"></FadeLoader>
        </div>
        <p class="ai-content-tip">本内容由 AI 生成</p>
    </div>
</template>

<script>
import Message from "../../../../../wfc/messages/message";
import FadeLoader from 'vue-spinner/src/FadeLoader.vue'
import {marked} from "marked";
import Config from "../../../../../config";
import {isElectron, shell} from "../../../../../platform";

export default {
    name: "StreamingTextMessageContentView",
    components: {FadeLoader},
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
            content = marked.parse(content, {breaks: true});
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
.streaming-text-message-container {
    margin: 0 8px;
    padding: 8px;
    background-color: var(--background-primary);
    position: relative;
    border-radius: var(--radius-md);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
}

.streaming-text-message-container .text >>> p {
    margin: 0 0 8px;
    word-break: break-word;
    user-select: text;
}

.streaming-text-message-container .text >>> p:last-child {
    margin-bottom: 0;
}

.streaming-text-message-container .text >>> h1,
.streaming-text-message-container .text >>> h2,
.streaming-text-message-container .text >>> h3,
.streaming-text-message-container .text >>> h4,
.streaming-text-message-container .text >>> h5,
.streaming-text-message-container .text >>> h6 {
    margin: 12px 0 6px;
}

.streaming-text-message-container .text >>> h1:first-child,
.streaming-text-message-container .text >>> h2:first-child,
.streaming-text-message-container .text >>> h3:first-child {
    margin-top: 0;
}

.streaming-text-message-container .text >>> ul,
.streaming-text-message-container .text >>> ol {
    margin: 0 0 8px;
    padding-left: 20px;
}

.streaming-text-message-container .text >>> ul {
    list-style: disc;
}

.streaming-text-message-container .text >>> ol {
    list-style: decimal;
}

.streaming-text-message-container .text >>> li {
    margin: 2px 0;
}

.streaming-text-message-container .text >>> pre {
    margin: 0 0 8px;
    padding: 8px;
    border-radius: var(--radius-sm);
    background: var(--background-tertiary);
    overflow-x: auto;
}

.streaming-text-message-container .text >>> pre code {
    background: none;
    padding: 0;
    display: block;
    white-space: pre;
}

.streaming-text-message-container .text >>> blockquote {
    margin: 0 0 8px;
    padding: 2px 10px;
    border-left: 3px solid var(--border-subtle);
    color: var(--text-secondary);
}

.streaming-text-message-container .text >>> hr {
    border: none;
    border-top: 1px solid var(--border-subtle);
    margin: 12px 0;
}

.streaming-text-message-container .text >>> table {
    border-collapse: collapse;
    margin: 0 0 8px;
}

.streaming-text-message-container .text >>> th,
.streaming-text-message-container .text >>> td {
    border: 1px solid var(--border-subtle);
    padding: 4px 8px;
}

.streaming-text-message-container >>> .loading {
    margin: 4px 0 0;
}

.streaming-text-message-container >>> code {
    background: var(--background-tertiary);
    display: inline-block;
    border-radius: var(--radius-sm);
    padding: 0 4px;
    user-select: text;
}

.streaming-text-message-container.out {
    background-color: var(--background-message-out);
}

.streaming-text-message-container .text {
    color: var(--text-primary);
    font-size: var(--font-size-sm);
    line-height: 1.5;
    /*max-height: 1000px;*/
    max-width: none;
    word-spacing: normal;
    word-break: break-word;
    overflow: hidden;
    display: inline-block;
    text-overflow: ellipsis;
    user-select: text;
}

/*style for v-html */
.streaming-text-message-container .text >>> img {
    max-width: 400px !important;
    display: inline-block;
}

.streaming-text-message-container .text >>> a {
    white-space: normal;
}

.streaming-text-message-container .text >>> .emoji {
    vertical-align: middle;
}

.ai-content-tip{
    margin: 4px 8px 0;
    font-size: var(--font-size-xs);
    color: var(--text-hint);
}

</style>
