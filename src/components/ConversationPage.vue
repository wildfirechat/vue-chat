<template>
  <section class="conversation-page">
    <section class="conversation-list-container">
      <div>
        <input type="text" placeholder="search"/>
      </div>
      <section class="conversation-list">
        <ul>
          <li
              @click="showConversation(conversation)"
              v-for="conversation in conversationList"
              :key="conversation"
          >
            {{ conversation }}
          </li>
        </ul>
      </section>
    </section>
    <ConversationView
        v-bind:conversation="currentConversation"
        class="conversation-container"

    />
  </section>
</template>

<script>
import ConversationView from "./conversation/ConversationView";

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

.conversation-list-container {
  width: 250px;
  background-color: azure;
}

.conversation-container {
  flex: 1;
  background-color: beige;
}

</style>
