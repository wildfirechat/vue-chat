<template>
  <section class="conversation-list">
    <ul>
      <li
          @click="showConversation(conversation)"
          v-for="conversation in conversationList"
          :key="conversation"
          @contextmenu.prevent="$refs.menu.open($event,conversation)"
      >
        {{ conversation }}
      </li>
    </ul>
    <vue-context ref="menu" v-slot="{data}">
<!--      TODO -->
      <li v-if="data === 1">
        <a @click.prevent="onClick(data)">Option 1</a>
      </li>
      <li>
        <a @click.prevent="onClick(data)">Option 2</a>
      </li>
    </vue-context>
  </section>
</template>

<script>

import UIEventType from "@/UIEventType";

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
      this.$root.$emit(UIEventType.currentConversation, conversation)
    },
    onClick(v) {
      console.log('test', v)
    }
  },
  components: {},
};
</script>

<style lang="css" scoped>

</style>
