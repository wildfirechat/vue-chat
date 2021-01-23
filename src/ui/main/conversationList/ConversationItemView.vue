<template>
  <div class="conversation-item-container"
       @dragover="dragEvent($event, 'dragover')"
       @dragleave="dragEvent($event, 'dragleave')"
       @dragenter="dragEvent($event,'dragenter')"
       @drop="dragEvent($event, 'drop')"
       v-bind:class="{drag: dragAndDropEnterCount > 0}"
  >
    <div class="conversation-item">
      <div class="header">
        <img class="avatar" :src="conversationInfo.conversation._target.portrait" alt=""/>
        <em v-if="unread > 0" class="badge" v-bind:class="{silent:conversationInfo.isSilent}">{{ unread }}</em>
      </div>
      <div class="content-container">
        <div class="title-time-container">
          <h2 class="title single-line">{{ conversationTitle }}</h2>
          <p class="time single-line">{{ conversationInfo._timeStr }}</p>
        </div>
        <div class="content">
          <p class="draft single-line" v-if="shouldShowDraft" v-html="draft"></p>
          <p class="message single-line" v-else>
            {{ lastMessageContent }}</p>
          <i v-if="conversationInfo.isSilent" class="icon-ion-android-volume-mute"></i>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ConversationInfo from "@/wfc/model/conversationInfo";
import ConversationType from "@/wfc/model/conversationType";
import store from "@/store";
import Draft from "@/ui/util/draft";
import FileMessageContent from "@/wfc/messages/fileMessageContent";
import Message from "@/wfc/messages/message";
import wfc from "@/wfc/client/wfc";

export default {
  name: "ConversationItemView",
  props: {
    conversationInfo: {
      type: ConversationInfo,
      required: true,
    },
  },
  data() {
    return {
      dragAndDropEnterCount: 0,
      shareConversationState: store.state.conversation,
    };
  },
  methods: {
    dragEvent(e, v) {
      if (v === 'dragenter') {
        this.dragAndDropEnterCount++;
      } else if (v === 'dragleave') {
        this.dragAndDropEnterCount--;
      } else if (v === 'drop') {
        this.dragAndDropEnterCount--;
        let length = e.dataTransfer.files.length;
        if (length > 0 && length < 5) {
          for (let i = 0; i < length; i++) {
            store.sendFile(this.conversationInfo.conversation, e.dataTransfer.files[i]);
          }
        } else {
          // TODO
          let url = e.dataTransfer.getData('URL');
          if (url) {
            store.sendFile(this.conversationInfo.conversation, url);
          } else {
            let text = e.dataTransfer.getData('text');
            if (text.startsWith('{')) {
              let obj = JSON.parse(text);
              let file = new FileMessageContent(null, obj.url, obj.name, obj.size)
              let message = new Message(this.conversationInfo.conversation, file)
              wfc.sendMessage(message);
            }
          }
          console.log('一次最多发送5个文件', e.dataTransfer, e.dataTransfer.getData('URL'));
        }
      } else if (v === 'dragover') {
        // If not st as 'copy', electron will open the drop file
        e.dataTransfer.dropEffect = 'copy';
      }
    },
  },
  computed: {
    conversationTitle() {
      let info = this.conversationInfo;
      if (info.conversation.type === ConversationType.Single) {
        return info.conversation._target.displayName;
      } else {
        return info.conversation._target.name;
      }
    },

    shouldShowDraft() {
      if (this.shareConversationState.currentConversationInfo && this.shareConversationState.currentConversationInfo.conversation.equal(this.conversationInfo.conversation)) {
        return false;
      }
      let draft = Draft.getConversationDraftEx(this.conversationInfo);
      return draft.text !== '' || draft.quotedMessage !== null;
    },

    draft() {
      let draft = Draft.getConversationDraftEx(this.conversationInfo);
      let draftText = '[草稿]' + draft.text;
      draftText = draftText.replace(/<img [:a-zA-Z0-9_+; ,\-=\/."]+>/g, '[图片]')
      draftText = draftText.replace(/&nbsp;/g, ' ');
      draftText = draftText.replace(/<br>/g, '')
      if (draft.quotedMessage) {
        draftText += '...'
      }
      return draftText;
    },

    lastMessageContent() {
      let conversationInfo = this.conversationInfo;
      return (conversationInfo.lastMessage && conversationInfo.lastMessage.messageContent) ? conversationInfo.lastMessage.messageContent.digest(conversationInfo.lastMessage) : '';
    },

    unread() {
      let conversationInfo = this.conversationInfo;
      let unreadCount = conversationInfo.unreadCount;
      return unreadCount ? (unreadCount.unread + unreadCount.unreadMention + unreadCount.unreadMentionAll) : 0;
    }
  },
};
</script>

<style scoped>
.conversation-item-container {
  padding-left: 12px;
}

.conversation-item-container.drag {
  border: 1px solid #d6d6d6;
}

.conversation-item {
  width: 100%;
  height: 70px;
  display: flex;
  border-bottom: 1px solid #eeeeee;
  align-items: center;
  justify-content: center;
}

.header {
  height: 100%;
  padding: 10px 12px 10px 0;
  margin-right: 2px;
  position: relative;
}

.header .avatar {
  position: relative;
  width: 45px;
  height: 45px;
  min-width: 45px;
  min-height: 45px;
  background: #d6d6d6;
  top: 50%;
  transform: translateY(-50%);
  border-radius: 3px;
}

.header .badge {
  position: absolute;
  color: white;
  font-size: 10px;
  background-color: red;
  border-radius: 8px;
  width: 16px;
  height: 16px;
  line-height: 16px;
  font-style: normal;
  text-align: center;
  right: 8px;
  top: 8px;
}

.header .badge.silent {
  width: 8px;
  height: 8px;
  font-size: 0;
}

.content-container {
  width: 100%;
  height: 50px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  padding-right: 12px;
}

.content-container .title-time-container {
  display: flex;
  width: 100%;
  justify-content: space-between;
}

.content-container .title-time-container .title {
  display: inline-block;
  font-size: 14px;
  color: #262626;
  font-style: normal;
  font-weight: normal;
  padding-right: 10px;
}

.content-container .title-time-container .time {
  display: inline-block;
  color: gray;
  font-size: 10px;
}

.content-container .content {
  display: flex;
  justify-content: space-between;
}

.content .draft {
  color: red;
  font-size: 13px;
}

.content .message {
  color: #b8b8b8;
  font-size: 13px;
}

.content i {
  color: #b8b8b8;
}


</style>
