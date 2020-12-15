<template>
  <section>
    <div class="message-time-container">
      <p class="time">16:57</p>
      <div class="message-avatar-content-container">
        <!--消息内容 根据情况，if-else，并根据情况添加right-arrow-->
        <!--        <TextMessageContentView class="right-arrow right-arrow-primary-color"/>-->
        <MessageContentContainerView :message="message"/>
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
            <UserCardView v-on:close="closeUserCard" :user-info="{name:'Imndx'}"/>
          </tippy>
          <img ref="userCardTippy"
               :name="'infoTrigger' + this.message.messageId"
               class="avatar"
               src="@/assets/images/user-fallback.png">
        </div>
      </div>
    </div>
  </section>

</template>

<script>
import ImageMessageContentView from "@/components/conversation/message/content/ImageMessageContentView";
import UserCardView from "@/components/user/UserCardView";
import Message from "@/wfc/messages/message";
import TextMessageContentView from "@/components/conversation/message/content/TextMessageContentView";
import MessageContentContainerView from "@/components/conversation/message/MessageContentContainerView";

export default {
  name: "NormalOutMessageContentView",
  props: {
    message: {
      type: Message,
      required: true,
    },
  },
  components: {
    MessageContentContainerView,
    TextMessageContentView,
    ImageMessageContentView,
    UserCardView,
    // TextMessageContentView,

  },
  methods: {
    closeUserCard() {
      console.log('closeUserCard')
      this.$refs["userCardTippy"]._tippy.hide();
    },
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

.message-avatar-content-container {
  display: flex;
  max-width: calc(100% - 60px);
  align-items: flex-start;
  overflow: hidden;
  max-height: 800px;
  text-overflow: ellipsis;
}

.message-avatar-content-container .avatar {
  width: 40px;
  height: 40px;
  border-radius: 3px;
}

</style>
