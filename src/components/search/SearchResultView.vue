<template>
  <section class="search-container"
           v-if="sharedSearchState.show"
           v-bind:class="{active:sharedSearchState.show}"
           v-click-outside="hideSearchView">
    <div class="search-result">
      <ul>
        <li class="category-item" v-if="contactResultList.length > 0">
          <label>联系人</label>
          <ul>
            <li v-for="(contact, index) in toShowContactList" :key="index">
              <div class="search-result-item contact">
                <img src="@/assets/images/user-fallback.png">
                <span>我是imndx {{ contact }}</span>
              </div>
            </li>
          </ul>
          <div v-if="!shouldShowAllContact && this.contactResultList.length > 5"
               class="show-all"
               @click.stop="showAllContact">
            查看全部({{ this.contactResultList.length }})
          </div>
        </li>
        <li class="category-item">
          <label>群聊</label>
          <ul>
            <li>
              <div class="search-result-item group">
                hello group
              </div>
            </li>
          </ul>
        </li>
        <li class="category-item">
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

export default {
  name: "SearchResultView",
  props: [
    "query"
  ],
  data() {
    return {
      sharedSearchState: store.state.search,
      messageResultList: [],
      contactResultList: [1, 2, 3, 4, 5, 6, 7],
      groupResultList: [],
      shouldShowAllContact: false,
    }
  },

  mounted() {
    console.log('mounted');
    this.$nextTick(function () {
      document.getElementsByClassName('search-result-item')[0].style.backgroundColor = '#d9d9d9'
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
      // TODO just for test
      if (!this.query) {
        return
      }
      this.contactResultList = this.contactResultList.filter((v) => v % this.query.length === 0);
    }
  },

  methods: {
    showAllContact() {
      this.shouldShowAllContact = true;
    },

    hideSearchView(e) {
      if (e.target.id !== 'searchInput') {
        store.toggleSearchView(false)
      }
    },

  },

  computed: {
    toShowContactList: function () {
      return !this.shouldShowAllContact && this.contactResultList.length > 5 ? this.contactResultList.slice(0, 4) : this.contactResultList;
    }
  },

  directives: {
    ClickOutside
  },

}
</script>

<style lang="css" scoped>

.search-container {
  display: none;
}

.search-container.active {
  display: block;
  z-index: 100;
  /*background-color: red;*/
  background-color: #f3f3f3e5;
}

.search-container ul {
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

.show-all {
  padding-left: 12px;
  color: #66789d;
  font-size: 12px;
}

</style>
