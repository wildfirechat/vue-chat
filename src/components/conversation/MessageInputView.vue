<template>
  <section class="message-input-container">
    <section class="input-action-container">
      <ul>
        <li><i class="icon-ion-ios-heart"></i></li>
        <li><i class="icon-ion-android-attach"></i></li>
      </ul>
      <ul>
        <li><i class="icon-ion-ios-telephone"></i></li>
        <li><i class="icon-ion-ios-videocam"></i></li>
      </ul>
    </section>
    <div @keyup.enter="send" ref="input" class="input" contenteditable="true"></div>
  </section>
</template>

<script>
import wfc from "@/wfc/client/wfc";
import TextMessageContent from "@/wfc/messages/textMessageContent";
import store from "@/store";

export default {
  name: "MessageInputView",
  data() {
    return {
      sharedConversation: store.state.conversation,
    }
  },
  methods: {
    send() {
      let text = this.$refs['input'].textContent;
      if (!text.trim()) {
        return;
      }
      this.$refs['input'].textContent ='';
      let textMessageContent = new TextMessageContent(text)
      let conversation = this.sharedConversation.currentConversationInfo.conversation;
      wfc.sendConversationMessage(conversation, textMessageContent);
    }
  },
};
</script>

<style lang='css' scoped>
.message-input-container {
  display: flex;
  flex-direction: column;
}

.input-action-container {
  height: 50px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.input {
  flex: 1;
}

ul li {
  display: inline;
  margin-left: 20px;
}

ul li:last-of-type {
  margin-right: 20px;
}

i {
  font-size: 24px;
  color: #000;
  cursor: pointer;
}

i:hover {
  color: #34b7f1;
}
</style>
