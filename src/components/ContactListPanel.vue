<template>
  <section class="contact-list-panel-container">
    <div class="search-input-container">
      <input id="searchInput" v-on:focus="onFocus(true)"
             v-model="sharedSearchState.query"
             type="text" placeholder="search"/>
    </div>
    <div class="panel">
      <SearchView v-bind:query="sharedSearchState.query"
                  v-if="sharedSearchState.show"
                  class="search-container"/>
      <ContactListView class="contact-list-container"/>
    </div>

  </section>
</template>

<script>
import SearchView from "@/components/search/SearchResultView";
import ContactListView from "@/components/contact/ContactListView";
import store from "@/store";

export default {
  name: 'ContactListPanel',
  data() {
    return {
      sharedSearchState: store.state.search,
    };
  },

  methods: {
    onFocus(focused) {
      store.toggleSearchView(focused);
    },
  },
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
  border-right: 1px solid #f0f0f0;
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
  background-color: #fafafa;
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
