<template>
  <section class="conversation-list-panel-container">
    <SearchView/>
    <div class="panel">
      <SearchResultView v-bind:query="sharedSearchState.query"
                        v-if="sharedSearchState.show"
                        class="search-result-container"/>
      <ConversationListView class="conversation-list-container"/>
    </div>

  </section>
</template>

<script>
import ConversationListView from "@/components/conversationList/ConversationListView";
import store from "@/store";
import SearchResultView from "@/components/search/SearchResultView";
import SearchView from "@/components/search/SearchView";

export default {
  name: 'ConversationListPanel',
  data() {
    return {
      sharedSearchState: store.state.search,
    };
  },

  methods: {
    showConversation(conversation) {
      this.currentConversation = conversation;
      console.log("show conversation", conversation);
      // TODO
    },
  },
  components: {
    SearchResultView,
    ConversationListView,
    SearchView,
  },
};
</script>

<style lang="css" scoped>

.conversation-list-panel-container {
  display: flex;
  flex-direction: column;
}

.panel {
  height: calc(100% - 60px);
  position: relative;
  background-color: #f3f3f3;
  flex: 1;
}

.search-result-container {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
}


</style>
