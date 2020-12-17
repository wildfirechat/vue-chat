<template>
  <div class="search-input-container">
    <input id="searchInput"
           autocomplete="off"
           v-on:focus="onFocus(true)"
           v-model="sharedSearchState.query"
           type="text" placeholder="search"/>
    <button @click="showCreateConversationModal">+</button>
  </div>
</template>

<script>
import store from "@/store";
import PickContactView from "@/ui/components/pick/PickContactView";

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

    showCreateConversationModal() {
      this.$modal.show(
          PickContactView,
          {
            contacts: [{name: 2, uid: 'u1'}, {name: 2, uid: 'u2'}, {name: 3, uid: 'u3'}, {name: 4, uid: 'u4'}, {name: 5, uid: 'u5'}, {name: 6, uid: 'u6'}, {name: 7, uid: 'u7'}, {name: 8, uid: 'u9'}, {name: 10, uid: 'u10'}, {name: 11, uid: 'u11'}, {name: 12, uid: 'u12'}]
          }, {
            name: 'invite-modal',
            width: 600,
            height: 480,
            clickToClose: false,
          }, {
            'before-open': this.beforeOpen,
            'before-close': this.beforeClose,
            'closed': this.closed,
          })
    },
    beforeOpen(event) {
      console.log('Opening...')
    },
    beforeClose(event) {
      console.log('Closing...', event, event.params)
      // What a gamble... 50% chance to cancel closing
    },
    closed(event) {
      console.log('Close...', event)
    }
  }
}
</script>

<style lang="css" scoped>
.search-input-container {
  height: 60px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #fafafa;
}

.search-input-container input {
  height: 25px;
  margin-left: 10px;
  margin-right: 10px;
  text-align: center;
  flex: 1;
  border: 1px solid #e5e5e5;
  border-radius: 3px;
  background-color: #eeeeee;
}

.search-input-container button {
  width: 30px;
  height: 25px;
  margin-right: 10px;
  background-color: #fafafa;
  border-radius: 3px;
  border: 1px solid #e5e5e5;
}

.search-input-container button:active {
  background-color: #e5e5e5;
}

</style>
