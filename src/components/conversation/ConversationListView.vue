<template>
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
</template>

<script>

export default {
  name: 'ConversationListView',
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
  components: {},
};
</script>

<style lang="css" scoped>

</style>
