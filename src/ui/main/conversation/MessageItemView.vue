<template>
    <!--todo item.messageId or messageUid as key-->
    <div>
        <!--todo 不同的消息类型 notification in out-->
        <NotificationMessageContentView :message="source" v-if="isNotificationMessage(source)"/>
        <RecallNotificationMessageContentView :message="source" v-else-if="isRecallNotificationMessage(source)"/>
        <ContextableNotificationMessageContentContainerView
            v-else-if="isContextableNotificationMessage(source)"
            @click.native.capture="sharedConversationState.enableMessageMultiSelection? clickMessageItem($event, source) : null"
            :message="source"
        />
        <NormalOutMessageContentView
            @click.native.capture="sharedConversationState.enableMessageMultiSelection? clickMessageItem($event, source) : null"
            :message="source"
            v-else-if="source.direction === 0"/>
        <NormalInMessageContentView
            @click.native.capture="sharedConversationState.enableMessageMultiSelection ? clickMessageItem($event, source) : null"
            :message="source"
            v-else/>
    </div>
</template>

<script>
import SingleConversationInfoView from "@/ui/main/conversation/SingleConversationInfoView";
import SecretConversationInfoView from "@/ui/main/conversation/SecretConversationInfoView";
import GroupConversationInfoView from "@/ui/main/conversation/GroupConversationInfoView";
import MessageInputView from "@/ui/main/conversation/MessageInputView";
import ClickOutside from 'vue-click-outside'
import NormalOutMessageContentView from "@/ui/main/conversation/message/NormalOutMessageContentContainerView";
import NormalInMessageContentView from "@/ui/main/conversation/message/NormalInMessageContentContainerView";
import NotificationMessageContentView from "@/ui/main/conversation/message/NotificationMessageContentView";
import RecallNotificationMessageContentView from "@/ui/main/conversation/message/RecallNotificationMessageContentView";
import NotificationMessageContent from "@/wfc/messages/notification/notificationMessageContent";
import TextMessageContent from "@/wfc/messages/textMessageContent";
import store from "@/store";
import wfc from "@/wfc/client/wfc";
import {numberValue} from "@/wfc/util/longUtil";
import InfiniteLoading from 'vue-infinite-loading';
import MultiSelectActionView from "@/ui/main/conversation/MessageMultiSelectActionView";
import ScaleLoader from 'vue-spinner/src/ScaleLoader'
import ForwardType from "@/ui/main/conversation/message/forward/ForwardType";
import {fs, isElectron, shell} from "@/platform";
import FileMessageContent from "@/wfc/messages/fileMessageContent";
import ImageMessageContent from "@/wfc/messages/imageMessageContent";
import {copyImg, copyText} from "@/ui/util/clipboard";
import Message from "../../../wfc/messages/message";
import {downloadFile} from "../../../platformHelper";
import VideoMessageContent from "../../../wfc/messages/videoMessageContent";
import localStorageEmitter from "../../../ipc/localStorageEmitter";
import SoundMessageContent from "../../../wfc/messages/soundMessageContent";
import MessageContentType from "../../../wfc/messages/messageContentType";
import ConversationType from "../../../wfc/model/conversationType";
import GroupMemberType from "../../../wfc/model/groupMemberType";
import CompositeMessageContent from "../../../wfc/messages/compositeMessageContent";
import EventType from "../../../wfc/client/wfcEvent";
import MultiCallOngoingMessageContent from "../../../wfc/av/messages/multiCallOngoingMessageContent";
import JoinCallRequestMessageContent from "../../../wfc/av/messages/joinCallRequestMessageContent";
import RichNotificationMessageContent from "../../../wfc/messages/notification/richNotificationMessageContent";
import MessageStatus from "../../../wfc/messages/messageStatus";
import MediaMessageContent from "../../../wfc/messages/mediaMessageContent";
import ArticlesMessageContent from "../../../wfc/messages/articlesMessageContent";
import ContextableNotificationMessageContentContainerView from "./message/ContextableNotificationMessageContentContainerView";
import ChannelConversationInfoView from "./ChannelConversationInfoView";
import FriendRequestView from "../contact/FriendRequestView";
import {currentWindow, ipcRenderer} from "../../../platform";
import appServerApi from "../../../api/appServerApi";
import Config from "../../../config";
import IPCEventType from "../../../ipcEventType";

