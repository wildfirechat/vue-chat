<template>
  <section class="conversation-page">
    <ConversationListPanel class="conversation-list-panel-container"/>
    <ConversationView class="conversation-container"/>
  </section>
</template>

<script>
import ConversationView from "./conversation/ConversationView";
import ConversationListPanel from "@/components/ConversationListPanel";

export default {
  data() {
    return {
      currentConversation: null,
      conversationList: [1, 2, 3, 4, 5, 6, 7]
    };
  },

  methods: {
    showConversation(conversation) {
      this.currentConversation = conversation;
      console.log("show conversation", conversation);
    },
  },
  components: {
    ConversationListPanel,
    ConversationView,
  },
};
</script>

<style lang="css" scoped>
.conversation-page {
  flex: 1;
  display: flex;
  height: 100%;
}

.conversation-list-panel-container {
  width: 250px;
  background-color: azure;
}

.conversation-container {
  flex: 1;
  background-color: beige;
}

</style>
