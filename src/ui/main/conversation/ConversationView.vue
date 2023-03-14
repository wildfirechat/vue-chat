<template>
    <section>
        <div v-if="sharedConversationState.currentConversationInfo == null" class="conversation-empty-container">
            <h1>^~^</h1>
        </div>
        <div v-else class="conversation-container">
            <header>
                <div class="title-container">
                    <div>
                        <h1 class="single-line" @click.stop="toggleConversationInfo">{{ conversationTitle }}</h1>
                        <p class="single-line user-online-status" @click="clickConversationDesc">{{ targetUserOnlineStateDesc }}</p>
                    </div>
                    <div
                        v-bind:style="{marginTop:sharedMiscState.isElectronWindowsOrLinux ?  '30px' : '0'}"
                    >
                        <a v-if="sharedMiscState.isElectron" href="#">
                            <i class="icon-ion-pin"
                               style="display: inline-block"
                               v-bind:class="{active : isWindowAlwaysTop}"
                               @click="setWindowAlwaysTop"
                            />
                        </a>
                        <a href="#">
                            <i class="icon-ion-ios-settings-strong"
                               style="display: inline-block"
                               ref="setting"
                               v-bind:class="{active : showConversationInfo}"
                               @click="toggleConversationInfo"
                            />
                        </a>
                    </div>
                </div>
            </header>
            <div ref="conversationContentContainer" class="conversation-content-container"
                 @dragover="dragEvent($event, 'dragover')"
                 @dragleave="dragEvent($event, 'dragleave')"
                 @dragenter="dragEvent($event,'dragenter')"
                 @drop="dragEvent($event, 'drop')"
                 :dummy_just_for_reactive="currentVoiceMessage"
            >
                <div v-if="ongoingCalls && ongoingCalls.length > 0" class="ongoing-call-container">
                    <div v-for="(value, index) in ongoingCalls" :key="index" class="ongoing-call-item">
                        <p>{{ value.messageContent.digest(value) }}</p>
                        <button @click="joinMultiCall(value)">加入</button>
                    </div>
                </div>
                <div v-show="dragAndDropEnterCount > 0" class="drag-drop-container">
                    <div class="drag-drop">
                        <p>{{ $t('conversation.drag_to_send_to', [conversationTitle]) }}</p>
                    </div>
                </div>
                <div ref="conversationMessageList" class="conversation-message-list">
                    <virtual-list ref="vsl" :data-component="messageItemView"
                                  :data-sources="sharedConversationState.currentConversationMessageList"
                                  :data-key="messageItemKey"
                                  :estimate-size="100"
                                  style="height: 100%; overflow-y: auto; position: relative"
                                  v-on:scroll="onScroll"
                                  v-on:resized="onItemRendered"
                                  v-on:totop="onScrollToTop"
                                  v-on:tobottom="onScrollToBottom"
                    />
                    <div slot="header" v-show="overflow" class="header">
                        <div class="spinner" v-show="!finished"></div>
                        <div class="finished" v-show="finished">No more data</div>
                    </div>
                </div>
                <div v-if="sharedConversationState.inputtingUser" class="inputting-container">
                    <img class="avatar" :src="sharedConversationState.inputtingUser.portrait"/>
                    <ScaleLoader :color="'#d2d2d2'" :height="'15px'" :width="'3px'"/>
                </div>
                <div v-if="unreadMessageCount > 0" class="unread-count-tip-container" @click="showUnreadMessage">
                    {{ '' + this.unreadMessageCount + '条新消息' }}
                </div>
                <div v-show="!sharedConversationState.enableMessageMultiSelection && !sharedContactState.showChannelMenu" v-on:mousedown="dragStart"
                     class="divider-handler"></div>
                <MessageInputView :conversationInfo="sharedConversationState.currentConversationInfo"
                                  v-show="!sharedConversationState.enableMessageMultiSelection"
                                  :input-options="inputOptions"
                                  ref="messageInputView"/>
                <MultiSelectActionView v-show="sharedConversationState.enableMessageMultiSelection"/>
                <SingleConversationInfoView
                    v-if="showConversationInfo &&  sharedConversationState.currentConversationInfo.conversation.type === 0"
                    v-click-outside="hideConversationInfo"
                    :conversation-info="sharedConversationState.currentConversationInfo"
                    v-bind:class="{ active: showConversationInfo }"
                    class="conversation-info-container"
                />
                <GroupConversationInfoView
                    v-if="showConversationInfo &&  sharedConversationState.currentConversationInfo.conversation.type === 1"
                    v-click-outside="hideConversationInfo"
                    :conversation-info="sharedConversationState.currentConversationInfo"
                    v-bind:class="{ active: showConversationInfo }"
                    class="conversation-info-container"
                />

                <SecretConversationInfoView
                    v-if="showConversationInfo &&  sharedConversationState.currentConversationInfo.conversation.type === 5"
                    v-click-outside="hideConversationInfo"
                    :conversation-info="sharedConversationState.currentConversationInfo"
                    v-bind:class="{ active: showConversationInfo }"
                    class="conversation-info-container"
                />

                <ChannelConversationInfoView
                    v-if="showConversationInfo &&  sharedConversationState.currentConversationInfo.conversation.type === 3"
                    v-click-outside="hideConversationInfo"
                    :conversation-info="sharedConversationState.currentConversationInfo"
                    v-bind:class="{ active: showConversationInfo }"
                    class="conversation-info-container"
                />

                <vue-context ref="menu" v-slot="{data:message}" :close-on-scroll="true" v-on:close="onMenuClose">
                    <!--          更多menu item-->
                    <li v-if="isCopyable(message)">
                        <a @click.prevent="copy(message)">{{ $t('common.copy') }}</a>
                    </li>
                    <li v-if="isDownloadable(message)">
                        <a @click.prevent="download(message)">{{ $t('common.save') }}</a>
                    </li>
                    <li>
                        <a @click.prevent="delMessage(message)">{{ $t('common.delete') }}</a>
                    </li>
                    <li v-if="isForwardable(message)">
                        <a @click.prevent="_forward(message)">{{ $t('common.forward') }}</a>
                    </li>
                    <li v-if="isFavable(message)">
                        <a @click.prevent="favMessage(message)">{{ $t('common.fav') }}</a>
                    </li>
                    <li v-if="isQuotable(message)">
                        <a @click.prevent="quoteMessage(message)">{{ $t('common.quote') }}</a>
                    </li>
                    <li>
                        <a @click.prevent="multiSelect(message)">{{ $t('common.multi_select') }}</a>
                    </li>
                    <li v-if="isRecallable(message)">
                        <a @click.prevent="recallMessage(message)">{{ $t('common.recall') }}</a>
                    </li>
                    <li v-if="isCancelable(message)">
                        <a @click.prevent="cancelMessage(message)">{{ $t('common.cancel_send') }}</a>
                    </li>
                    <li v-if="isLocalFile(message)">
                        <a @click.prevent="openFile(message)">{{ $t('common.open') }}</a>
                    </li>
                    <li v-if="isLocalFile(message)">
                        <a @click.prevent="openDir(message)">{{ $t('common.open_dir') }}</a>
                    </li>
                </vue-context>
                <vue-context ref="messageSenderContextMenu" v-slot="{data: message}" :close-on-scroll="true" v-on:close="onMessageSenderContextMenuClose">
                    <!--          更多menu item，比如添加到通讯录等-->
                    <li>
                        <a @click.prevent="mentionMessageSender(message)">{{ mentionMessageSenderTitle(message) }}</a>
                    </li>
                </vue-context>
            </div>
        </div>
    </section>
