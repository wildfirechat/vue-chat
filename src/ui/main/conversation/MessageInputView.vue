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
        <li><i @click="startAudioCall" class="icon-ion-ios-telephone"></i></li>
        <li><i @click="startVideoCall" class="icon-ion-ios-videocam"></i></li>
      </ul>
    </section>
    <div @keyup.enter="send($event)" v-focus @focus="restoreSelection($event)" @blur="onBlur"
         @mouseup="saveSelection($event)" @keyup="saveSelection"
         ref="input" class="input"
         autofocus
         placeholder="hello" contenteditable="true">
    </div>
    <QuoteMessageView v-if="shareConversationState.quotedMessage !== null"/>
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
import GroupInfo from "@/wfc/model/groupInfo";
import GroupType from "@/wfc/model/groupType";
import GroupMemberType from "@/wfc/model/groupMemberType";
import QuoteInfo from "@/wfc/model/quoteInfo";
import Draft from "@/ui/util/draft";
import {parser as emojiParse} from '@/ui/util/emoji';
import {focus} from 'vue-focus';
import QuoteMessageView from "@/ui/main/conversation/message/QuoteMessageView";
import avenginekitproxy from "@/wfc/av/engine/avenginekitproxy";
import {fileFromDataUri} from "@/ui/util/imageUtil";

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
      shareConversationState: store.state.conversation,
      showEmojiDialog: false,
      tribute: null,
      mentions: [],
      isMention: false,
      selectionOffset: null,
      savedRange: null,
      isInFocus: false,
    }
  },
  methods: {
    canisend() {
      let target = this.conversationInfo.conversation._target;
      if (target instanceof GroupInfo) {
        let groupInfo = target;
        if (groupInfo.type === GroupType.Restricted) {
          let groupMember = wfc.getGroupMember(groupInfo.target, wfc.getUserId());
          if (groupInfo.mute === 1 && groupMember.type === GroupMemberType.Normal) {
            return false;
          }
        }
      }

      return true;
    },
    send(e) {
      if (this.isMention) {
        this.isMention = false;
        return;
      }

      // let text = this.$refs['input'].textContent;
      // if (!text.trim()) {
      //   return;
      // }
      // this.$refs['input'].textContent = '';
      // // 发送消息时，会话消息列表需要滚动到最后
      // store.setShouldAutoScrollToBottom(true)
      //
      // let textMessageContent = this.handleMention(text)
      // let conversation = this.conversationInfo.conversation;
      // wfc.sendConversationMessage(conversation, textMessageContent);
      //

      let input = this.$refs['input'];
      let message = input.innerHTML.trim();
      let conversation = this.conversationInfo.conversation;

      if (
          !conversation
          || !this.canisend()
          || !message
      ) return;

      if (e.ctrlKey) {
        // e.preventDefault();
        // this.refs.input.innerHTML = this.refs.input.innerHTML+ "<div><br></div>";
        document.execCommand('InsertHTML', true, '<br>');
        if (window.getSelection) {
          let selection = window.getSelection(),
              range = selection.getRangeAt(0),
              br = document.createElement("br");
          range.deleteContents();
          range.insertNode(br);
          range.setStartAfter(br);
          range.setEndAfter(br);
          // range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
          // return false;
        }
        return;
      }

      // if(!message.startsWith('<')){
      //     message = message.replace(/<br>/g, '\n').trim()
      // }

      let imgs = input.getElementsByTagName('img');
      if (imgs) {
        imgs.forEach(img => {
          if (img.className.indexOf('emoji') >= 0) {
            return;
          }
          let src = img.src;
          let file = fileFromDataUri(src, new Date().getTime() + '.png');
          store.sendFile(this.conversationInfo.conversation, file)
          input.removeChild(img);
        });
      }
      message = input.innerHTML.trim();

      message = message.replace(/<br>/g, '\n')
          .replace(/<div>/g, '\n')
          .replace(/<\/div>/g, '')
          .replace(/&nbsp;/g, ' ');

      message = message.replace(/<img class="emoji" draggable="false" alt="/g, '')
          .replace(/" src="https:\/\/static\.wildfirechat\.cn\/twemoji\/assets\/72x72\/[0-9a-z-]+\.png">/g, '')

      let textMessageContent = this.handleMention(message);
      let quotedMessage = this.quotedMessage;
      if (quotedMessage) {
        let quoteInfo = QuoteInfo.initWithMessage(quotedMessage);
        textMessageContent.setQuoteInfo(quoteInfo);
      }
      wfc.sendConversationMessage(conversation, textMessageContent);
      this.$refs['input'].innerHTML = '';
      store.quoteMessage(null);
      Draft.setConversationDraft(conversation, '', null);
    },

    toggleEmojiView() {
      this.showEmojiDialog = !this.showEmojiDialog;
      this.focusInput();
    },

    hideEmojiView(e) {
      if (e.target.id !== 'showEmoji') {
        this.showEmojiDialog = false;
      }
    },

    onBlur() {
      this.isInFocus = false;
    },

    onSelectEmoji(emoji) {
      this.showEmojiDialog = false;
      this.restoreSelection();
      this.insertTextAtCaret(emojiParse(emoji.data));
      this.$nextTick(() => {
        this.placeCaretAtEnd();
      })
    },

    createElementFromHTML(htmlString) {
      let div = document.createElement('div');
      div.innerHTML = htmlString.trim();

      // Change this to div.childNodes to support multiple top-level nodes
      return div.firstChild;
    },

    insertTextAtCaret(text) {
      let sel, range;
      if (window.getSelection()) {
        sel = window.getSelection();
        if (sel.getRangeAt && sel.rangeCount) {
          range = sel.getRangeAt(0);
          range.collapse(false);
          if (text.startsWith('<')) {
            let imgEmoji = this.createElementFromHTML(text);
            range.insertNode(imgEmoji);
            range = document.createRange();
            range.selectNodeContents(imgEmoji);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
          } else {
            range.insertNode(document.createTextNode(text));
          }
        }
      } else if (document.selection && document.selection.createRange) {
        document.selection.createRange().text = text;
      }
    },

    saveSelection() {
      if (!this.$refs['input'].innerHTML) {
        this.savedRange = null;
        console.log('not save')
        return;
      }
      if (window.getSelection)//non IE Browsers
      {
        this.savedRange = window.getSelection().getRangeAt(0);
      } else if (document.selection)//IE
      {
        this.savedRange = document.selection.createRange();
      }
    },

    restoreSelection() {
      this.isInFocus = true;
      if (this.savedRange != null) {
        if (window.getSelection)//non IE and there is already a selection
        {
          let s = window.getSelection();
          if (s.rangeCount > 0)
            s.removeAllRanges();
          s.addRange(this.savedRange);
        } else if (document.createRange)//non IE and no selection
        {
          window.getSelection().addRange(this.savedRange);
        } else if (document.selection)//IE
        {
          this.savedRange.select();
        }
      } else {
        // do nothing
      }
    },

    placeCaretAtEnd() {
      let el = this.$refs['input'];
      el.focus();
      if (typeof window.getSelection != "undefined"
          && typeof document.createRange != "undefined") {
        let sel = window.getSelection();
        let range = sel.getRangeAt(0);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      } else if (typeof document.body.createTextRange != "undefined") {
        let textRange = document.body.createTextRange();
        textRange.moveToElementText(el);
        textRange.collapse(false);
        textRange.select();
      }
    },

    pickFile() {
      this.$refs['fileInput'].click();
    },

    startAudioCall() {
      // TODO
      let conversation = this.conversationInfo.conversation;
      if (conversation.type === ConversationType.Single) {
        avenginekitproxy.startCall(conversation, true, [conversation.target])
      } else {
        // TODO
      }
    },

    startVideoCall() {
      // TODO
      let conversation = this.conversationInfo.conversation;
      if (conversation.type === ConversationType.Single) {
        avenginekitproxy.startCall(conversation, false, [conversation.target])
      } else {
        // TODO
      }

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

      store.sendFile(this.conversationInfo.conversation, file);
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
        menuContainer: document.getElementById('conversation-content'),
      });
      this.tribute.attach(this.$refs['input']);
    },

    handleMention(text) {
      let textMessageContent = new TextMessageContent();
      textMessageContent.content = text.trim();
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
    },

    focusInput() {
      this.$nextTick(() => {
        this.$refs['input'].focus();
        console.log('focus end')
      })
    }
  },

  activated() {
    this.focusInput();
  },

  deactivated() {
    // TODO  draft
    this.$refs['input'].innerHTML = '';
  },

  mounted() {
    if (this.conversationInfo) {
      this.initMention(this.conversationInfo.conversation)
    }
    this.focusInput();
  },

  watch: {
    conversationInfo() {
      this.initMention(this.conversationInfo.conversation)
      this.$refs['input'].innerHTML = '';
      this.focusInput();
    }
  },

  components: {
    QuoteMessageView,
    VEmojiPicker
  },
  directives: {
    ClickOutside,
    focus,
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
  outline: none;
  padding: 0 20px;
  overflow: auto;
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

<style lang="css">
.input img {
  width: auto;
  max-width: 100px;
  max-height: 100px;
}
</style>
