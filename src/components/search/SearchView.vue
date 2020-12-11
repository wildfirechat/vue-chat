<template>
  <div class="search-input-container">
    <input id="searchInput"
           autocomplete="off"
           v-on:focus="onFocus(true)"
           v-model="sharedSearchState.query"
           type="text" placeholder="search"/>
  </div>
</template>

<script>
import store from "@/store";

export default {
  name: "SearchView",
  data() {
    return {
      sharedSearchState: store.state.search,
    };
  },
  methods: {
    onFocus(focused) {
      store.toggleSearchView(focused);
    },
  }
}
</script>

<style lang="css" scoped>
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

</style>
