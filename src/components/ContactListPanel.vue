<template>
  <section class="contact-list-panel-container">
    <div class="search-input-container">
      <input v-on:focus="onFocus(true)"
             v-on:blur="onFocus(false)"
             v-model="query"
             type="text" placeholder="search"/>
    </div>
    <div class="panel">
      <SearchView v-bind:query="query"
                  v-bind:class="{active:focused}"
                  v-if="focused"
                  class="search-container"/>
      <ContactListView class="contact-list-container"/>
    </div>

  </section>
</template>

<script>
import SearchView from "@/components/SearchView";
import ContactListView from "@/components/contact/ContactListView";

export default {
  name: 'ContactListPanel',
  data() {
    return {
      query: null,
      focused: false,
      currentContact: null,
    };
  },

  methods: {
    showContact(contact) {
      this.currentContact = contact;
      console.log("show contact", contact);
      // TODO
    },
    onFocus(focused) {
      this.focused = focused;
      console.log('on foucs', focused)
      this.query = '';
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
