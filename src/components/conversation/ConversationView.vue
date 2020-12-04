<template>
  <section>
    <div v-if="conversation == null" class="empty">
      <h2>no conversation is select</h2>
    </div>
    <div v-else class="conversation-container">
      <header>
        <div class="title-container">
          <h1>Conv title {{ conversation }}</h1>
          <a href="#"><img @click="toggleConversationInfo" src="" alt="setting"/></a>
        </div>
      </header>
      <div class="conversation-content-container">
        <div class="conversation-message-list">
          <ul>
            <!--todo item.messageId or messageUid as key-->
            <li v-for="item in messages" :key="item">{{ conversation + ' ' + item }}</li>
          </ul>
        </div>
        <MessageInputView class="message-input-container"/>
        <SingleConversationInfoView v-if="conversation === 1"
                                    v-bind:class="{active:showConversationInfo}"
                                    class="conversation-info-container"/>
        <GroupConversationInfoView v-if="conversation === 2 "
                                   v-bind:class="{active:showConversationInfo}"
                                   class="conversation-info-container"/>
      </div>
    </div>
  </section>
</template>

<script>
import UIEventType from "@/UIEventType";
import SingleConversationInfoView from "@/components/conversation/SingleConversationInfoView";
import GroupConversationInfoView from "@/components/conversation/GroupConversationInfoView";
import MessageInputView from "@/components/conversation/MessageInputView";

export default {
  components: {MessageInputView, GroupConversationInfoView, SingleConversationInfoView},
  // props: ["conversation"],
  data() {
    return {
      conversation: null,
      showConversationInfo: false,
      messages: [1, 2, 3, 4, 5],
    };
  },

  methods: {
    toggleConversationInfo() {
      console.log('toggle conversationInfo');
      this.showConversationInfo = !this.showConversationInfo;
    }
  },

  mounted() {
    this.$root.$on(UIEventType.currentConversation, (arg) => {
      this.conversation = arg;
    });
  },

  created() {
    console.log("conversationView created", this.conversation);
  },

  updated() {
    console.log("conversationView updated", this.conversation);
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
  background-color: blueviolet;
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
