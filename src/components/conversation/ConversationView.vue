<template>
  <section>
    <div v-if="conversation == null" class="empty">
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
        <div class="conversation-message-list">
          <ul>
            <!--todo item.messageId or messageUid as key-->
            <li v-for="item in messages" :key="item">
              {{ conversation + " " + item }}
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

export default {
  components: {
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
      messages: [1, 2, 3, 4, 5],
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
.title-container {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.conversation-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.conversation-content-container {
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
}

.conversation-message-list {
  flex: 1;
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
