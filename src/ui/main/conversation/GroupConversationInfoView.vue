<template>
  <div class="conversation-info">
    <header>
      <label>
        群名
        <input type="text" :placeholder="conversationInfo.conversation._target._displayName">
      </label>
      <label>
        群公告
        <input type="text" disabled
               :placeholder="groupAnnouncement">
      </label>
    </header>
    <div class="search-item">
      <input type="text" placeholder="搜索">
    </div>
    <div class="member-container">
      <div v-if="enableAddGroupMember" @click="showCreateConversationModal" class="action-item">
        <div class="icon">+</div>
        <p>添加成员</p>
      </div>
      <div v-if="enableRemoveGroupMember" @click="showRemoveGroupMemberModal" class="action-item">
        <div class="icon">-</div>
        <p>移除成员</p>
      </div>
      <UserListVue :users="users"
                   :show-category-label="false"
                   :padding-left="'20px'"
      />
    </div>
    <div @click="quitGroup" class="quit-group-item">
      退出群聊
    </div>
  </div>
</template>

<script>
import UserListVue from "@/ui/main/user/UserListVue";
import ConversationInfo from "@/wfc/model/conversationInfo";
import store from "@/store";
import PickUserView from "@/ui/main/pick/PickUserView";
import wfc from "@/wfc/client/wfc";
import axios from "axios";
import GroupMemberType from "@/wfc/model/groupMemberType";
import GroupType from "@/wfc/model/groupType";

export default {
  name: "GroupConversationInfoView",
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
      groupAnnouncement: '',
    }
  },
  components: {UserListVue},
  methods: {
    showCreateConversationModal() {

      let beforeOpen = (event) => {
        console.log('Opening...')
      };
      let beforeClose = (event) => {
        console.log('Closing...', event, event.params)
        if (event.params.confirm) {
          let newPickedUsers = event.params.users;
          let ids = newPickedUsers.map(u => u.uid);
          wfc.addGroupMembers(this.conversationInfo.conversation.target, ids, [0])
        }
      };
      let closed = (event) => {
        console.log('Close...', event)
      };
      let groupMemberUserInfos = store.getGroupMemberUserInfos(this.conversationInfo.conversation.target, false);
      this.$modal.show(
          PickUserView,
          {
            users: this.sharedContactState.friendList,
            initialCheckedUsers: groupMemberUserInfos,
            uncheckableUsers: groupMemberUserInfos,
            confirmTitle: '添加',
          }, {
            name: 'pick-user-modal',
            width: 600,
            height: 480,
            clickToClose: false,
          }, {
            'before-open': beforeOpen,
            'before-close': beforeClose,
            'closed': closed,
          })
    },

    showRemoveGroupMemberModal() {
      let beforeOpen = (event) => {
        console.log('Opening...')
      };
      let beforeClose = (event) => {
        console.log('Closing...', event, event.params)
        if (event.params.confirm) {
          let newPickedUsers = event.params.users;
          let ids = newPickedUsers.map(u => u.uid);
          wfc.kickoffGroupMembers(this.conversationInfo.conversation.target, ids, [0])
        }
      };
      let closed = (event) => {
        console.log('Close...', event)
      };
      let groupMemberUserInfos = store.getGroupMemberUserInfos(this.conversationInfo.conversation.target, false);
      this.$modal.show(
          PickUserView,
          {
            users: groupMemberUserInfos,
            confirmTitle: '移除',
          }, {
            name: 'pick-user-modal',
            width: 600,
            height: 480,
            clickToClose: false,
          }, {
            'before-open': beforeOpen,
            'before-close': beforeClose,
            'closed': closed,
          })

    },

    showUserInfo(user) {
      console.log('todo show userInfo', user);
    },

    async getGroupAnnouncement() {
      let response = await axios.post('/get_group_announcement', {
        groupId: this.conversationInfo.conversation.target,
      }, {withCredentials: true});
      if (response.data && response.data.result) {
        this.groupAnnouncement = response.data.result.text;
      } else {
        this.groupAnnouncement = '点击编辑群公告';
      }
    },

    quitGroup() {
      store.quitGroup(this.conversationInfo.conversation.target)
    },
  },

  created() {
    this.getGroupAnnouncement();
  },

  computed: {
    enableAddGroupMember() {
      let selfUid = wfc.getUserId();
      let groupInfo = this.conversationInfo.conversation._target;
      if (groupInfo.type === GroupType.Restricted) {
        let groupMember = wfc.getGroupMember(this.conversationInfo.conversation.target, selfUid);
        return [GroupMemberType.Manager, GroupMemberType.Owner].indexOf(groupMember.type) >= 0;
      }
      return true;
    },

    enableRemoveGroupMember() {
      let selfUid = wfc.getUserId();
      let groupMember = wfc.getGroupMember(this.conversationInfo.conversation.target, selfUid);
      return [GroupMemberType.Manager, GroupMemberType.Owner].indexOf(groupMember.type) >= 0;
    }
  }
};
</script>

<style lang="css" scoped>
.conversation-info {
  display: flex;
  flex-direction: column;
  position: relative;
  justify-content: flex-start;
  height: 100%;
  overflow: hidden;
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

.member-container {
  flex: 1 1 auto;
  overflow: auto;
}

.search-item {
  padding: 10px 20px;
}

.search-item input {
  width: 100%;
  padding: 1px 5px;
}

.action-item {
  height: 50px;
  display: flex;
  padding-left: 20px;
  align-items: center;
}

.action-item .icon {
  width: 40px;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 3px;
  border: 1px dashed #d6d6d6;
}

.action-item img {
  width: 40px;
  height: 40px;
}

.action-item p {
  margin-left: 10px;
  font-size: 13px;
}

.action-item:active {
  background-color: #d6d6d6;
}

.quit-group-item {
  display: flex;
  color: red;
  align-items: center;
  justify-content: center;
  height: 55px;
  border-top: 1px solid #ececec;
}

.quit-group-item:active {
  background: #d6d6d6;
}

</style>