export default {
    components: {
        ContextableNotificationMessageContentContainerView,
        NotificationMessageContentView,
        RecallNotificationMessageContentView,
        NormalInMessageContentView,
        NormalOutMessageContentView,
    },
    props: {
        source: {
            type: Object,
            required: true,
        },
    },
    data() {
        return {
            conversationInfo: null,
            showConversationInfo: false,
            sharedConversationState: store.state.conversation,
            sharedContactState: store.state.contact,
            sharedPickState: store.state.pick,
            sharedMiscState: store.state.misc,
            isHandlerDragging: false,

            savedMessageListViewHeight: -1,
            saveMessageListViewFlexGrow: -1,

            dragAndDropEnterCount: 0,
            // FIXME 选中一个会话，然后切换到其他page，比如联系人，这时该会话收到新消息或发送消息，会导致新收到/发送的消息的界面错乱，尚不知道原因，但这么做能解决。
            fixTippy: true,
            ongoingCalls: [],
            ongoingCallTimer: 0,
            messageInputViewResized: false,
            unreadMessageCount: 0,
            isWindowAlwaysTop: currentWindow && currentWindow.isAlwaysOnTop(),
        };
    },

    activated() {
        this.fixTippy = true;
    },

    deactivated() {
        this.fixTippy = false;
    },

    methods: {
        toggleMessageMultiSelectionActionView(message) {
            if (!this.sharedConversationState.enableMessageMultiSelection) {
                this.saveMessageListViewFlexGrow = this.$refs['conversationMessageList'].style.flexGrow;
                this.savedMessageListViewHeight = this.$refs['conversationMessageList'].style.height;
                this.$refs['conversationMessageList'].style.flexGrow = 1;
            } else {
                if (this.saveMessageListViewFlexGrow !== -1 && this.savedMessageListViewHeight !== -1) {
                    this.$refs['conversationMessageList'].style.height = this.savedMessageListViewHeight;
                    this.$refs['conversationMessageList'].style.flexGrow = this.saveMessageListViewFlexGrow;
                }
            }
            this.sharedPickState.messages.forEach(m => console.log(m.messageId));
            store.toggleMessageMultiSelection(message);
        },

        clickMessageItem(event, message) {
            if (message.messageContent instanceof NotificationMessageContent) {
                return;
            }
            if (this.sharedConversationState.enableMessageMultiSelection) {
                store.selectOrDeselectMessage(message);
                event.stopPropagation();
            }
        },

        hideConversationInfo() {
            // TODO
            // 是否在创建群聊，或者是在查看会话参与者信息
            this.showConversationInfo && (this.showConversationInfo = false);
        },

        isNotificationMessage(message) {
            return message && message.messageContent instanceof NotificationMessageContent
                && message.messageContent.type !== MessageContentType.RecallMessage_Notification
                && message.messageContent.type !== MessageContentType.Rich_Notification;
        },

        isContextableNotificationMessage(message) {
            return message && (message.messageContent instanceof RichNotificationMessageContent || message.messageContent instanceof ArticlesMessageContent);
        },

        isRecallNotificationMessage(message) {
            return message && message.messageContent.type === MessageContentType.RecallMessage_Notification;
        },

        isCancelable(message) {
            return message && message.messageContent instanceof MediaMessageContent && message.status === MessageStatus.Sending;
        },

        reedit(message) {
            this.$refs.messageInputView.insertText(message.messageContent.originalSearchableContent);
        },

        onMenuClose() {
            this.$emit('contextMenuClosed')
        },
        onMessageSenderContextMenuClose() {
            console.log('onMessageSenderContextMenuClose')
        },

        // message context menu
        isCopyable(message) {
            return message
                && (message.messageContent instanceof TextMessageContent
                    || message.messageContent instanceof ImageMessageContent
                    || ((message.messageContent instanceof VideoMessageContent
                        || message.messageContent instanceof FileMessageContent) && this.isLocalFile(message))
                );
        },
        isDownloadable(message) {
            return message && (message.messageContent instanceof ImageMessageContent
                || message.messageContent instanceof FileMessageContent
                || message.messageContent instanceof VideoMessageContent);
        },

        isForwardable(message) {
            if (message && message.messageContent instanceof SoundMessageContent) {
                return false;
            }
            return true;
        },

        isFavable(message) {
            if (!message) {
                return false;
            }
            return [MessageContentType.VOIP_CONTENT_TYPE_START,
                MessageContentType.CONFERENCE_CONTENT_TYPE_INVITE].indexOf(message.messageContent.type) <= -1;
        },

        isRecallable(message) {
            if (message) {
                if (message.conversation.type === ConversationType.Group) {
                    let groupInfo = wfc.getGroupInfo(message.conversation.target);
                    let selfUserId = wfc.getUserId();
                    if (groupInfo && groupInfo.owner === selfUserId) {
                        return true;
                    }

                    let groupMember = wfc.getGroupMember(message.conversation.target, selfUserId);
                    if (groupMember && [GroupMemberType.Manager, GroupMemberType.Owner].indexOf(groupMember.type) > -1) {
                        return true;
                    }
                }
                let delta = wfc.getServerDeltaTime();
                let now = new Date().getTime();
                if (message.direction === 0 && now - (numberValue(message.timestamp) - delta) < 60 * 1000) {
                    return true;
                }
            }
            return false;
        },

        isLocalFile(message) {
            if (message && isElectron()) {
                let media = message.messageContent;
                let localPath = media.localPath;
                if (localPath) {
                    return fs.existsSync(localPath);
                }
            }
            return false;
        },

        isQuotable(message) {
            if (!message) {
                return false;
            }
            return [MessageContentType.VOIP_CONTENT_TYPE_START,
                MessageContentType.Voice,
                MessageContentType.Video,
                MessageContentType.Composite_Message,
                MessageContentType.Articles,
                MessageContentType.CONFERENCE_CONTENT_TYPE_INVITE].indexOf(message.messageContent.type) <= -1;
        },

        copy(message) {
            let content = message.messageContent;
            if (content instanceof TextMessageContent) {
                let selectedText = window.getSelection().toString()
                if (selectedText) {
                    copyText(selectedText);
                } else {
                    copyText(content.content)
                }
            } else if (content instanceof ImageMessageContent) {
                copyImg(content.remotePath)
            } else if (content instanceof MediaMessageContent) {
                if (isElectron()) {
                    ipcRenderer.send(IPCEventType.FILE_COPY, {path: content.localPath});
                }
            }
        },
        download(message) {
            if (!store.isDownloadingMessage(message.messageId)) {
                downloadFile(message)
                store.addDownloadingMessage(message.messageId)
            } else {
                // TODO toast 下载中
                console.log('file isDownloading')
            }
        },

        openFile(message) {
            let file = message.messageContent;
            shell.openItem(file.localPath);
        },

        openDir(message) {
            let file = message.messageContent;
            shell.showItemInFolder(file.localPath);
        },

        recallMessage(message) {
            wfc.recallMessage(message.messageUid, null, null);
        },
        cancelMessage(message) {
            let canceled = wfc.cancelSendingMessage(message.messageId);
            if (!canceled) {
                this.$notify({
                    text: '取消失败',
                    type: 'warn',
                });
            }
        },

        delMessage(message) {
            this.$alert({
                title: ' 删除消息',
                content: '确定删除消息？',
                confirmText: '本地删除',
                cancelText: '远程删除',
                cancelCallback: () => {
                    wfc.deleteRemoteMessageByUid(message.messageUid, null, null)
                },
                confirmCallback: () => {
                    wfc.deleteMessage(message.messageId);
                }
            })
        },

        forward(message) {
            return this.$forwardMessage({
                forwardType: ForwardType.NORMAL,
                messages: [message],
            });
        },

        _forward(message) {
            this.forward(message).catch((reason) => {
                // do nothing
                console.log('foward errro', reason)
            });
        },

        quoteMessage(message) {
            store.quoteMessage(message);
        },

        // call from child
        favMessages(messages) {
            console.log('fav messages');
            let compositeMessageContent = new CompositeMessageContent();
            let title = '';
            let msgConversation = messages[0].conversation;
            if (msgConversation.type === ConversationType.Single) {
                let users = store.getUserInfos([wfc.getUserId(), msgConversation.target], '');
                title = users[0]._displayName + '和' + users[1]._displayName + '的聊天记录';
            } else {
                title = '群的聊天记录';
            }
            compositeMessageContent.title = title;
            compositeMessageContent.messages = messages;

            let message = new Message(msgConversation, compositeMessageContent);
            message.from = wfc.getUserId();
            this.favMessage(message);
        },

        favMessage(message) {
            appServerApi.favMessage(message)
                .then(data => {
                    this.$notify({
                        // title: '收藏成功',
                        text: '收藏成功',
                        type: 'info'
                    });
                })
                .catch(err => {
                    console.log('fav error', err)
                    this.$notify({
                        // title: '收藏失败',
                        text: '收藏失败',
                        type: 'error'
                    });
                })
        },

        multiSelect(message) {
            this.toggleMessageMultiSelectionActionView(message);
        },

        infiniteHandler($state) {
            console.log('to load more message');
            store.loadConversationHistoryMessages(() => {
                console.log('loaded')
                $state.loaded();
            }, () => {
                console.log('complete')
                $state.complete()
            });
        },

        mentionMessageSenderTitle(message) {
            if (!message) {
                return ''
            }
            let displayName = wfc.getGroupMemberDisplayName(message.conversation.target, message.from);
            return '@' + displayName;
        },

        mentionMessageSender(message) {
            this.$refs.messageInputView.mention(message.conversation.target, message.from);
        },

        onReceiveMessage(message, hasMore) {
            if (this.conversationInfo && this.conversationInfo.conversation.equal(message.conversation) && message.messageContent instanceof MultiCallOngoingMessageContent) {
                // 自己是不是已经在通话中
                console.log('MultiCallOngoingMessageContent', message.messageContent)
                if (message.messageContent.targets.indexOf(wfc.getUserId()) >= 0) {
                    return;
                }
                let index = this.ongoingCalls.findIndex(call => call.messageContent.callId === message.messageContent.callId);
                if (index > -1) {
                    this.ongoingCalls[index] = message;
                } else {
                    this.ongoingCalls.push(message);
                }
                if (!this.ongoingCallTimer) {
                    this.ongoingCallTimer = setInterval(() => {
                        this.ongoingCalls = this.ongoingCalls.filter(call => {
                            return (new Date().getTime() - (numberValue(call.timestamp) - numberValue(wfc.getServerDeltaTime()))) < 3 * 1000;
                        })
                        if (this.ongoingCalls.length === 0) {
                            clearInterval(this.ongoingCallTimer);
                            this.ongoingCallTimer = 0;
                        }
                        console.log('ongoing calls', this.ongoingCalls.length);
                    }, 1000)
                }
            }
        },

        joinMultiCall(message) {
            let request = new JoinCallRequestMessageContent(message.messageContent.callId, wfc.getClientId());
            wfc.sendConversationMessage(this.conversationInfo.conversation, request);
        },

        showUnreadMessage() {
            let messageListElement = this.$refs['conversationMessageList'];
            messageListElement.scroll({top: messageListElement.scrollHeight, left: 0, behavior: 'auto'})
        },

        clearConversationUnreadStatus() {
            let info = this.sharedConversationState.currentConversationInfo;
            if (info.unreadCount.unread + info.unreadCount.unreadMention + info.unreadCount.unreadMentionAll > 0) {
                store.clearConversationUnreadStatus(info.conversation);
                // this.unreadMessageCount = 0;
            }
        }
    },

    mounted() {
        this.popupItem = this.$refs['setting'];
    },

    beforeDestroy() {
    },

    updated() {
    },

    computed: {
        loadingIdentifier() {
            let conversation = this.sharedConversationState.currentConversationInfo.conversation;
            return conversation.type + '-' + conversation.target + '-' + conversation.line;
        },
    },
    // watch: {
    //     conversationInfo() {
    //         console.log('conversationInfo changed', this.conversationInfo);
    //     }
    // },

    directives: {
        ClickOutside
    },
};
</script>

