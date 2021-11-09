<template>
    <section class="container">
        <div class="message-time-container"
             v-bind:class="{checked:sharedPickState.messages.indexOf(message) >= 0}">
            <p v-if="this.message._showTime" class="time">{{ message._timeStr }}</p>
            <div class="message-avatar-content-container">
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
                <div class="avatar-container">
                    <input id="checkbox" v-if="sharedConversationState.enableMessageMultiSelection" type="checkbox"
                           :value="message"
                           v-model="sharedPickState.messages"/>
                    <img ref="userCardTippy"
                         :name="'infoTrigger' + this.message.messageId"
                         @click="onClickUserPortrait(message.from)"
                         class="avatar"
                         draggable="false"
                         :src="message._from.portrait">
                </div>
                <!--消息内容 根据情况，if-else-->
                <div class="message-name-content-container">
                    <p class="name">{{ message._from._displayName }}</p>
                    <div class="flex-column flex-align-start">
                        <div class="flex-row">
                            <MessageContentContainerView class="message-content-container"
                                                         v-bind:class="{highlight:highLight}"
                                                         :message="message"
                                                         @contextmenu.prevent.native="openMessageContextMenu($event, message)"/>
                            <LoadingView v-if="isDownloading"/>
                        </div>
                        <QuoteMessageView style="padding: 5px 0; max-width: 80%"
                                          v-if="quotedMessage"
                                          :message="message"
                                          :quoted-message="quotedMessage"
                                          :enable-message-preview="true"
                                          :message-digest="this.message.messageContent.quoteInfo.messageDigest"
                                          :show-close-button="false"/>
                    </div>
                </div>
            </div>
        </div>
    </section>

</template>

<script>
import UserCardView from "@/ui/main/user/UserCardView";
import MessageContentContainerView from "@/ui/main/conversation/message/MessageContentContainerView";
import QuoteMessageView from "@/ui/main/conversation/message/QuoteMessageView";
import LoadingView from "@/ui/common/LoadingView";
import store from "@/store";
import wfc from "../../../../wfc/client/wfc";

export default {
    name: "NormalInMessageContentView",
    props: {
        message: null,
    },
    data() {
        return {
            sharedConversationState: store.state.conversation,
            sharedPickState: store.state.pick,
            highLight: false,
        }
    },
    methods: {
        onClickUserPortrait(userId) {
            wfc.getUserInfo(userId, true);
        },
        closeUserCard() {
            console.log('closeUserCard')
            this.$refs["userCardTippy"]._tippy.hide();
        },
        openMessageContextMenu(event, message) {
            this.$parent.$emit('openMessageContextMenu', event, message)
            this.highLight = true;
        }
    },
    mounted() {
        this.$parent.$on('contextMenuClosed', () => {
            this.highLight = false;
        })
    },
    computed: {
        quotedMessage() {
            if (this.message.messageContent.quoteInfo) {
                let messageUid = this.message.messageContent.quoteInfo.messageUid;
                return store.getMessageByUid(messageUid);
            } else {
                return null;
            }
        },
        isDownloading() {
            return store.isDownloadingMessage(this.message.messageId);
        }
    },
    components: {
        MessageContentContainerView,
        UserCardView,
        QuoteMessageView,
        LoadingView
    },
}
</script>

<style lang="css" scoped>

.container {
    display: flex;
    align-items: flex-start;
}

.message-time-container {
    width: 100%;
    display: flex;
    flex-direction: column;
    padding: 10px 20px;
    align-items: flex-start;
}

.message-time-container .time {
    align-self: center;
    margin-bottom: 20px;
    color: #b4b4b4;
    height: 20px;
    font-size: 10px;
}

.message-time-container.checked {
    background-color: #e7e7e7;
}

.message-avatar-content-container {
    display: flex;
    max-width: calc(100% - 60px);
    align-items: flex-start;
    overflow: hidden;
    /*max-height: 800px;*/
    text-overflow: ellipsis;
}

.avatar-container .avatar {
    width: 40px;
    height: 40px;
    border-radius: 3px;
}

.avatar-container {
    display: flex;
    padding-left: 2px;
    align-items: center;
}

.avatar-container input {
    margin-right: 20px;
    flex: 1;
}

.message-name-content-container {
    display: flex;
    flex-direction: column;
    justify-content: space-around;
}

.message-name-content-container .name {
    margin-left: 10px;
    color: #bdbdbd;
    font-size: 12px;
    margin-bottom: 2px;
}

.message-content-container.highlight {
    background-color: #dadada;
    opacity: 0.5;
    --in-arrow-color: #dadada !important;
}

</style>
