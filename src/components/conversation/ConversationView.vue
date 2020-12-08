<template>
  <section>
    <div v-if="conversation == null" class="conversation-empty-container">
      <h2>no conversation is select</h2>
    </div>
    <div v-else class="conversation-container">
      <header>
        <div class="title-container">
          <h1>Conv title {{ conversation }}</h1>
          <a href="#"><img ref="setting" @click="toggleConversationInfo" src="" alt="setting"/></a>
        </div>
      </header>
      <div class="conversation-content-container">
        <div class="conversation-message-list" v-on:scroll="onScroll">
          <ul>
            <!--todo item.messageId or messageUid as key-->
            <li v-for="(item,index) in messages" :key="item">
              <!--todo 不同的消息类型 notification in out-->

              <NormalOutMessageContentView :index="index" v-if="index %3 === 0"/>
              <NormalInMessageContentView :index="index" v-if="index %3 === 1"/>
              <NotificationMessageContentView v-if="index %3 === 1"/>
            </li>
          </ul>
        </div>
        <MessageInputView class="message-input-container"/>
        <SingleConversationInfoView
            v-if="conversation === 1"
            v-click-outside="hideConversationInfo"
            v-bind:class="{ active: showConversationInfo }"
            class="conversation-info-container"
        />
        <GroupConversationInfoView
            v-click-outside="hideConversationInfo"
            v-if="conversation === 2"
            v-bind:class="{ active: showConversationInfo }"
            class="conversation-info-container"
        />
      </div>
    </div>
  </section>
</template>

<script>
import UIEventType from "@/UIEventType";
import SingleConversationInfoView from "@/components/conversation/SingleConversationInfoView";
import GroupConversationInfoView from "@/components/conversation/GroupConversationInfoView";
import MessageInputView from "@/components/conversation/MessageInputView";
import ClickOutside from 'vue-click-outside'
import NormalOutMessageContentView from "@/components/conversation/message/NormalOutMessageContentContainerView";
import NormalInMessageContentView from "@/components/conversation/message/NormalInMessageContentContainerView";
import NotificationMessageContentView from "@/components/conversation/message/NotificationMessageContentView";

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
      conversation: null,
      showConversationInfo: false,
      isInviteConversationMember: false,
      isShowConversationMember: false,
      messages: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 120],
      // messages: [1, 2, 3],
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
      console.log('hide')
    },
    onScroll() {
      for (const popper of document.querySelectorAll('.tippy-popper')) {
        const instance = popper._tippy;
        if (instance.state.isVisible) {
          instance.hide();
        }
      }
    }
  },

  mounted() {
    this.$root.$on(UIEventType.currentConversation, (arg) => {
      this.conversation = arg;
    });
    this.popupItem = this.$refs['setting'];
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
  border-left: 1px solid #e6e6e6;
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
  flex: 1;
  height: 100%;
  overflow: auto;
}

.conversation-message-list ul {
  list-style: none;
}

.message-input-container {
  margin-top: auto;
  height: 200px;
  background-color: pink;
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
