<template>
    <div class="conversation-item-container"
         @dragover="dragEvent($event, 'dragover')"
         @dragleave="dragEvent($event, 'dragleave')"
         @dragenter="dragEvent($event,'dragenter')"
         @drop="dragEvent($event, 'drop')"
         @click="onClickConversationItem"
         v-bind:class="{
             drag: dragAndDropEnterCount > 0,
             active: shareConversationState.currentConversationInfo && shareConversationState.currentConversationInfo.conversation.equal(source.conversation),
                              top:source.top,
                              highlight:shareConversationState.contextMenuConversationInfo && shareConversationState.contextMenuConversationInfo.conversation.equal(source.conversation)
         }"
         @contextmenu.prevent="showConversationInfoContextMenu">
        <div class="conversation-item">
            <div class="header">
                <img class="avatar" draggable="false" :src="portrait" alt=""
                     @error="imgUrlAlt"/>
                <em v-if="unread > 0" class="badge" v-bind:class="{silent:source.isSilent}">{{ unread > 99 ? '···' : unread }}</em>
            </div>
            <div class="content-container">
                <div class="title-time-container">
                    <i v-if="source.conversation.type === 5" class="icon-ion-android-lock" style="padding-right: 4px"></i>
                    <div v-if="isOrganizationGroupConversation" class="flex-row flex-align-center" style="max-width: calc(100% - 60px)">
                        <h2 class="title single-line">{{ conversationTitle }}</h2>
                        <p class="single-line" style="background: var(--accent-color); border-radius: 2px; color: var(--text-on-accent); padding: 1px 2px; font-size: 9px">官方</p>
                    </div>
                    <div v-else-if="isExternalDomainSingleConversation" class="flex-row flex-align-center" style="max-width: calc(100% - 60px)">
                        <h2 class="title single-line">{{ conversationTitle }}</h2>
                        <p class="single-line" style="color: var(--text-warning); border-radius: 2px;  padding: 1px 2px; font-size: var(--font-size-xxs)">{{ domainName }}</p>
                    </div>
                    <h2 v-else class="title single-line">{{ conversationTitle }}</h2>
                    <p class="time single-line">{{ source._timeStr }}</p>
                </div>
                <div class="content">
                    <p class="draft single-line" v-if="shouldShowDraft" v-html="this.$xss(draft)"></p>
                    <p class="draft single-line" v-else-if="shouldShowVoipStatus" v-html="this.$xss(voipOngoingDesc)"></p>
                    <p class="last-message-desc single-line" v-else>
                        <i v-if="unreadMention > 0">[有人@我]</i>
                        {{ lastMessageContent }}
                    </p>
                    <i v-if="source.isSilent" class="icon-ion-android-notifications-off"></i>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import store from "../../../store";
import Draft from "../../util/draft";
import FileMessageContent from "../../../wfc/messages/fileMessageContent";
import Message from "../../../wfc/messages/message";
import wfc from "../../../wfc/client/wfc";
import NotificationMessageContent from "../../../wfc/messages/notification/notificationMessageContent";
import Config from "../../../config";
import ConversationType from "../../../wfc/model/conversationType";
import GroupType from "../../../wfc/model/groupType";
import WfcUtil from "../../../wfc/util/wfcUtil";
import SendMixMediaMessageView from "../view/SendMixMediaMessageView.vue";

