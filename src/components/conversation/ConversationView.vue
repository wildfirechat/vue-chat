<template>
  <section>
    <div v-if="sharedConversationState.currentConversation == null" class="conversation-empty-container">
      <h2>no conversation is select</h2>
    </div>
    <div v-else class="conversation-container">
      <header>
        <div class="title-container">
          <h1>{{ sharedConversationState.currentConversation._target.name }}</h1>
          <a href="#"><img ref="setting" @click="toggleConversationInfo" src="" alt="setting"/></a>
        </div>
      </header>
      <div ref="conversationContentContainer" class="conversation-content-container">
        <div ref="conversationMessageList" class="conversation-message-list" v-on:scroll="onScroll">
          <ul>
            <!--todo item.messageId or messageUid as key-->
            <li v-for="(message) in sharedConversationState.currentConversationMessageList"
                :key="message.messageId">
              <!--todo 不同的消息类型 notification in out-->

              <NotificationMessageContentView :message="message" v-if="isNotificationMessage(message)"/>
              <NormalOutMessageContentView :message="message"
                                           v-else-if="isNormalOutMessage(message)"/>
              <NormalInMessageContentView :message="message" v-else/>
            </li>
          </ul>
        </div>
        <div v-on:mousedown="dragStart" class="handler"></div>
        <MessageInputView class="message-input-container"/>
        <SingleConversationInfoView
            v-if="sharedConversationState.currentConversation === 1"
            v-click-outside="hideConversationInfo"
            v-bind:class="{ active: showConversationInfo }"
            class="conversation-info-container"
        />
        <GroupConversationInfoView
            v-click-outside="hideConversationInfo"
            v-if="sharedConversationState.currentConversation === 2"
            v-bind:class="{ active: showConversationInfo }"
            class="conversation-info-container"
        />
      </div>
    </div>
  </section>
</template>

<script>
import SingleConversationInfoView from "@/components/conversation/SingleConversationInfoView";
import GroupConversationInfoView from "@/components/conversation/GroupConversationInfoView";
import MessageInputView from "@/components/conversation/MessageInputView";
import ClickOutside from 'vue-click-outside'
import NormalOutMessageContentView from "@/components/conversation/message/NormalOutMessageContentContainerView";
import NormalInMessageContentView from "@/components/conversation/message/NormalInMessageContentContainerView";
import NotificationMessageContentView from "@/components/conversation/message/NotificationMessageContentView";
import NotificationMessageContent from "@/wfc/messages/notification/notificationMessageContent";
import store from "@/store";

export default {
  components: {
    NotificationMessageContentView,
    NormalInMessageContentView,
    NormalOutMessageContentView,
    MessageInputView,
    GroupConversationInfoView,
    SingleConversationInfoView,
  },
  // props: ["conversation"],
  data() {
    return {
      showConversationInfo: false,
      isInviteConversationMember: false,
      isShowConversationMember: false,
      sharedConversationState: store.state.conversation,
      isHandlerDragging: false,
    };
  },

  methods: {
    toggleConversationInfo() {
      console.log("toggle conversationInfo");
      this.showConversationInfo = !this.showConversationInfo;
    },
    hideConversationInfo() {
      // TODO
      // 是否在创建群聊，或者是在查看会话参与者信息
      this.showConversationInfo && (this.showConversationInfo = false);
      console.log('hide conv')
    },

    isNormalOutMessage(message) {
      if (!this.isNotificationMessage(message)) {
        return message.direction === 0;
      }
      return false;
    },

    isNormalInMessage(message) {
      if (!this.isNotificationMessage(message)) {
        return message.direction === 1;
      }
      return false;
    },

    isNotificationMessage(message) {
      return message.messageContent instanceof NotificationMessageContent;
    },

    onScroll() {
      for (const popper of document.querySelectorAll('.tippy-popper')) {
        const instance = popper._tippy;
        if (instance.state.isVisible) {
          instance.hide();
        }
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

    },

    dragEnd() {
      this.isHandlerDragging = false;
    }
  },

  mounted() {
    this.popupItem = this.$refs['setting'];
    document.addEventListener('mouseup', this.dragEnd);
    document.addEventListener('mousemove', this.drag);
  },

  unmounted() {
    document.removeEventListener('mouseup', this.dragEnd);
    document.removeEventListener('mousemove', this.drag);

  },

  created() {
    console.log("conversationView created", this.conversation);
  },

  updated() {
    console.log("conversationView updated", this.conversation);
    this.popupItem = this.$refs['setting'];
  },

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
  /*border-left: 1px solid #e6e6e6;*/
}

.title-container {
  width: 100%;
  height: 60px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f5f5f5;
  border-bottom: 1px solid #e6e6e6;
}

.conversation-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  border-left: 1px solid #e6e6e6;
}

.conversation-content-container {
  flex: 1;
  height: calc(100% - 60px);
  position: relative;
  display: flex;
  flex-direction: column;
  background-color: #f3f3f3;
}

.conversation-message-list {
  flex: 1 1 auto;
  overflow: auto;
}

.conversation-message-list ul {
  list-style: none;
}

/*.handler {*/
/*  height: 1px;*/
/*  background-color: #e2e2e2;*/
/*}*/

.handler::before {
  cursor: row-resize;
  content: '';
  display: block;
  width: 100%;
  height: 3px;
  border-top: 1px solid #e2e2e2;
  margin: 0 auto;
}

.message-input-container {
  flex: 1 1 auto;
  height: 200px;
  min-height: 150px;
}

.conversation-info-container {
  display: none;
  width: 250px;
  height: 100%;
  top: 0;
  right: 0;
  position: absolute;
  background-color: aquamarine;
}

.conversation-info-container.active {
  display: block;
}
</style>
