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
        <em v-if="unread > 0" class="badge">{{ unread }}</em>
      </div>
      <div class="content-container">
        <div class="title-time-container">
          <h2 class="title single-line">{{ conversationTitle }}</h2>
          <p class="time single-line">{{ conversationInfo._timeStr }}</p>
        </div>
        <div class="content">
          <p class="draft single-line" v-if="conversationInfo.draft">{{ conversationInfo.draft }}</p>
          <p class="message single-line" v-else>
            {{ conversationDesc }}</p>
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
      dragAndDropEnterCount: 0
    };
  },
  methods: {
    dragEvent(e, v) {
      console.log('ci', this.dragAndDropEnterCount)
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
          // toast
          console.log('一次最多发送5个文件');
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
    conversationDesc: function () {
      let conversationInfo = this.conversationInfo;
      return (conversationInfo.lastMessage && conversationInfo.lastMessage.messageContent) ? conversationInfo.lastMessage.messageContent.digest(conversationInfo.lastMessage) : '';
    },
    unread: function () {
      let conversationInfo = this.conversationInfo;
      if (conversationInfo.isSilent) {
        return 0;
      }
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
}

.content .message {
  color: #b8b8b8;
  font-size: 13px;
}

.content i {
  color: #b8b8b8;
}


</style>
