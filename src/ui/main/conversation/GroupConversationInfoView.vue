<template>
  <div class="conversation-info">
    <header>
      <label>
        群名
        <input type="text" :placeholder="conversationInfo.conversation._target._displayName">
      </label>
      <label>
        群公告
        <input type="text" placeholder="点击编辑群公告">
      </label>
    </header>
    <div class="search-container">
      <input type="text" placeholder="搜索">
    </div>
    <div @click="showCreateConversationModal" class="action">
      <img src="@/assets/images/add.png" alt="">
      <p>添加成员</p>
    </div>
    <UserListVue :users="users"
                 :show-category-label="false"
                 :padding-left="'20px'"
    />
  </div>
</template>

<script>
import UserListVue from "@/ui/main/user/UserListVue";
import ConversationInfo from "@/wfc/model/conversationInfo";
import store from "@/store";
import PickUserView from "@/ui/main/pick/PickUserView";
import wfc from "@/wfc/client/wfc";

export default {
  name: "SingleConversationInfoView",
  props: {
    conversationInfo: {
      type: ConversationInfo,
      required: true,
    }
  },
  data() {
    return {
      users: store.getConversationMemberUsrInfos(this.conversationInfo.conversation),
      sharedContactState: store.state.contact,
    }
  },
  components: {UserListVue},
  methods: {
    showCreateConversationModal() {
      let groupMemberUserInfos = store.getGroupMemberUserInfos(this.conversationInfo.conversation.target, false);
      this.$modal.show(
          PickUserView,
          {
            users: this.sharedContactState.friendList,
            initialCheckedUsers: groupMemberUserInfos,
            uncheckableUsers: groupMemberUserInfos,
            confirmTitle: '添加',
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
    showUserInfo(user) {
      console.log('todo show userInfo', user);
    },
    beforeOpen(event) {
      console.log('Opening...')
    },
    beforeClose(event) {
      console.log('Closing...', event, event.params)
      if (event.params.confirm) {
        let newPickedUsers = event.params.users;
        let ids = newPickedUsers.map(u => u.uid);
        wfc.addGroupMembers(this.conversationInfo.conversation.target, ids, [0])
      }
    },
    closed(event) {
      console.log('Close...', event)
    },
  },

  computed: {}
};
</script>

<style lang="css" scoped>
.conversation-info {
  height: 100%;
  overflow: auto;
  position: relative;
}

header {
  padding-left: 20px;
  padding-right: 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

header label {
  width: 100%;
  display: flex;
  margin-top: 15px;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  font-size: 14px;
  color: #999999;
}

header label:last-of-type {
  padding-bottom: 15px;
  border-bottom: 1px solid #ececec;
}

header label input {
  flex: 1;
  margin-top: 5px;
  border: none;
  outline: none;
  width: 100%;
  font-size: 13px;
  background-color: transparent;
}

.search-container {
  padding: 10px 20px;
}

.search-container input {
  width: 100%;
  padding: 1px 5px;
}

.action {
  height: 50px;
  display: flex;
  padding-left: 20px;
  align-items: center;
}

.action img {
  width: 40px;
  height: 40px;
}

.action p {
  margin-left: 10px;
  font-size: 13px;
}

.action:active {
  background-color: #d6d6d6;
}

</style>
