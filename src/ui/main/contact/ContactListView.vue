<template>
  <section class="contact-list">
    <ul>
      <li>
        <div @click="showNewFriends" class="category-item-container">
          <i class="arrow right" v-bind:class="{down: sharedContactState.expandFriendRequestList}"></i>
          <span class="title">新的朋友</span>
        </div>
        <NewFriendListView v-if="sharedContactState.expandFriendRequestList" :new-friends="newFriends"/>
      </li>
      <li>
        <div @click="showGroups" class="category-item-container">
          <i class="arrow right" v-bind:class="{down: sharedContactState.expandGroup}"></i>
          <div class="category-item">
            <span class="title">群聊</span>
            <span class="desc">{{ sharedContactState.favGroupList.length }}</span>
          </div>
        </div>
        <GroupListVue v-if="sharedContactState.expandGroup"/>
      <li>
        <div @click="showContacts" class="category-item-container">
          <i class="arrow right" v-bind:class="{down: sharedContactState.expandFriendList}"></i>
          <div class="category-item">
            <span class="title">联系人</span>
            <span class="desc">{{ sharedContactState.friendList.length }}</span>
          </div>
        </div>
        <FriendListVue :enable-pick="false" v-if="sharedContactState.expandFriendList"/>
      </li>
    </ul>
  </section>
</template>
<script>
import FriendRequestListView from "@/ui/main/contact/FriendRequestListView";
import GroupListVue from "@/ui/main/contact/GroupListView";
import FriendListVue from "@/ui/main/contact/FriendListVue";
import store from "@/store";

export default {
  name: "ContactListView",
  components: {FriendListVue, GroupListVue, NewFriendListView: FriendRequestListView},
  data() {
    return {
      sharedContactState: store.state.contact,
      newFriends: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    }
  },
  methods: {
    showNewFriends() {
      store.toggleFriendRequestList();
    },
    showGroups() {
      store.toggleGroupList();
    },
    showContacts() {
      store.toggleFriendList();
    },

  }
}
</script>

<style lang="css" scoped>

.contact-list {
  height: 100%;
  overflow: auto;
}

.contact-list ul {
  list-style: none;
}

.category-item-container {
  height: 40px;
  display: flex;
  align-items: center;
  padding-left: 15px;
  color: #262626;
  font-size: 14px;
  position: sticky;
  background-color: #fafafa;
  top: 0;
}

.category-item {
  display: flex;
  width: 100%;
  justify-content: space-between;
}

.category-item span:last-of-type {
  margin-right: 15px;
}

.arrow {
  border: solid #b9b9b9;
  border-width: 0 1px 1px 0;
  display: inline-block;
  padding: 3px;
  margin-right: 10px;
}

.right {
  transform: rotate(-45deg);
  -webkit-transform: rotate(-45deg);
}

.left {
  transform: rotate(135deg);
  -webkit-transform: rotate(135deg);
}

.up {
  transform: rotate(-135deg);
  -webkit-transform: rotate(-135deg);
}

.down {
  transform: rotate(45deg);
  -webkit-transform: rotate(45deg);
}

</style>