<style lang="css" scoped>

.conversation-empty-container h1 {
    font-size: 17px;
    font-weight: normal;
}

.title-container h1 {
    font-size: 16px;
    font-weight: normal;
}

.title-container a {
    text-decoration: none;
    padding: 15px;
    color: #181818;
}

.title-container a:active {
    color: #d6d6d6;
}

.conversation-container {
    height: 100%;
    display: flex;
    flex-direction: column;
}

.conversation-container header {
    border-top-right-radius: var(--main-border-radius);
}

.conversation-container header {
    width: 100%;
    height: 60px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #f5f5f5;
    border-bottom: 1px solid #e6e6e6;
}

.conversation-content-container {
    flex: 1;
    height: calc(100% - 60px);
    position: relative;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    background-color: #f3f3f3;
    border-bottom-right-radius: var(--main-border-radius);
}

.conversation-content-container .drag-drop-container {
    position: absolute;
    background-color: #f2f2f2a5;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 100;
    height: 100%;
    padding: 20px 15px 15px 15px;
}

.conversation-content-container .drag-drop {
    border: 2px dashed #b2b2b2;
    height: 100%;
    width: 100%;
    border-radius: 5px;
    display: flex;
    justify-content: center;
    align-items: center;
}

.conversation-content-container .drag-drop p {
    padding-bottom: 100px;
}

