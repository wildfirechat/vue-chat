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
import ConversationListView from "@/ui/main/conversationList/ConversationListView";
import store from "@/store";
import SearchResultView from "@/ui/main/search/SearchResultView";
import SearchView from "@/ui/main/search/SearchView";

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
    border-right: 1px solid #e5e5e5;
}

.panel {
    height: calc(100% - 60px);
    max-height: calc(100% - 60px);
    position: relative;
    background-color: #f3f3f3;
    overflow-y: auto;
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
