<template>
    <section class="contact-list-panel-container">
        <SearchView :show-add-button="false" :search-type="'contact'"/>
        <div class="panel">
            <ContactListView class="contact-list-container"/>
        </div>

    </section>
</template>

<script>
import SearchView from "./search/SearchView.vue";
import ContactListView from "./contact/ContactListView.vue";
import store from "../../store";

export default {
    name: 'ContactListPanel',
    data() {
        return {
            sharedSearchState: store.state.search,
        };
    },

    methods: {},
    components: {
        ContactListView,
        SearchView,
    },
};
</script>

<style lang="css" scoped>

.contact-list-panel-container {
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--border-primary);
}

.panel {
    height: calc(100% - 60px);
    position: relative;
    background-color: var(--background-secondary);
    overflow-y: auto;
    flex: 1;
}



</style>
