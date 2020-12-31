<template>
  <section>
    <div class="message-time-container">
      <p v-if="this.message._showTime" class="time">{{ message._timeStr }}</p>
      <div class="message-content-container">
        <input id="checkbox" v-if="sharedConversationState.enableMessageMultiSelection" type="checkbox" class="checkbox"
               :value="message" placeholder="" v-model="sharedConversationState.selectedMessages">

        <div class="message-avatar-content-container">
          <!-- 文件的进度条有点特殊，有进度的消息的进度条有点特殊 -->
          <!--          <button>progress...</button>-->
          <LoadingView v-if="message.status === 0"/>
          <i v-if="message.status === 2" class="icon-ion-close-circled" style="color: red" @click="resend"/>
          <MessageContentContainerView :message="message"
                                       @contextmenu.prevent.native="openMessageContextMenu($event, message)"/>
          <div>
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
                 src="@/assets/images/user-fallback.png">
          </div>
        </div>
      </div>
      <p v-show="false" class="receipt">已读回执</p>
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
    }
  },
  components: {
    LoadingView,
    MessageContentContainerView,
    UserCardView,
    // TextMessageContentView,

  },
  methods: {
    closeUserCard() {
      console.log('closeUserCard')
      this.$refs["userCardTippy"]._tippy.hide();
    },
    resend() {
      wfc.deleteMessage(this.message.messageId);
      wfc.sendMessage(this.message);
    },
    openMessageContextMenu(event, message) {
      this.$parent.$emit('openMessageContextMenu', event, message)
    }
  }

}
</script>

<style lang="css" scoped>

.message-time-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  padding: 10px 20px;
  align-items: flex-end;
}

.message-time-container .time {
  align-self: center;
  margin-bottom: 20px;
  color: #b4b4b4;
  font-size: 10px;
}

.message-time-container .receipt {
  margin-right: 50px;
}

.message-content-container {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
}

.message-avatar-content-container {
  display: flex;
  max-width: calc(100% - 60px);
  overflow: hidden;
  max-height: 800px;
  margin-left: auto;
  text-overflow: ellipsis;
  align-items: center;
}

.message-avatar-content-container .avatar {
  width: 40px;
  height: 40px;
  border-radius: 3px;
}

</style>
