<template>
  <section class="conversation-list">
    <ul>
      <li
          @click="showConversation(conversationInfo)"
          v-for="conversationInfo in sharedConversationState.conversationInfoList"
          :key="conversationInfoKey(conversationInfo)"
          v-bind:class="{active: sharedConversationState.currentConversationInfo && sharedConversationState.currentConversationInfo.conversation === conversationInfo.conversation,
                          top:conversationInfo.isTop}"
          @contextmenu.prevent="$refs.menu.open($event,conversationInfo)"
      >
        <ConversationItemView :conversation-info="conversationInfo"/>
      </li>
    </ul>


    <vue-context ref="menu" v-slot="{data:conversationInfo}">
      <li>
        <a @click.prevent="setConversationTop(conversationInfo)">{{
            conversationInfo && conversationInfo.isTop ? '取消置顶' : '置顶'
          }}</a>
      </li>
      <li>
        <a @click.prevent="setConversationSilent(conversationInfo)">{{
            conversationInfo && conversationInfo.isSilent ? '允许消息通知' : '消息免打扰'
          }}</a>
      </li>
      <li>
        <a @click.prevent="removeConversation(conversationInfo)">删除</a>
      </li>
    </vue-context>
  </section>
</template>

<script>

import ConversationItemView from "@/ui/main/conversationList/ConversationItemView";
import store from "@/store";

export default {
  name: 'ConversationListView',
  data() {
    return {
      sharedConversationState: store.state.conversation,
    };
  },

  methods: {
    showConversation(conversationInfo) {
      store.setCurrentConversationInfo(conversationInfo);
    },

    setConversationTop(conversationInfo) {
      store.setConversationTop(conversationInfo.conversation, !conversationInfo.isTop);
    },

    setConversationSilent(conversationInfo) {
      store.setConversationSilent(conversationInfo.conversation, !conversationInfo.isSilent);
    },

    removeConversation(conversationInfo) {
      store.removeConversation(conversationInfo.conversation);
    },

    conversationInfoKey(conversationInfo) {
      let conv = conversationInfo.conversation;
      return conv.target + '-' + conv.type + '-' + conv.line;
    },
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

.conversation-list ul li.active.top {
  background-color: #d6d6d6;
}

</style>