.conversation-content-container .ongoing-call-container {
    width: 100%;
    display: flex;
    flex-direction: column;
    background: white;
}

.ongoing-call-item {
    padding: 10px 20px;
    display: flex;
    border-bottom: 1px solid lightgrey;
}

.ongoing-call-item p {
    flex: 1;
}

.ongoing-call-item button {
    padding: 5px 10px;
    border: 1px solid #e5e5e5;
    border-radius: 3px;
}

.ongoing-call-item button:active {
    border: 1px solid #4168e0;
}

.conversation-message-list {
    flex: 1 1 auto;
    overflow: auto;
}

.conversation-message-list ul {
    list-style: none;
}

.unread-count-tip-container {
    margin-left: auto;
    padding: 4px 8px;
    background: white;
    width: auto;
    color: #4168e0;
    border-radius: 4px;
}

/*.handler {*/
/*  height: 1px;*/
/*  background-color: #e2e2e2;*/
/*}*/

.inputting-container {
    display: flex;
    padding: 10px 20px;
    align-items: center;
}

.inputting-container .avatar {
    width: 40px;
    height: 40px;
    border-radius: 3px;
    margin-right: 20px;
}

.divider-handler::before {
    cursor: row-resize;
    content: '';
    display: block;
    width: 100%;
    height: 3px;
    border-top: 1px solid #e2e2e2;
    margin: 0 auto;
}

.user-online-status {
    color: gray;
    font-size: 10px;
}

.conversation-info-container {
    display: none;
    width: 266px;
    height: 100%;
    top: 0;
    right: 0;
    position: absolute;
    background-color: #ffffffe5;
    backdrop-filter: blur(6px);
    border-left: 1px solid #e6e6e6;
}

.conversation-info-container.active {
    display: flex;
}

i:hover {
    color: #1f64e4;
}

i.active {
    color: #3f64e4;
}
</style>
