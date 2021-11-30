<template>
    <section class="contact-list-panel-container">
        <SearchView/>
        <div class="panel">
            <SearchResultView v-bind:query="sharedSearchState.query"
                              v-if="sharedSearchState.show"
                              class="search-result-container"/>
            <ContactListView class="contact-list-container"/>
        </div>

    </section>
</template>

<script>
import SearchView from "@/ui/main/search/SearchView";
import ContactListView from "@/ui/main/contact/ContactListView";
import store from "@/store";
import SearchResultView from "@/ui/main/search/SearchResultView";

export default {
    name: 'ContactListPanel',
    data() {
        return {
            sharedSearchState: store.state.search,
        };
    },

    methods: {},
    components: {
        SearchResultView,
        ContactListView,
        SearchView,
    },
};
</script>

<style lang="css" scoped>

.contact-list-panel-container {
    display: flex;
    flex-direction: column;
    border-right: 1px solid #e5e5e5;
}

.panel {
    height: calc(100% - 60px);
    position: relative;
    background-color: #fafafa;
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
