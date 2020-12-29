<template>
  <div class="pick-conversation-container">
    <section class="conversation-list-panel">
      <div class="input-container">
        <input type="text" placeholder="搜索">
      </div>
      <section class="conversation-list-container">
        <div class="create-group" @click="showForwardByCreateConversationModal">
          <p>创建群聊</p>
        </div>
        <p>最近聊天</p>
        <ul class="conversation-list">
          <li v-for="(conversationInfo, index) in sharedConversation.conversationInfoList"
              :key="index">
            <div class="conversation-item" @click.stop="onConversationItemClick(conversationInfo.conversation)">
              <input class="checkbox" v-bind:value="conversationInfo.conversation" type="checkbox"
                     v-model="sharedPickState.conversations" placeholder="">
              <div class="header">
                <img class="avatar" :src="conversationInfo.conversation._target.portrait" alt=""/>
              </div>
              <p class="title single-line">{{ conversationInfo.conversation._target._displayName }}</p>
            </div>
          </li>
        </ul>
      </section>
    </section>
    <section class="checked-conversation-list-container">
      <header>
        <h2>分别发送给</h2>
        <span v-if="sharedPickState.conversations.length === 0">未选择聊天</span>
        <span v-else>已选择{{ this.sharedPickState.conversations.length }}个聊天</span>
      </header>
      <div class="content">
        <div class="picked-user-container" v-for="(conversation, index) in sharedPickState.conversations" :key="index">
          <div class="picked-user">
            <img class="avatar" :src="conversation._target.portrait">
            <button @click="unpConversation(conversation)" class="unpick-button">x</button>
          </div>
          <span class="name single-line">{{ conversation._target._displayName }}</span>
        </div>
      </div>
      <ForwardMessageView ref="forwardMessageView" :message="message"/>
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
import ForwardMessageView from "@/ui/main/conversation/ForwardMessageView";

export default {
  name: "ForwardMessageByPickConversationView",
  props: {
    message: {
      type: Message,
      required: true,
    },
  },
  data() {
    return {
      sharedConversation: store.state.conversation,
      sharedPickState: store.state.pick,
    }
  },
  methods: {
    onConversationItemClick(conversation) {
      store.pickOrUnpickConversation(conversation, true)
    },
    unpConversation(conversation) {
      store.pickOrUnpickConversation(conversation, false);
    },

    showForwardByCreateConversationModal() {
      this.sharedPickState.conversations.length = 0;
      this.$modal.hide('forward-by-pick-conversation-modal',
          {
            toCreateConversation: true,
            message: this.message
          })
    },

    cancel() {
      this.sharedPickState.conversations.length = 0
      this.$modal.hide('forward-by-pick-conversation-modal', {confirm: false})
    },

    confirm() {
      let pickedConversations = [...this.sharedPickState.conversations];
      this.sharedPickState.conversations.length = 0
      this.$modal.hide('forward-by-pick-conversation-modal',
          {
            confirm: true,
            conversations: pickedConversations,
            message: this.message,
            extraMessageText: this.$refs['forwardMessageView'].extraMessageText,
          })
    },
  },

  components: {ForwardMessageView},
}
</script>

<style lang="css" scoped>
.pick-conversation-container {
  display: flex;
  height: 100%;
  width: 100%;
}

.conversation-list-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  background-color: #f7f7f7;
  width: 200px;
}

.conversation-list-panel .input-container {
  display: flex;
  width: 100%;
}

.conversation-list-panel .input-container input {
  height: 25px;
  margin: 15px 20px 0 15px;
  flex: 1;
  border-radius: 3px;
  border: 1px solid #ededed;
  background-color: white;
  padding-left: 10px;
  text-align: left;
}

.conversation-list-panel .create-group {
  background-color: #f7f7f7;
  height: 40px;
  font-size: 13px;
  padding-left: 15px;
  display: flex;
  align-items: center;
}

.conversation-list-panel .create-group:active {
  background-color: #e5e5e5;
}

.conversation-list-container {
  overflow: auto;
}

.conversation-list-container > p {
  position: sticky;
  background-color: #f7f7f7;
  font-size: 12px;
  color: #888888;
  z-index: 1;
  top: 0;
  padding-left: 15px;
}

.conversation-item {
  width: 100%;
  height: 70px;
  display: flex;
  flex-direction: row;
  border-bottom: 1px solid #eeeeee;
  align-items: center;
  justify-content: flex-start;
  padding-left: 15px;
}

.conversation-item:active {
  background-color: #d6d6d6;
}

.conversation-item .header {
  height: 100%;
  padding: 10px 12px 10px 15px;
}

.conversation-item .header .avatar {
  position: relative;
  width: 45px;
  height: 45px;
  top: 50%;
  transform: translateY(-50%);
  border-radius: 3px;
}

.conversation-item .title {
  font-size: 14px;
  color: #262626;
  font-style: normal;
  font-weight: normal;
  padding-right: 10px;
}

.checkbox {
  margin-right: 0;
}

.checked-conversation-list-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.checked-conversation-list-container header {
  height: 55px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.checked-conversation-list-container header h2 {
  font-size: 16px;
  font-weight: normal;
  margin-left: 30px;
}

.checked-conversation-list-container header span {
  font-size: 12px;
  margin-right: 20px;
}


.checked-conversation-list-container .content {
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

.checked-conversation-list-container .content .picked-user-container {
  width: 33%;
  display: flex;
  flex-direction: column;
  column-count: 1;
  justify-content: center;
  align-content: center;
  padding: 5px 10px;
}

.checked-conversation-list-container .content .picked-user-container .name {
  width: 100%;
  font-size: 12px;
}

.checked-conversation-list-container .content .picked-user-container .picked-user {
  position: relative;
  height: 65px;
  width: 65px;
}

.checked-conversation-list-container .content .avatar {
  width: 45px;
  height: 45px;
  margin: 10px 10px;
  border-radius: 3px;
  border: 1px solid red;
}

.checked-conversation-list-container .content .unpick-button {
  position: absolute;
  width: 20px;
  height: 20px;
  border: 1px solid red;
  border-radius: 10px;
  top: 0;
  right: 0;
}

.checked-conversation-list-container .content .unpick-button:active {
  background-color: #e5e5e5;
}

.checked-conversation-list-container footer {
  height: 55px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 10px;
}

.checked-conversation-list-container footer button {
  padding: 5px 30px;
  border-radius: 4px;
  border: 1px solid #cccccc;
}

.checked-conversation-list-container footer button.confirm {
  background-color: #20bf64;
  margin-left: 20px;
  margin-right: 20px;
}

.checked-conversation-list-container label {
  width: 100%;
  padding: 5px 10px;
  height: 30px;
}


</style>
