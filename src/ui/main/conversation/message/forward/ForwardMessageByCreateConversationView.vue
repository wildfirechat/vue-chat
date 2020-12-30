<template>
  <div class="pick-user-container">
    <section class="user-list-panel">
      <div class="input-container">
        <input type="text" placeholder="搜索">
      </div>
      <div class="user-list-container">
        <div class="back" @click="backPickConversation">
          <p>返回</p>
        </div>
        <CheckableUserListView class="user-list"
                               :enable-pick="true"
                               :users="users"
                               :padding-left="'20px'"
                               :enable-category-label-sticky="true"/>
      </div>
    </section>
    <section class="checked-user-list-container">
      <header>
        <h2>分别发送给</h2>
        <span v-if="sharedPickState.users.length === 0">已选择联系人</span>
        <span v-else>已选择联系人 {{ this.sharedPickState.users.length }}</span>
      </header>
      <div class="content">
        <div class="picked-user-container" v-for="(user, index) in sharedPickState.users" :key="index">
          <div class="picked-user">
            <img class="avatar" :src="user.portrait" :alt="user + index">
            <button @click="unpick(user)" class="unpick-button">x</button>
          </div>
          <span class="name single-line">{{ user.displayName }}</span>
        </div>
      </div>

      <ForwardMessageView ref="forwardMessageView" v-if="sharedPickState.users.length > 0" :message="message"/>
      <footer>
        <button @click="cancel" class="cancel">取消</button>
        <button @click="confirm" class="confirm">发送</button>
      </footer>
    </section>
  </div>
</template>

<script>
import store from "@/store";
import Message from "@/wfc/messages/message";
import ForwardMessageView from "@/ui/main/conversation/message/forward/ForwardMessageView";
import CheckableUserListView from "@/ui/main/user/CheckableUserListView";

export default {
  name: "ForwardMessageByCreateConversationView",
  props: {
    users: {
      type: Array,
      required: true,
    },
    message: {
      type: Message,
      required: true,
    }
  },
  data() {
    return {
      sharedPickState: store.state.pick,
    }
  },
  methods: {
    unpick(user) {
      store.pickOrUnpickUser(user, false);
    },

    backPickConversation() {
      this.sharedPickState.users.length = 0
      this.$modal.hide('forward-by-create-conversation-modal',
          {
            backPickConversation: true,
            message: this.message,
          })
    },

    cancel() {
      this.sharedPickState.users.length = 0
      this.$modal.hide('forward-by-create-conversation-modal', {confirm: false})
    },

    confirm() {
      let pickedUsers = [...this.sharedPickState.users];
      this.sharedPickState.users.length = 0
      this.$modal.hide('forward-by-create-conversation-modal',
          {
            confirm: true,
            users: pickedUsers,
            message: this.message,
            extraMessageText: this.$refs['forwardMessageView'].extraMessageText,
          })
    },
  },

  components: {
    CheckableUserListView,
    ForwardMessageView
  },
}
</script>

<style lang="css" scoped>
.pick-user-container {
  display: flex;
  height: 100%;
  width: 100%;
}

.user-list-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  background-color: #f7f7f7;
}

.user-list-panel .input-container {
  display: flex;
  width: 100%;
}

.user-list-panel input {
  height: 25px;
  margin: 15px 20px 0 15px;
  flex: 1;
  border-radius: 3px;
  border: 1px solid #ededed;
  background-color: white;
  padding-left: 10px;
  text-align: left;
}

.user-list-panel .user-list-container {
  height: 100%;
  overflow: auto;
}

.user-list-container .back {
  background-color: #f7f7f7;
  height: 40px;
  font-size: 13px;
  padding-left: 15px;
  display: flex;
  align-items: center;
}

.user-list-container .back:active {
  background-color: #e5e5e5;
}

.checked-user-list-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.checked-user-list-container header {
  height: 55px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.checked-user-list-container header h2 {
  font-size: 16px;
  font-weight: normal;
  margin-left: 30px;
}

.checked-user-list-container header span {
  font-size: 12px;
  margin-right: 20px;
}


.checked-user-list-container .content {
  height: 100%;
  flex: 1;
  display: flex;
  padding: 0 30px;
  flex-wrap: wrap;
  justify-content: flex-start;
  align-items: flex-start;
  align-content: flex-start;
  overflow: auto;
}

.checked-user-list-container .content .picked-user-container {
  width: 33%;
  display: flex;
  flex-direction: column;
  column-count: 1;
  justify-content: center;
  align-content: center;
  padding: 5px 10px;
}

.checked-user-list-container .content .picked-user-container .name {
  width: 100%;
  font-size: 12px;
}

.checked-user-list-container .content .picked-user-container .picked-user {
  position: relative;
  height: 65px;
  width: 65px;
}

.checked-user-list-container .content .avatar {
  width: 45px;
  height: 45px;
  margin: 10px 10px;
  border-radius: 3px;
  border: 1px solid red;
}

.checked-user-list-container .content .unpick-button {
  position: absolute;
  width: 20px;
  height: 20px;
  border: 1px solid red;
  border-radius: 10px;
  top: 0;
  right: 0;
}

.checked-user-list-container .content .unpick-button:active {
  background-color: #e5e5e5;
}

.checked-user-list-container footer {
  height: 55px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 10px;
}

.checked-user-list-container footer button {
  padding: 5px 30px;
  border-radius: 4px;
  border: 1px solid #cccccc;
}

.checked-user-list-container footer button.confirm {
  background-color: #20bf64;
  margin-left: 20px;
  margin-right: 20px;
}


</style>