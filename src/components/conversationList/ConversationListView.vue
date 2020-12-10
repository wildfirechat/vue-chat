<template>
  <section class="conversation-list">
    <ul>
      <li
          @click="showConversation(conversation)"
          v-for="conversation in conversationList"
          :key="conversation"
          v-bind:class="{active:/*TODO conversation 比较*/ sharedConversationState.currentConversation === conversation}"
          @contextmenu.prevent="$refs.menu.open($event,conversation)"
      >
        <ConversationItemView/>
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

import ConversationItemView from "@/components/conversationList/ConversationItemView";
import store from "@/store";

export default {
  name: 'ConversationListView',
  data() {
    return {
      conversationList: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      sharedConversationState: store.state.conversation,
    };
  },

  methods: {
    showConversation(conversation) {
      store.setCurrentConversation(conversation);
    },
    onClick(v) {
      console.log('test', v)
    }
  },
  components: {
    ConversationItemView,
  },
};
</script>

<style lang="css" scoped>

.conversation-list {
  height: 100%;
  overflow: auto;
}

.conversation-list ul li {
  background-color: #fbfbfb;
}

/*.conversation-list ul li:hover {*/
/*  background-color: #d6d6d6;*/
/*}*/

.conversation-list ul li.active {
  background-color: #d6d6d6;
}

.conversation-list ul li.top {
  background-color: #f1f1f1;

}

</style>
