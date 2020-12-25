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
import Tribute from "tributejs";
import '../../../tribute.css'
import ConversationType from "@/wfc/model/conversationType";
import ConversationInfo from "@/wfc/model/conversationInfo";

export default {
  name: "MessageInputView",
  props: {
    conversationInfo: {
      type: ConversationInfo,
      required: true,
      default: null,
    },
  },
  data() {
    return {
      currentConversation: null,
      showEmojiDialog: false,
      tribute: null,
      mentions: [],
      isMention: false,
    }
  },
  methods: {
    send() {
      if (this.isMention) {
        this.isMention = false;
        return;
      }
      let text = this.$refs['input'].textContent;
      if (!text.trim()) {
        return;
      }
      this.$refs['input'].textContent = '';
      // 发送消息时，会话消息列表需要滚动到最后
      store.setShouldAutoScrollToBottom(true)

      let textMessageContent = this.handleMention(text)
      let conversation = this.conversationInfo.conversation;
      wfc.sendConversationMessage(conversation, textMessageContent);
    },

    toggleEmojiView() {
      this.showEmojiDialog = !this.showEmojiDialog;
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

    initMention(conversation) {
      // TODO group, channel

      if (this.tribute) {
        this.tribute.detach(this.$refs['input']);
        this.tribute = null;
      }
      let type = conversation.conversationType;
      if (type === ConversationType.Single
          || type === ConversationType.ChatRoom) {
        return
      }

      let mentionMenuItems = [];
      let groupInfo = wfc.getGroupInfo(conversation.target);
      mentionMenuItems.push({
        key: "所有人",
        value: '@' + conversation.target,
        avatar: groupInfo.portrait,
        //searchKey: '所有人' + pinyin.letter('所有人', '', null)
        searchKey: '所有人' + 'suoyouren' + 'syr'
      });

      let groupMemberUserInfos = store.getGroupMemberUserInfos(conversation.target, false);
      groupMemberUserInfos.forEach((e) => {
        mentionMenuItems.push({
          key: e._displayName,
          value: '@' + e.uid,
          avatar: e.portrait,
          searchKey: e._displayName + e._pinyin + e._firstLetters,
        });
      });


      this.tribute = new Tribute({
        // menuContainer: document.getElementById('content'),
        values: mentionMenuItems,
        selectTemplate: (item) => {
          if (typeof item === 'undefined') return null;
          // if (this.range.isContentEditable(this.current.element)) {
          //     return '<span contenteditable="false"><a href="http://zurb.com" target="_blank" title="' + item.original.email + '">' + item.original.value + '</a></span>';
          // }
          this.mentions.push({key: item.original.key, value: item.original.value});
          this.isMention = true;

          return '@' + item.original.key;
        },
        menuItemTemplate: function (item) {
          return '<img width="24" height="24" src="' + item.original.avatar + ' "> ' + item.original.key;
        },
        noMatchTemplate: function () {
          return '<span style:"visibility: hidden;"></span>';
        },
        lookup: (item) => {
          return item.searchKey;
        },
        menuContainer: document.body,
      });
      this.tribute.attach(this.$refs['input']);
    },

    handleMention(text) {
      let textMessageContent = new TextMessageContent();
      textMessageContent.content = text;
      this.mentions.forEach(e => {
        if (text.indexOf(e.key) > -1) {
          if (e.value === '@' + this.conversationInfo.conversation.target) {
            textMessageContent.mentionedType = 2;
          } else {
            if (textMessageContent.mentionedType !== 2) {
              textMessageContent.mentionedType = 1;
              textMessageContent.mentionedTargets.push(e.value.substring(1));
            }
          }
        }
      });

      this.mentions.length = 0;
      return textMessageContent;
    }
  },
  watch: {
    conversationInfo(newC, oldC) {
      console.log('conversation changed', oldC, newC)
      this.initMention(this.conversationInfo.conversation)
    }
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
