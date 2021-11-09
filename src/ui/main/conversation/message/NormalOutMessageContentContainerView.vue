<template>
    <section>
        <div class="message-time-container" v-bind:class="{checked:sharedPickState.messages.indexOf(message) >= 0}">
            <p v-if="this.message._showTime" class="time">{{ message._timeStr }}</p>
            <div class="message-content-container"
                 v-bind:class="{checked:sharedPickState.messages.indexOf(message) >= 0}">
                <input id="checkbox" v-if="sharedConversationState.enableMessageMultiSelection" type="checkbox"
                       class="checkbox"
                       :value="message" placeholder="" v-model="sharedPickState.messages">

                <div class="message-avatar-content-container">
                    <!-- 文件的进度条有点特殊，有进度的消息的进度条有点特殊 -->
                    <!--          <button>progress...</button>-->
                    <LoadingView v-if="message.status === 0 || isDownloading"/>
                    <i v-if="message.status === 2" class="icon-ion-close-circled" style="color: red" @click="resend"/>
                    <div class="flex-column flex-align-end">
                        <MessageContentContainerView :message="message"
                                                     class="message-content-container-view"
                                                     v-bind:class="{highlight:highLight}"
                                                     @contextmenu.prevent.native="openMessageContextMenu($event, message)"/>
                        <QuoteMessageView v-if="quotedMessage"
                                          style="padding: 5px 0; max-width: 80%"
                                          :message="message"
                                          :quoted-message="quotedMessage"
                                          :enable-message-preview="true"
                                          :message-digest="this.message.messageContent.quoteInfo.messageDigest"
                                          :show-close-button="false"/>
                    </div>

                    <tippy
                        :to="'infoTrigger' + this.message.messageId"
                        interactive
                        :animate-fill="false"
                        placement="left"
                        distant="7"
                        theme="light"
                        animation="fade"
                        trigger="click"
                    >
                        <UserCardView v-on:close="closeUserCard" :user-info="message._from"/>
                    </tippy>

                    <img ref="userCardTippy"
                         :name="'infoTrigger' + this.message.messageId"
                         class="avatar"
                         @click="onClickUserPortrait(message.from)"
                         draggable="false"
                         :src="message._from.portrait">
                </div>
            </div>
            <p v-if="shouldShowMessageReceipt" class="receipt" @click="showMessageReceiptDetail">
                {{ messageReceipt }}</p>
        </div>
    </section>

</template>

<script>
import UserCardView from "@/ui/main/user/UserCardView";
import Message from "@/wfc/messages/message";
import MessageContentContainerView from "@/ui/main/conversation/message/MessageContentContainerView";
import store from "@/store";
import LoadingView from "@/ui/common/LoadingView";
import wfc from "@/wfc/client/wfc";
import ConversationType from "@/wfc/model/conversationType";
import {gte} from "@/wfc/util/longUtil";
import MessageReceiptDetailView from "@/ui/main/conversation/message/MessageReceiptDetailView";
import QuoteMessageView from "@/ui/main/conversation/message/QuoteMessageView";
import Config from "@/config";

