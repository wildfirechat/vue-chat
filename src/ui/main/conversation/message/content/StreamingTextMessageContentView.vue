<template>
    <div>
        <div class="streaming-text-message-container"
            v-bind:class="{out:message.direction === 0}">
            <p class="text" v-html="this.$xss(this.textContent)" @click="handleLinkClick" @mouseup="mouseUp" @contextmenu="preventContextMenuTextSelection"></p>
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
            content = marked.parse(content);
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

.streaming-text-message-container >>> p {
    user-select: text;
    //white-space: pre-line;
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
    max-width: 400px;
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
