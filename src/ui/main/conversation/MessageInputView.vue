<template>
  <section class="message-input-container">
    <section class="input-action-container">
      <VEmojiPicker
          id="emoji"
          v-show="showEmojiDialog"
          labelSearch="Search"
          lang="pt-BR"
          v-click-outside="hideEmojiView"
          @select="onSelectEmoji"
      />
      <ul>
        <li><i id="showEmoji" @click="toggleEmojiView" class="icon-ion-ios-heart"></i></li>
        <li><i @click="pickFile" class="icon-ion-android-attach"></i>
          <input ref="fileInput" @change="onPickFile($event)" class="icon-ion-android-attach" type="file"
                 style="display: none">
        </li>
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
import {VEmojiPicker} from "v-emoji-picker";
import ClickOutside from "vue-click-outside";

export default {
  name: "MessageInputView",
  data() {
    return {
      sharedConversation: store.state.conversation,
      showEmojiDialog: false,
    }
  },
  methods: {
    send() {
      let text = this.$refs['input'].textContent;
      if (!text.trim()) {
        return;
      }
      this.$refs['input'].textContent = '';
      // 发送消息时，会话消息列表需要滚动到最后
      store.setShouldAutoScrollToBottom(true)

      let textMessageContent = new TextMessageContent(text)
      let conversation = this.sharedConversation.currentConversationInfo.conversation;
      wfc.sendConversationMessage(conversation, textMessageContent);
    },

    toggleEmojiView() {
      this.$nextTick(() => {
        this.showEmojiDialog = !this.showEmojiDialog;
      });
    },

    hideEmojiView(e) {
      if (e.target.id !== 'showEmoji') {
        this.showEmojiDialog = false;
      }
    },

    onSelectEmoji(emoji) {
      console.log('onSelect emoji', emoji)
      this.showEmojiDialog = false;
    },

    pickFile() {
      this.$refs['fileInput'].click();
    },

    onPickFile(event) {
      // this.batchProcess(e.target.files[0]);
      console.log('onPickFile', event.target.files[0]);
      let file = event.target.files[0];
      event.target.value = '';

      // TODO
      // var showMessage = snackbar.showMessage;
      //
      // if (!file || file.size === 0) {
      //   showMessage('You can\'t send an empty file.');
      //   return false;
      // }
      //
      // if (!file
      //     || file.size >= 100 * 1024 * 1024) {
      //   showMessage('Send file not allowed to exceed 100M.');
      //   return false;
      // }

      store.sendFile(file);
    },

  },
  components: {
    VEmojiPicker
  },
  directives: {
    ClickOutside
  }
};
</script>

<style lang='css' scoped>
.message-input-container {
  height: 100%;
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  position: relative;
}

#emoji {
  position: absolute;
  bottom: 55px;
  left: -100px;
}

.input-action-container {
  height: 50px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
}

.input {
  flex: 1 1 auto;
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
