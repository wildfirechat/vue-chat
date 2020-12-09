<template>
  <section class="contact-list">
    <ul>
      <li>
        <div @click="showNewFriends" class="category-item-container">
          <i class="arrow right" v-bind:class="{down: expandNewFriend}"></i>
          <span class="title">新的朋友</span>
        </div>
        <NewFriendListView v-if="expandNewFriend" :new-friends="newFriends"/>
      </li>
      <li>
        <div @click="showGroups" class="category-item-container">
          <i class="arrow right" v-bind:class="{down: expandGroup}"></i>
          <div class="category-item">
            <span class="title">群聊</span>
            <span class="desc">{{ groups.length }}</span>
          </div>
        </div>
        <GroupListVue v-if="expandGroup" :groups="groups"/>
      <li>
        <div @click="showContacts" class="category-item-container">
          <i class="arrow right" v-bind:class="{down: expandContact}"></i>
          <div class="category-item">
            <span class="title">联系人</span>
            <span class="desc">{{ friends.length }}</span>
          </div>
        </div>
        <FriendListVue v-if="expandContact" :friends="friends"/>
      </li>
    </ul>
  </section>
</template>
<script>
import FriendRequestListView from "@/components/contact/FriendRequestListView";
import GroupListVue from "@/components/contact/GroupListVue";
import FriendListVue from "@/components/contact/FriendListVue";

export default {
  name: "ContactListView",
  components: {FriendListVue, GroupListVue, NewFriendListView: FriendRequestListView},
  data() {
    return {
      expandNewFriend: false,
      expandContact: false,
      expandGroup: false,
      newFriends: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      groups: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      friends: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    }
  },
  methods: {
    showNewFriends() {
      this.expandNewFriend = !this.expandNewFriend;
      // TODO
    },
    showGroups() {
      this.expandGroup = !this.expandGroup
      // TODO

    },
    showContacts() {
      this.expandContact = !this.expandContact;
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
