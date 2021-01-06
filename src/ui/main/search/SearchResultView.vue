<template>
  <section class="search-result-container"
           v-if="sharedSearchState.show"
           v-bind:class="{active:sharedSearchState.show}"
           v-click-outside="hideSearchView">
    <div class="search-result">
      <ul>
        <li class="category-item" v-if="sharedSearchState.contactSearchResult.length > 0">
          <label>联系人</label>
          <ul>
            <li v-for="(contact, index) in toShowContactList" :key="index">
              <div class="search-result-item contact" @click.stop="chatToContact(contact)">
                <img :src="contact.portrait">
                <span>{{ contact._displayName }}</span>
              </div>
            </li>
          </ul>
          <div v-if="!shouldShowAllContact && this.sharedSearchState.contactSearchResult.length > 5"
               class="show-all"
               @click.stop="showAllContact">
            查看全部({{ this.sharedSearchState.contactSearchResult.length }})
          </div>
        </li>
        <li class="category-item" v-if="sharedSearchState.groupSearchResult.length > 0">
          <label>群聊</label>
          <ul>
            <li v-for="(group, index) in toShowGroupList" :key="index">
              <div class="search-result-item group" @click="chatToGroup(group)">
                <img :src="group.portrait">
                <span>{{ group.name }}</span>
              </div>
            </li>
          </ul>
          <div v-if="!shouldShowAllGroup && this.sharedSearchState.groupSearchResult.length > 5"
               class="show-all"
               @click.stop="showAllGroup">
            查看全部({{ this.sharedSearchState.groupSearchResult.length }})
          </div>
        </li>
        <li class="category-item" v-if="sharedSearchState.messageSearchResult.length > 0">
          <label>聊天记录</label>
          <div class="search-result-item message">
            搜索聊天记录...
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>

<script>
import ClickOutside from "vue-click-outside";
import store from "@/store";
import Conversation from "@/wfc/model/conversation";
import ConversationType from "@/wfc/model/conversationType";

export default {
  name: "SearchResultView",
  props: [
    "query"
  ],
  data() {
    return {
      sharedSearchState: store.state.search,
      shouldShowAllContact: false,
      shouldShowAllGroup: false,
    }
  },

  mounted() {
    console.log('mounted');
    this.$nextTick(function () {
      let searchResultItems = document.getElementsByClassName('search-result-item');
      if (searchResultItems && searchResultItems.length > 0) {
        searchResultItems[0].style.backgroundColor = '#d9d9d9'
      }
    });
  },

  beforeDestroy() {
    store.setSearchQuery('')
  },

  watch: {
    // "query":function (val, oldVal){
    //   console.log('searchView query changed:', val, oldVal)
    // }
    // or
    query() {
      console.log('searchView query changed:', this.query)
      store.setSearchQuery(this.query)
    }
  },

  methods: {
    showAllContact() {
      this.shouldShowAllContact = true;
    },

    showAllGroup() {
      this.shouldShowAllGroup = true;
    },

    hideSearchView(e) {
      if (e.target.id !== 'searchInput') {
        store.toggleSearchView(false)
      }
    },

    chatToContact(contact) {
      let conversation = new Conversation(ConversationType.Single, contact.uid, 0);
      store.setCurrentConversation(conversation);
      store.toggleSearchView(false);
    },

    chatToGroup(group) {
      let conversation = new Conversation(ConversationType.Group, group.target, 0);
      store.setCurrentConversation(conversation);
      store.toggleSearchView(false);
    }

  },

  computed: {
    toShowContactList: function () {
      return !this.shouldShowAllContact && this.sharedSearchState.contactSearchResult.length > 5 ? this.sharedSearchState.contactSearchResult.slice(0, 4) : this.sharedSearchState.contactSearchResult;
    },
    toShowGroupList: function () {
      return !this.shouldShowAllGroup && this.sharedSearchState.groupSearchResult.length > 5 ? this.sharedSearchState.groupSearchResult.slice(0, 4) : this.sharedSearchState.groupSearchResult;
    }
  },

  directives: {
    ClickOutside
  },

}
</script>

<style lang="css" scoped>

.search-result-container {
  display: none;
}

.search-result-container.active {
  display: block;
  z-index: 100;
  overflow: auto;
  /*background-color: red;*/
  background-color: #f3f3f3e5;
}

.search-result-container ul {
  list-style: none;
  background-color: white;
}


.category-item label {
  color: #b2b2b2;
  display: block;
  padding-top: 10px;
  padding-bottom: 2px;
  margin-left: 12px;
  border-bottom: 1px solid #eeeeee;
}

.search-result-item {
  background-color: white;
  padding: 10px 12px;
}

.search-result-item:active {
  background-color: #d9d9d9;
}

.search-result-item.active {
  background-color: #d9d9d9;
}

.search-result-item.contact {
  width: 100%;
  display: flex;
  align-items: center;
}

.search-result-item.contact img {
  width: 34px;
  height: 34px;
  border-radius: 2px;
}

.search-result-item.contact span {
  font-size: 14px;
  padding-left: 10px;
}

.search-result-item.group {
  width: 100%;
  display: flex;
  align-items: center;
}

.search-result-item.group img {
  width: 34px;
  height: 34px;
  border-radius: 2px;
}

.search-result-item.group span {
  font-size: 14px;
  padding-left: 10px;
}

.show-all {
  padding-left: 12px;
  color: #66789d;
  font-size: 12px;
}

</style>
