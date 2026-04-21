<template>
    <section class="conversation-list-panel-container">
        <SearchView/>
        <div class="panel">
            <ConversationListView class="conversation-list-container"/>
        </div>

    </section>
</template>

<script>
import ConversationListView from "./conversationList/ConversationListView.vue";
import store from "../../store";
import SearchView from "./search/SearchView.vue";

export default {
    name: 'ConversationListPanel',
    data() {
        return {
            sharedSearchState: store.state.search,
        };
    },

    methods: {
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
    border-right: 1px solid var(--border-primary);
}

.panel {
    height: calc(100% - 60px);
    max-height: calc(100% - 60px);
    position: relative;
    background-color: var(--background-tertiary);
    overflow-y: auto;
    flex: 1;
}



</style>
