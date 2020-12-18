<template>
  <section>
    <div class="message-time-container">
      <p v-if="this.message._showTime" class="time">{{ message._timeStr }}</p>
      <div class="message-avatar-content-container">
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
               :src="message._from.portrait">
        </div>
        <!--消息内容 根据情况，if-else-->
        <div class="message-name-content-container">
          <p class="name">{{ message._from.displayName }}</p>
          <MessageContentContainerView :message="message"
                                       @contextmenu.prevent.native="openMessageContextMenu($event, message)"
          />
        </div>
      </div>
    </div>
  </section>

</template>

<script>
import UserCardView from "@/ui/main/user/UserCardView";
import MessageContentContainerView from "@/ui/main/conversation/message/MessageContentContainerView";

export default {
  name: "NormalInMessageContentView",
  props: {
    message: null,
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
  components: {
    MessageContentContainerView,
    UserCardView,
  },
}
</script>

<style lang="css" scoped>

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
