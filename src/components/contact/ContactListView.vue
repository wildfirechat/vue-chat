<template>
  <section class="contact-list">
    <ul>
      <li>
        <div @click="showNewFriends" class="category-item-container">
          <i class="arrow right" v-bind:class="{down: expandNewFriend}"></i>
          <span class="title">新的朋友</span>
        </div>
        <ul v-if="expandNewFriend">
          <li v-for="(friend,index) in newFriends" :key="index">
            <div class="new-friend-item-container" v-bind:class="{active :index ===2}">
              <div class="new-friend-item">
                <img class="avatar" src="@/assets/images/user-fallback.png">
                <div class="info">
                  <div class="name-action">
                    <span class="name single-line">imndx</span>
                    <span class="accepted" v-if="index >= 3">已添加</span>
                    <button class="accept" v-if="index < 3">添加</button>
                  </div>
                  <p class="reason single-line">我是{{ friend }}</p>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </li>
      <li>
        <div @click="showGroups" class="category-item-container">
          <i class="arrow right" v-bind:class="{down: expandGroup}"></i>
          <div class="category-item">
            <span class="title">群聊</span>
            <span class="desc">{{ groups.length }}</span>
          </div>
        </div>
        <ul v-if="expandGroup">
          <li v-for="(group, index) in groups" :key="index">
            <div class="group-item" v-bind:class="{active: currentGroup === group}">
              <img class="avatar" src="@/assets/images/user-fallback.png">
              <span class="single-line">imndx的群组</span>
            </div>
          </li>
        </ul>
      </li>
      <li>
        <div @click="showContacts" class="category-item-container">
          <i class="arrow right" v-bind:class="{down: expandContact}"></i>
          <div class="category-item">
            <span class="title">联系人</span>
            <span class="desc">{{ contacts.length }}</span>
          </div>
        </div>
        <ul v-if="expandContact">
          <li v-for="(contact, index) in contacts" :key="index">
            <div class="contact-item" v-bind:class="{active: currentContact === contact}">
              <p v-if="contactLabel(contact, index)" class="label">{{ contactLabel(contact, index) }}</p>
              <div class="content" v-bind:class="{active: index ===3}">
                <img class="avatar" src="@/assets/images/user-fallback.png">
                <span class="single-line">imndx</span>
              </div>
            </div>
          </li>
        </ul>
      </li>
    </ul>
  </section>
</template>
<script>
export default {
  name: "ContactListView",
  data() {
    return {
      expandNewFriend: false,
      expandContact: false,
      expandGroup: false,
      currentGroup: 2,
      currentContact: null,
      newFriends: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      groups: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      contacts: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
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

    contactLabel(contact, index) {
      // TODO 和前一个比较
      if (index === 0) {
        return 'A';
      } else if (index === 7) {
        return 'B';
      }
      return null;
    }
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

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 3px;
}

.new-friend-item-container {
  padding-left: 30px;
}

.new-friend-item {
  display: flex;
  width: 100%;
  padding: 10px 15px 10px 0;
  align-items: center;
  font-size: 13px;
  border-bottom: 1px solid #e0e0e0;
}


.new-friend-item-container.active {
  background-color: #d6d6d6;
}

.new-friend-item-container:hover {
  background-color: #d6d6d6;
}

.new-friend-item .info {
  margin-left: 10px;
  flex: 1;
}

.new-friend-item .info .name-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.new-friend-item .info .name-action .name {
  flex: 1;
}

.new-friend-item .info .name-action .accept {
  padding: 0 5px;
  text-align: center;
}

.new-friend-item .info .name-action .accepted {
  color: #b2b2b2;
}

.new-friend-item .info .reason {
  font-size: 12px;
  color: #b2b2b2;
}

.group-item {
  height: 50px;
  padding: 5px 10px 5px 30px;
  display: flex;
  font-size: 13px;
  align-items: center;
}

.group-item.active {
  background-color: #d6d6d6;
}

.group-item span {
  margin-left: 10px;
}

.contact-item {
  display: flex;
  flex-direction: column;
  font-size: 13px;
  align-items: flex-start;
}

.contact-item .label {
  width: 100%;
  margin-left: 30px;
  padding: 5px 5px 5px 0;
  border-bottom: 1px solid #e0e0e0;
}

.contact-item .content {
  padding: 5px 5px 5px 30px;
  display: flex;
  width: 100%;
  align-items: center;
}

.contact-item .content span {
  margin-left: 10px;
}

.contact-item .content.active {
  background-color: #d6d6d6;
}

.contact-item .content:hover {
  background-color: red;
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
