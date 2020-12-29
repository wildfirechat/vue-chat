<template>
  <div class="conversation-info">
    <div class="conversation-action-container">
      <div class="action">
        <img src="@/assets/images/add.png">
        <p>添加成员</p>
      </div>
    </div>
    <UserListVue :users="users"
                 :show-category-label="false"
                 :padding-left="'20px'"
                 :click-user-item-func="showUserInfo"/>
  </div>
</template>

<script>
import UserListVue from "@/ui/main/user/UserListVue";
import ConversationInfo from "@/wfc/model/conversationInfo";
import store from "@/store";

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
    }
  },
  components: {UserListVue},
  methods: {
    showUserInfo(user) {
      console.log('todo show userInfo', user);
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
    },
  },

  computed: {}
};
</script>

<style lang="css" scoped>
.conversation-info {
  height: 100%;
  overflow: auto;
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
}

.action:active {
  background-color: #d6d6d6;
}

</style>
