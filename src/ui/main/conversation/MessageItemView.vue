<template>
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
</template>

<script>
import NotificationMessageContentView from "./message/NotificationMessageContentView.vue";
import RecallNotificationMessageContentView from "./message/RecallNotificationMessageContentView.vue";
import ContextableNotificationMessageContentContainerView from "./message/ContextableNotificationMessageContentContainerView.vue";
import NormalOutMessageContentView from "./message/NormalOutMessageContentContainerView.vue";
import NormalInMessageContentView from "./message/NormalInMessageContentContainerView.vue";
import store from "../../../store";
import {currentWindow} from "../../../platform";
import NotificationMessageContent from "../../../wfc/messages/notification/notificationMessageContent";
import MessageContentType from "../../../wfc/messages/messageContentType";
import RichNotificationMessageContent from "../../../wfc/messages/notification/richNotificationMessageContent";
import ArticlesMessageContent from "../../../wfc/messages/articlesMessageContent";
import MediaMessageContent from "../../../wfc/messages/mediaMessageContent";
import MessageStatus from "../../../wfc/messages/messageStatus";

export default {
    name: "MessageItemView",
    components: {
        NormalInMessageContentView,
        NormalOutMessageContentView,
        ContextableNotificationMessageContentContainerView,
        RecallNotificationMessageContentView,
        NotificationMessageContentView
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
    methods: {
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

        clickMessageItem(event, message) {
            if (message.messageContent instanceof NotificationMessageContent) {
                return;
            }
            if (this.sharedConversationState.enableMessageMultiSelection) {
                store.selectOrDeselectMessage(message);
                event.stopPropagation();
            }
        },
    }
}
</script>
<style scoped lang="css">

</style>