export default {
    name: "NormalOutMessageContentView",
    props: {
        message: {
            type: Message,
            required: true,
        },
    },
    data() {
        return {
            sharedConversationState: store.state.conversation,
            sharedPickState: store.state.pick,
            highLight: false,
        }
    },
    components: {
        QuoteMessageView,
        LoadingView,
        MessageContentContainerView,
        UserCardView,
        // TextMessageContentView,

    },
    mounted() {
        this.$parent.$on('contextMenuClosed', () => {
            this.highLight = false;
        })
    },
    methods: {
        onClickUserPortrait(userId) {
            wfc.getUserInfo(userId, true);
        },
        closeUserCard() {
            console.log('closeUserCard', this.$refs["userCardTippy"]);
            this.$refs["userCardTippy"]._tippy.hide();
        },
        resend() {
            wfc.deleteMessage(this.message.messageId);
            wfc.sendMessage(this.message);
        },
        openMessageContextMenu(event, message) {
            this.$parent.$emit('openMessageContextMenu', event, message)
            this.highLight = true;
        },

        showMessageReceiptDetail() {
            let conversation = this.message.conversation;
            if (conversation.type === ConversationType.Single) {
                return;
            }

            let timestamp = this.message.timestamp;
            let deliveries = this.sharedConversationState.currentConversationDeliveries;
            let readEntries = this.sharedConversationState.currentConversationRead;

            if (conversation.type === ConversationType.Group) {
                let groupMembers = wfc.getGroupMemberIds(conversation.target, false);
                if (!groupMembers || groupMembers.length === 0) {
                    // do nothing
                } else {
                    let receivedUserIds = [];
                    let readUserIds = [];
                    let unReceiveUserIds = [];
                    groupMembers.forEach(memberId => {
                        let recvDt = deliveries ? deliveries.get(memberId) : 0;
                        let readDt = readEntries ? readEntries.get(memberId) : 0;
                        if (readDt && gte(readDt, timestamp)) {
                            readUserIds.push(memberId);
                        } else if (recvDt && gte(recvDt, timestamp)) {
                            receivedUserIds.push(memberId)
                        } else {
                            unReceiveUserIds.push(memberId)
                        }
                    });
                    let readUsers = store.getUserInfos(readUserIds, conversation.target)
                    let receivedUsers = store.getUserInfos(receivedUserIds, conversation.target)
                    let unreceiveUsers = store.getUserInfos(unReceiveUserIds, conversation.target)

                    this.$modal.show(
                        MessageReceiptDetailView,
                        {
                            readUsers: readUsers,
                            receivedUsers: receivedUsers,
                            unreceiveUsers: unreceiveUsers,
                        }, {
                            name: 'message-receipt-detail-modal',
                            width: 480,
                            height: 300,
                            clickToClose: true,
                        }, {})
                }
            }
        },
    },

    computed: {
        messageReceipt() {
            let conversation = this.message.conversation;
            let timestamp = this.message.timestamp;
            let receiptDesc = ''
            let deliveries = this.sharedConversationState.currentConversationDeliveries;
            let readEntries = this.sharedConversationState.currentConversationRead;

            if (conversation.type === ConversationType.Single) {
                let readDt = readEntries ? readEntries.get(conversation.target) : 0
                readDt = readDt ? readDt : 0;
                let recvDt = deliveries ? deliveries.get(conversation.target) : 0;
                recvDt = recvDt ? recvDt : 0;

                if (gte(readDt, timestamp)) {
                    receiptDesc = "已读";
                } else if (gte(recvDt, timestamp)) {
                    receiptDesc = "已送达";
                } else {
                    receiptDesc = "未送达";
                }
            } else {
                let groupMembers = wfc.getGroupMemberIds(conversation.target, false);
                if (!groupMembers || groupMembers.length === 0) {
                    receiptDesc = '';
                } else {
                    let memberCount = groupMembers.length;
                    let recvCount = 0;
                    let readCount = 0;

                    let receivedUserIds = [];
                    let readUserIds = [];
                    let unReceiveUserIds = [];
                    groupMembers.forEach(memberId => {
                        let recvDt = deliveries ? deliveries.get(memberId) : 0;
                        let readDt = readEntries ? readEntries.get(memberId) : 0;
                        if (readDt && gte(readDt, timestamp)) {
                            readCount++;
                            readUserIds.push(memberId);
                            recvCount++;
                        } else if (recvDt && gte(recvDt, timestamp)) {
                            recvCount++;
                            receivedUserIds.push(memberId)
                        } else {
                            unReceiveUserIds.push(memberId)
                        }
                    });
                    receiptDesc = `已送达 ${recvCount}/${memberCount}，已读 ${readCount}/${memberCount}`
                }
            }
            return receiptDesc;
        },

        quotedMessage() {
            if (this.message.messageContent.quoteInfo) {
                let messageUid = this.message.messageContent.quoteInfo.messageUid;
                let msg = store.getMessageByUid(messageUid);
                if (!msg) {
                    console.log('quotedMessage, is null', this.message.messageContent.quoteInfo)
                }
                return msg;
            } else {
                return null;
            }
        },

        isDownloading() {
            return store.isDownloadingMessage(this.message.messageId);
        },

        shouldShowMessageReceipt() {
            return this.sharedConversationState.isMessageReceiptEnable && ["FireRobot", Config.FILE_HELPER_ID].indexOf(this.message.conversation.target) < 0;
        }
    },

}
</script>

<style lang="css" scoped>

.message-time-container {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
}

.message-time-container.checked {
    background-color: #e7e7e7;
}

.message-time-container .time {
    width: 100%;
    margin-bottom: 20px;
    text-align: center;
    color: #b4b4b4;
    font-size: 10px;
    background-color: #f3f3f3;
}

.message-time-container .receipt {
    margin-right: 70px;
    font-size: 12px;
    color: #b4b4b4;
}

.message-content-container {
    width: 100%;
    display: flex;
    padding: 10px 20px;
    justify-content: space-between;
    align-items: center;
    position: relative;
}

.message-avatar-content-container {
    display: flex;
    max-width: calc(100% - 60px);
    overflow: hidden;
    /*max-height: 800px;*/
    margin-left: auto;
    text-overflow: ellipsis;
    align-items: flex-start;
}

.message-avatar-content-container .avatar {
    width: 40px;
    height: 40px;
    border-radius: 3px;
}

.message-content-container-view.highlight {
    background-color: #dadada;
    opacity: 0.5;
    --out-arrow-color: #dadada !important;
}

</style>