export default {
    name: "ConversationItemView",
    props: {
        source: {
            type: Object,
            required: true,
        },
        clickConversationItemFunc: {
            type: Function,
            required: false,
            default: null,
        },
    },
    data() {
        return {
            dragAndDropEnterCount: 0,
            shareConversationState: store.state.conversation,
            groupPortrait: Config.DEFAULT_GROUP_PORTRAIT_URL,
        };
    },
    mounted() {
        // this.refreshGroupPortrait();
    },
    methods: {
        dragEvent(e, v) {
            if (v === 'dragenter') {
                this.dragAndDropEnterCount++;
            } else if (v === 'dragleave') {
                this.dragAndDropEnterCount--;
            } else if (v === 'drop') {
                this.dragAndDropEnterCount--;
                let length = e.dataTransfer.files.length;
                if (Config.ENABLE_MIX_MEDIA_MESSAGE) {
                    this.$modal.show(
                        SendMixMediaMessageView,
                        {
                            conversation: this.source.conversation,
                            files: [...e.dataTransfer.files],
                        }, null, {
                            name: 'send-mix-multi-media-message-modal',
                            width: 600,
                            height: 480,
                            clickToClose: true,
                        }, {
                            'before-close': null,
                        });

                    return
                }
                if (length > 0 && length <= 5) {
                    for (let i = 0; i < length; i++) {
                        this.$eventBus.$emit('uploadFile', e.dataTransfer.files[i])
                        store.sendFile(this.source.conversation, e.dataTransfer.files[i]);
                    }
                } else {
                    // TODO
                    let url = e.dataTransfer.getData('URL');
                    if (url) {
                        store.sendFile(this.source.conversation, url);
                    } else {
                        let text = e.dataTransfer.getData('text');
                        if (text.startsWith('{')) {
                            let obj = JSON.parse(text);
                            let file = new FileMessageContent(null, obj.url, obj.name, obj.size)
                            let message = new Message(this.source.conversation, file)
                            wfc.sendMessage(message);
                        }
                    }
                    console.log(this.$t('conversation.drag_to_send_limit_tip'), e.dataTransfer, e.dataTransfer.getData('URL'));
                }
            } else if (v === 'dragover') {
                // If not st as 'copy', electron will open the drop file
                e.dataTransfer.dropEffect = 'copy';
            }
        },
        imgUrlAlt(e) {
            if (this.source.conversation.type === ConversationType.Group) {
                e.target.src = Config.DEFAULT_GROUP_PORTRAIT_URL;
            } else {
                e.target.src = Config.DEFAULT_PORTRAIT_URL;
            }
        },

        onClickConversationItem() {
            if (this.clickConversationItemFunc) {
                this.clickConversationItemFunc(this.source);
                return;
            }
            if(this.shareConversationState.currentConversationInfo && this.shareConversationState.currentConversationInfo.conversation.equal(this.source.conversation)) {
                store.setCurrentConversationInfo(null);
                return;
            }
            store.setCurrentConversationInfo(this.source);
            if (this.unread > 0) {
                wfc.clearConversationUnreadStatus(this.source.conversation);
            }
            // this.refreshGroupPortrait();
        },
        showConversationInfoContextMenu(event) {
            this.$eventBus.$emit('showConversationContextMenu', [event, this.source]);
        },

    },
    computed: {
        conversationTitle() {
            let info = this.source;
            if (info.conversation._target) {
                return info.conversation._target._displayName;
            }
            return '';
        },

        isOrganizationGroupConversation() {
            let info = this.source;
            if (info.conversation.type === ConversationType.Group && info.conversation._target && info.conversation._target.type === GroupType.Organization) {
                return true;
            }
            return false;
        },
        isExternalDomainSingleConversation() {
            let info = this.source;
            if (info.conversation.type === ConversationType.Single && WfcUtil.isExternal(info.conversation.target)) {
                return true;
            }
            return false;
        },
        domainName() {
            let info = this.source;
            if (info.conversation.type === ConversationType.Single && WfcUtil.isExternal(info.conversation.target)) {
                let domainId = WfcUtil.getExternalDomainId(info.conversation.target);
                let domainInfo = wfc.getDomainInfo(domainId);
                return '@' + domainInfo.name;
            }
            return '';
        },
        shouldShowDraft() {
            if (this.shareConversationState.currentConversationInfo && this.shareConversationState.currentConversationInfo.conversation.equal(this.source.conversation)) {
                return false;
            }
            if (this.source.unreadCount.unreadMention + this.source.unreadCount.unreadMentionAll > 0) {
                return false;
            }
            let draft = Draft.getConversationDraftEx(this.source);
            return draft.text.trim() !== '' || draft.quotedMessage !== null;
        },

        shouldShowVoipStatus() {
            return this.source._isVoipOngoing;
        },

        draft() {
            let draft = Draft.getConversationDraftEx(this.source);
            let draftText = `<em>[${this.$t('common.draft')}]</em>` + draft.text;
            draftText = draftText.replace(/<img [:a-zA-Z0-9_+; ,\-=\/."]+>/g, '[图片]')
            draftText = draftText.replace(/&nbsp;/g, ' ');
            draftText = draftText.replace(/<br>/g, '')
            if (draft.quotedMessage) {
                draftText += '...'
            }
            return draftText;
        },

        voipOngoingDesc() {
            let voipStatus = `<em>[音视频通话进行中]</em>`;
            return voipStatus;
        },

        lastMessageContent() {
            let conversationInfo = this.source;
            if (conversationInfo.lastMessage && conversationInfo.lastMessage.messageContent) {
                let senderName = '';
                if (conversationInfo.conversation.type === 1 && conversationInfo.lastMessage.direction === 1 && !(conversationInfo.lastMessage.messageContent instanceof NotificationMessageContent)) {
                    if (conversationInfo.lastMessage._from) {
                        senderName = conversationInfo.lastMessage._from._displayName + ': ';
                    } else {
                        conversationInfo.lastMessage = store._patchMessage(conversationInfo.lastMessage, 0)
                        if (conversationInfo.lastMessage._from) {
                            senderName = conversationInfo.lastMessage._from._displayName + ': ';
                        } else {
                            senderName = '<' + conversationInfo.lastMessage.from + '>: ';
                        }
                    }
                }
                return senderName + conversationInfo.lastMessage.messageContent.digest(conversationInfo.lastMessage);
            } else {
                return '';
            }
        },

        unread() {
            let conversationInfo = this.source;
            let unreadCount = conversationInfo.unreadCount;
            return unreadCount ? (unreadCount.unread + unreadCount.unreadMention + unreadCount.unreadMentionAll) : 0;
        },
        unreadMention() {
            let conversationInfo = this.source;
            let unreadCount = conversationInfo.unreadCount;
            return unreadCount ? (unreadCount.unreadMention + unreadCount.unreadMentionAll) : 0;
        },

        portrait() {
            let info = this.source;
            if (info.conversation.type === ConversationType.Group) {
                if (info.conversation._target.portrait) {
                    return info.conversation._target.portrait;
                } else {
                    let dp = wfc.defaultGroupPortrait(info.conversation._target);
                    info.conversation._target.portrait = dp;
                    return dp;
                }
            } else {
                return info.conversation._target.portrait;
            }
        }
    },
};
</script>

<style scoped>
.conversation-item-container {
    position: relative;
    padding-left: 12px;
    background-color: var(--background-item-normal);
}

.conversation-item-container::after {
    content: '';
    position: absolute;
    left: calc(26px + var(--size-avatar));
    right: 0;
    bottom: 0;
    height: 1px;
    background: var(--border-separator);
}

/*
 * 当会话项有独立背景色（悬停/选中/置顶/右键高亮）时隐藏分隔线：
 * 缩进的分隔线只覆盖右侧 1px，会让头像一侧的背景比文字一侧高 1px，产生视觉错位；
 * 此时整行背景块本身已起到分隔作用，无需分隔线。
 */
.conversation-item-container:hover::after,
.conversation-item-container.active::after,
.conversation-item-container.top::after,
.conversation-item-container.highlight::after {
    display: none;
}

/*
 * 悬停/选中高亮做成内缩的圆角矩形，与左右边缘留出间距（微信/macOS 风格）。
 * 用伪元素绘制，不占布局空间，避免影响虚拟列表的行高计算。
 * 置顶项的底色仍铺满整行（用于列表顶部背景跟随），高亮 pill 叠加其上。
 */
.conversation-item-container::before {
    content: '';
    position: absolute;
    left: 6px;
    right: 6px;
    top: 1px;
    bottom: 1px;
    border-radius: var(--radius-md);
    background: transparent;
    pointer-events: none;
    z-index: 0;
}

.conversation-item-container:hover::before {
    background: var(--background-item-hover);
}

.conversation-item-container.active::before {
    background: var(--background-conversation-item-active);
}

.conversation-item-container.drag {
    border: 1px solid var(--border-active);
}

.conversation-item-container.top {
    background-color: var(--background-item-top);
}

.conversation-item-container.highlight::before {
    box-shadow: 0 0 0 1px var(--border-active) inset;
}

.conversation-item {
    position: relative;
    z-index: 1;
    width: 100%;
    height: var(--conversation-item-height);
    display: flex;
    /*border-bottom: 1px solid var(--border-secondary);*/
    align-items: center;
    justify-content: center;
}

.header {
    height: 100%;
    padding: 8px 12px 8px 0;
    margin-right: 2px;
    position: relative;
}

.header .avatar {
    position: relative;
    min-width: var(--size-avatar);
    min-height: var(--size-avatar);
    background: var(--background-tertiary);
    top: 50%;
    transform: translateY(-50%);
}

.header .badge {
    position: absolute;
    color: var(--text-on-accent);
    font-size: calc(10px * var(--font-scale));
    background-color: var(--background-badge);
    border-radius: var(--radius-lg);
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    line-height: 16px;
    font-style: normal;
    text-align: center;
    right: 8px;
    top: 8px;
    vertical-align: center;
}

.header .badge.silent {
    width: 8px;
    height: 8px;
    min-width: 8px;
    padding: 0;
    font-size: 0;
}

.content-container {
    width: 100%;
    height: calc(45px * var(--layout-scale-row));
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    padding-right: 12px;
}

.content-container .title-time-container {
    display: flex;
    width: 100%;
    max-width: 100%;
    align-content: center;
    justify-content: space-between;
}

.content-container .title-time-container .title {
    display: inline-block;
    font-size: var(--font-size-base);
    color: var(--text-primary);
    font-style: normal;
    font-weight: normal;
    flex: 1;
}

.content-container .title-time-container .time {
    display: inline-block;
    color: var(--text-secondary);
    vertical-align: middle;
    font-size: var(--font-size-xxs);
}

.content-container .content {
    display: flex;
    justify-content: space-between;
}

.content .draft {
    font-size: var(--font-size-xs);
    height: calc(20px * var(--layout-scale-row));
    color: var(--text-placeholder);
}

/*refer to: https://blog.csdn.net/weixin_42412046/article/details/80804285*/
>>> .content .draft em {
    color: var(--text-danger);
    font-style: normal;
    padding-right: 4px;
}

.conversation-item-container.top .content .last-message-desc {
    color: var(--text-secondary);
}

.content .last-message-desc {
    color: var(--text-tertiary);
    font-size: var(--font-size-xs);
}

.content .last-message-desc i {
    font-style: normal;
    color: var(--text-danger);
}

.content i {
    color: var(--text-placeholder);
}


</style>
