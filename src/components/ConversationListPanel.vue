<template>
  <section class="conversation-list-panel-container">
    <div class="search-input-container">
      <input id="searchInput" v-on:focus="onFocus(true)"
             v-model="sharedSearchState.query"
             type="text" placeholder="search"/>
    </div>
    <div class="panel">
      <SearchView v-bind:query="sharedSearchState.query"
                  v-if="sharedSearchState.show"
                  class="search-container"/>
      <ConversationListView class="conversation-list-container"/>
    </div>

  </section>
</template>

<script>
import ConversationListView from "@/components/conversationList/ConversationListView";
import SearchView from "@/components/search/SearchView";
import store from "@/store";

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

    onFocus(focused) {
      store.toggleSearchView(focused)
      this.query = '';
    },
  },
  components: {
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

.search-input-container {
  height: 60px;
  display: flex;
  flex-direction: column;
  background-color: beige;
  justify-content: center;
}

.search-input-container input {
  height: 30px;
  margin-left: 10px;
  margin-right: 10px;
  text-align: center;
}

.panel {
  height: calc(100% - 60px);
  position: relative;
  background-color: #f3f3f3;
  flex: 1;
}

.search-container {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
}


</style>