</template>

<script>
import SingleConversationInfoView from "@/ui/main/conversation/SingleConversationInfoView";
import SecretConversationInfoView from "@/ui/main/conversation/SecretConversationInfoView";
import GroupConversationInfoView from "@/ui/main/conversation/GroupConversationInfoView";
import MessageInputView from "@/ui/main/conversation/MessageInputView";
import ClickOutside from 'vue-click-outside'
import NotificationMessageContent from "@/wfc/messages/notification/notificationMessageContent";
import TextMessageContent from "@/wfc/messages/textMessageContent";
import store from "@/store";
import wfc from "@/wfc/client/wfc";
import {numberValue} from "@/wfc/util/longUtil";
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
import BenzAMRRecorder from "benz-amr-recorder";
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
import ChannelConversationInfoView from "./ChannelConversationInfoView";
import FriendRequestView from "../contact/FriendRequestView";
import {currentWindow, ipcRenderer} from "../../../platform";
import appServerApi from "../../../api/appServerApi";
import Config from "../../../config";
import IPCEventType from "../../../ipcEventType";
import MessageItemView from "./MessageItemView.vue";

var amr;
export default {
    components: {
        ChannelConversationInfoView,
        MultiSelectActionView,
        MessageInputView,
        GroupConversationInfoView,
        SingleConversationInfoView,
        SecretConversationInfoView,
        ScaleLoader,
    },
    props: {
        inputOptions: {
            type: Object,
            required: false,
        },
        title: {
            type: String,
            required: false,
        }
    },
    data() {
        return {
            messageItemView: MessageItemView,
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

            overflow: false,
            finished: false,
            isFirstPageReady: false,
            isFetching: false,

            scrollOffset: 0,
        };
    },

    activated() {
        this.fixTippy = true;
    },

    deactivated() {
        this.fixTippy = false;
    },

    methods: {
        dragEvent(e, v) {
            if (v === 'dragenter') {
                this.dragAndDropEnterCount++;
            } else if (v === 'dragleave') {
                this.dragAndDropEnterCount--;
            } else if (v === 'drop') {
                this.dragAndDropEnterCount--;
                let isFile;
                if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
                    if (e.dataTransfer.items[0].kind === 'file') {
                        if (typeof (e.dataTransfer.items[0].webkitGetAsEntry) == "function") {
                            isFile = e.dataTransfer.items[0].webkitGetAsEntry().isFile;
                        } else if (typeof (e.dataTransfer.items[0].getAsEntry) == "function") {
                            isFile = e.dataTransfer.items[0].getAsEntry().isFile;
                        }

                        if (!isFile) {
                            this.$notify({
                                // title: '不支持',
                                text: this.$t('conversation.not_support_send_folder'),
                                type: 'warn'
                            });
                            return true;
                        }
                    }
                }

                let length = e.dataTransfer.files.length;
                if (length > 0 && length < 5) {
                    for (let i = 0; i < length; i++) {
                        this.$eventBus.$emit('uploadFile', e.dataTransfer.files[i])
                        store.sendFile(this.sharedConversationState.currentConversationInfo.conversation, e.dataTransfer.files[i]);
                    }
                } else if (length > 5) {
                    this.$notify({
                        // title: '大文件提示',
                        text: this.$t('conversation.drag_to_send_limit_tip'),
                        type: 'warn'
                    });
                }

                let dragUrl = e.dataTransfer.getData('URL');
                if (dragUrl) {
                    // 根据后缀判断类型
                    if (dragUrl.endsWith('.png') || dragUrl.endsWith('.jpg') || dragUrl.endsWith('jpeg')) {
                        //constructor(fileOrLocalPath, remotePath, thumbnail) {
                        let content = new ImageMessageContent(null, dragUrl, Config.DEFAULT_THUMBNAIL_URL.split(',')[1]);
                        wfc.sendConversationMessage(this.conversationInfo.conversation, content);
                    } else {
                        // TODO
                    }
                }
                console.log('drag Url', dragUrl);
            } else if (v === 'dragover') {
                // TODO 可以判断一些，不支持的，dropEffect 置为 none
                // 支持那些类型的数据 drop，参考上面 drop 部分的处理
                // If not st as 'copy', electron will open the drop file
                e.dataTransfer.dropEffect = 'copy';
            }
        },
        toggleConversationInfo() {
            this.showConversationInfo = !this.showConversationInfo;
        },

        setWindowAlwaysTop() {
            this.isWindowAlwaysTop = !currentWindow.isAlwaysOnTop();
            currentWindow.setAlwaysOnTop(this.isWindowAlwaysTop)
        },

        clickConversationDesc() {
            if (this.conversationInfo.conversation.type === ConversationType.Single && !wfc.isMyFriend(this.conversationInfo.conversation.target)) {
                this.$modal.show(
                    FriendRequestView,
                    {
                        userInfo: this.conversationInfo.conversation._target,
                    },
                    {
                        name: 'friend-request-modal',
                        width: 600,
                        height: 250,
                        clickToClose: false,
                    }, {})
            }
        },

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

        onScroll(e, range) {
            // hide tippy userCard
            // console.log('onScroll', e, range)
            for (const popper of document.querySelectorAll('.tippy-popper')) {
                const instance = popper._tippy;
                if (instance.state.isVisible) {
                    instance.hide();
                }
            }
            // hide message context menu
            this.$refs.menu && this.$refs.menu.close();

            // 当用户往上滑动一段距离之后，收到新消息，不自动滚到到最后
            const vsl = this.$refs.vsl
            // console.log('onScroll', vsl.getClientSize(), vsl.getScrollSize(), vsl.getOffset());
            //if (e.target.scrollHeight > e.target.clientHeight + e.target.scrollTop + e.target.clientHeight / 2) {
            if (vsl.getScrollSize() - vsl.getOffset() > vsl.getClientSize() * 1.5) {
                console.log('onScroll tob', false)
                store.setShouldAutoScrollToBottom(false)
                this.scrollOffset = vsl.getOffset();
            } else {
                console.log('onScroll tob', true)
                store.setShouldAutoScrollToBottom(true)
                this.clearConversationUnreadStatus();
                this.scrollOffset = 0;
            }
        },

        dragStart() {
            this.isHandlerDragging = true;
            console.log('drag start')
        },

        drag(e) {
            // Don't do anything if dragging flag is false
            if (!this.isHandlerDragging) {
                return false;
            }

            // Get offset
            let containerOffsetTop = this.$refs['conversationContentContainer'].offsetTop;

            // Get x-coordinate of pointer relative to container
            let pointerRelativeYpos = e.clientY - containerOffsetTop;

            // Arbitrary minimum width set on box A, otherwise its inner content will collapse to width of 0
            let boxAminHeight = 150;

            // Resize box A
            // * 8px is the left/right spacing between .handler and its inner pseudo-element
            // * Set flex-grow to 0 to prevent it from growing
            this.$refs['conversationMessageList'].style.height = (Math.max(boxAminHeight, pointerRelativeYpos)) + 'px';
            this.$refs['conversationMessageList'].style.flexGrow = 0;
            this.messageInputViewResized = true;

        },

        dragEnd() {
            this.isHandlerDragging = false;
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

        onScrollToTop() {
            if (this.isFetching) {
                return;
            }
            console.log('scroll to top')
            this.isFetching = true;
            this.overflow = true;
            store.loadConversationHistoryMessages((msgs) => {
                console.log('loaded')
                this.$nextTick(() => {
                    const vsl = this.$refs.vsl
                    let msgIds = msgs.map(m => m.messageId);
                    const offset = msgIds.reduce((previousValue, currentMessageId) => {
                        const previousSize = typeof previousValue === 'string' && previousValue !== 0 ? vsl.getSize(previousValue) : previousValue
                        return previousSize + this.$refs.vsl.getSize(currentMessageId)
                    }, 0)
                    this.setVirtualListToOffset(offset)
                    this.isFetching = false;
                    this.overflow = false;
                })
            }, () => {
                console.log('complete')
                this.isFetching = false;
                this.finished = true;
                this.overflow = false;
            });
        },
        onScrollToBottom() {
            console.log('scroll to bottom')
        },

        infiniteHandler() {
            console.log('to load more message');
            store.loadConversationHistoryMessages(() => {
                console.log('loaded')
                $state.loaded();
            }, () => {
                console.log('complete')
                $state.complete()
            });
        },

        playVoice(message) {
            if (amr) {
                amr.stop();
            }
            amr = new BenzAMRRecorder();
            let voice = message.messageContent;
            amr.initWithUrl(voice.remotePath).then(() => {
                message._isPlaying = true;
                amr.play();
            });
            amr.onEnded(() => {
                message._isPlaying = false;
                store.playVoice(null)
            })
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
            // messageListElement.scroll({top: messageListElement.scrollHeight, left: 0, behavior: 'auto'})
            this.setVirtualListToBottom();
        },

        clearConversationUnreadStatus() {
            let info = this.sharedConversationState.currentConversationInfo;
            if (info.unreadCount.unread + info.unreadCount.unreadMention + info.unreadCount.unreadMentionAll > 0) {
                store.clearConversationUnreadStatus(info.conversation);
                // this.unreadMessageCount = 0;
            }
        },
        messageItemKey(message) {
            return message.messageId;
        },

        onItemRendered() {
            if (!this.$refs.vsl) {
                return
            }
            // first page items are all mounted, scroll to bottom
            //if (!this.param.isFirstPageReady && this.$refs.vsl.getSizes() >= this.param.pageSize) {
            if (!this.isFirstPageReady) {
                this.isFirstPageReady = true
                this.setVirtualListToBottom()
            }
            this.checkOverFlow()
        },
        checkOverFlow() {
            // const vsl = this.$refs.vsl
            // if (vsl) {
            //     console.log('xxx', vsl.getScrollSize(), vsl.getClientSize());
            //     this.overflow = vsl.getScrollSize() > vsl.getClientSize()
            // }
        },
        setVirtualListToOffset(offset) {
            console.log('xxxx setVirtualListToOffset', offset)
            if (this.$refs.vsl) {
                this.$refs.vsl.scrollToOffset(offset)
            }
        },
        setVirtualListToBottom() {
            console.log('xxxxxxxx setVirtualListToBottom')
            if (this.$refs.vsl) {
                this.$refs.vsl.scrollToBottom()
            }
        }
    },

    mounted() {
        this.popupItem = this.$refs['setting'];
        document.addEventListener('mouseup', this.dragEnd);
        document.addEventListener('mousemove', this.drag);

        this.$on('openMessageContextMenu', (event, message) => {
            this.$refs.menu.open(event, message);
        });

        this.$on('openMessageSenderContextMenu', (event, message) => {
            // 目前只支持群会话里面，消息发送者右键@
            if (message.conversation.type === ConversationType.Group) {
                this.$refs.messageSenderContextMenu.open(event, message);
            }
        });

        this.$eventBus.$on('send-file', args => {
            let fileMessageContent = new FileMessageContent(null, args.remoteUrl, args.name, args.size);
            let message = new Message(null, fileMessageContent);
            this.forward(message)
        });

        this.$eventBus.$on('forward-fav', args => {
            let favItem = args.favItem;
            let message = favItem.toMessage();
            this.forward(message);
        });

        if (!isElectron()) {
            localStorageEmitter.on('inviteConferenceParticipant', (ev, args) => {
                let payload = args.messagePayload;
                let messageContent = Message.messageContentFromMessagePayload(payload, wfc.getUserId());
                let message = new Message(null, messageContent);
                this.forward(message);
            });
        }
        wfc.eventEmitter.on(EventType.ReceiveMessage, this.onReceiveMessage)
    },

    beforeDestroy() {
        document.removeEventListener('mouseup', this.dragEnd);
        document.removeEventListener('mousemove', this.drag);
        this.$eventBus.$off('send-file');
        this.$eventBus.$off('forward-fav');
        this.$off('openMessageContextMenu')
        this.$off('openMessageSenderContextMenu')
        wfc.eventEmitter.removeListener(EventType.ReceiveMessage, this.onReceiveMessage);
    },

    updated() {
        if (!this.sharedConversationState.currentConversationInfo) {
            return;
        }
        this.popupItem = this.$refs['setting'];
        // refer to http://iamdustan.com/smoothscroll/
        console.log('conversationView updated', this.sharedConversationState.currentConversationInfo, this.sharedConversationState.shouldAutoScrollToBottom, this.sharedMiscState.isPageHidden)
        if (this.sharedConversationState.shouldAutoScrollToBottom && !this.sharedMiscState.isPageHidden) {
            console.log('updated, and scroll to bottom')
            this.setVirtualListToBottom();
            this.clearConversationUnreadStatus();
        } else {
            // 用户滑动到上面之后，收到新消息，不自动滑动到最下面
            if (this.scrollOffset){
                // this.setVirtualListToOffset(this.scrollOffset);
            }
        }
        if (this.sharedConversationState.currentConversationInfo) {
            let unreadCount = this.sharedConversationState.currentConversationInfo.unreadCount;
            if (unreadCount.unread > 0) {
                if (this.sharedMiscState.isPageHidden) {
                    this.unreadMessageCount = unreadCount.unread;
                }
            } else {
                this.unreadMessageCount = 0;
            }
        }

        // 切换到新的会话
        if (this.conversationInfo && this.sharedConversationState.currentConversationInfo && !this.conversationInfo.conversation.equal(this.sharedConversationState.currentConversationInfo.conversation)) {
            this.showConversationInfo = false;
            this.ongoingCalls = null;
            if (this.ongoingCallTimer) {
                clearInterval(this.ongoingCallTimer);
                this.ongoingCallTimer = 0;
            }
            this.finished = false;
            this.isFirstPageReady = false;
        }
        this.conversationInfo = this.sharedConversationState.currentConversationInfo;
    },

    computed: {
        conversationTitle() {
            if (this.title) {
                return this.title;
            }
            let info = this.sharedConversationState.currentConversationInfo;
            if (info.conversation._target) {
                if (info.conversation.type === ConversationType.Group) {
                    return info.conversation._target._displayName + " (" + info.conversation._target.memberCount + ")";
                } else {
                    return info.conversation._target._displayName;
                }
            } else {
                return '会话';
            }
        },
        targetUserOnlineStateDesc() {
            let info = this.sharedConversationState.currentConversationInfo;
            if (info.conversation.type === ConversationType.Single && info.conversation.target !== Config.FILE_HELPER_ID) {
                if (!wfc.isMyFriend(info.conversation.target)) {
                    return '你们还不是好友，点击添加好友';
                }
                if (info.conversation._target.type === 0) {
                    return info.conversation._targetOnlineStateDesc;
                } else if (info.conversation._target.type === 1) {
                    return 'bot';
                }
            } else if (info.conversation.type === ConversationType.Channel) {
                return info.conversation._target.desc;
            } else {
                return '';
            }
        },
        loadingIdentifier() {
            let conversation = this.sharedConversationState.currentConversationInfo.conversation;
            return conversation.type + '-' + conversation.target + '-' + conversation.line;
        },
        currentVoiceMessage() {
            let voice = this.sharedConversationState.currentVoiceMessage;
            if (voice) {
                this.playVoice(voice);
            } else {
                if (amr) {
                    amr.stop();
                }
            }
            return null;
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
.conversation-empty-container {
    height: 100%;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: white;
    border-top-right-radius: var(--main-border-radius);
    border-bottom-right-radius: var(--main-border-radius);
    /*border-left: 1px solid #e6e6e6;*/
}

.conversation-empty-container h1 {
    font-size: 17px;
    font-weight: normal;
}

.title-container {
    width: 100%;
    height: 60px;
    display: flex;
    padding: 0 0 0 20px;
    justify-content: space-between;
    align-items: center;
    background-color: #f5f5f5;
    border-bottom: 1px solid #e6e6e6;
    border-top-right-radius: var(--main-border-radius);
    position: relative;
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
    position: relative;
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

.header {
    padding: .5em;
    position: absolute;
    top: 0;
    left: 50%;
    right: auto;
}

.header .finished {
    font-size: 14px;
    text-align: center;
    color: #bfbfbf;
}

.header .spinner {
    font-size: 10px;
    margin: 0px auto;
    text-indent: -9999em;
    width: 15px;
    height: 15px;
    border-radius: 50%;
    background: #ffffff;
    background: linear-gradient(to right, #ccc 10%, rgba(255, 255, 255, 0) 42%);
    position: relative;
    animation: load3 1.4s infinite linear;
    transform: translateZ(0);
}

.header .spinner:before {
    width: 50%;
    height: 50%;
    background: #ccc;
    border-radius: 100% 0 0 0;
    position: absolute;
    top: 0;
    left: 0;
    content: '';
}

.header .spinner:after {
    background: #ffffff;
    width: 75%;
    height: 75%;
    border-radius: 50%;
    content: '';
    margin: auto;
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
}

@-webkit-keyframes load3 {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}

@keyframes load3 {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}

</style>
