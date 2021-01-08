<template>
  <section class="container">
    <div class="message-time-container">
      <p v-if="this.message._showTime" class="time">{{ message._timeStr }}</p>
      <div class="message-avatar-content-container">
        <div class="avatar-container">
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
          <input id="checkbox" v-if="sharedConversationState.enableMessageMultiSelection" type="checkbox"
                 :value="message"
                 v-model="sharedConversationState.selectedMessages"/>
          <img ref="userCardTippy"
               :name="'infoTrigger' + this.message.messageId"
               class="avatar"
               :src="message._from.portrait">
        </div>
        <!--消息内容 根据情况，if-else-->
        <div class="message-name-content-container">
          <p class="name">{{ message._from.displayName }}</p>
          <div class="flex-column flex-align-start">
            <MessageContentContainerView :message="message"
                                         @contextmenu.prevent.native="openMessageContextMenu($event, message)"/>
            <QuoteMessageView style="padding: 5px 0; max-width: 80%"
                              v-if="quotedMessage"
                              :message="quotedMessage"
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
import store from "@/store";
import wfc from "@/wfc/client/wfc";

export default {
  name: "NormalInMessageContentView",
  props: {
    message: null,
  },
  data() {
    return {
      sharedConversationState: store.state.conversation,
    }
  },
  methods: {
    closeUserCard() {
      console.log('closeUserCard')
      this.$refs["userCardTippy"]._tippy.hide();
    },
    openMessageContextMenu(event, message) {
      this.$parent.$emit('openMessageContextMenu', event, message)
    }
  },
  computed: {
    quotedMessage() {
      if (this.message.messageContent.quoteInfo) {
        let messageUid = this.message.messageContent.quoteInfo.messageUid;
        return wfc.getMessageByUid(messageUid);
      } else {
        return null;
      }
    }
  },
  components: {
    MessageContentContainerView,
    UserCardView,
    QuoteMessageView,
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

.message-avatar-content-container {
  display: flex;
  max-width: calc(100% - 60px);
  align-items: flex-start;
  overflow: hidden;
  max-height: 800px;
  text-overflow: ellipsis;
}

.avatar-container .avatar {
  width: 40px;
  height: 40px;
  border-radius: 3px;
}

.avatar-container {
  display: flex;
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

</style>
