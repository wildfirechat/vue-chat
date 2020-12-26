<template>
  <div class="conversation-item-container">
    <div class="conversation-item">
      <div class="header">
        <img class="avatar" :src="conversationInfo.conversation._target.portrait" alt=""/>
        <em v-if="unread > 0" class="badge">{{ unread }}</em>
      </div>
      <div class="content">
        <div class="title-time-container">
          <h2 class="title single-line">{{ conversationTitle }}</h2>
          <p class="time single-line">{{ conversationInfo._timeStr }}</p>
        </div>
        <div>
          <p class="draft single-line" v-if="conversationInfo.draft">{{ conversationInfo.draft }}</p>
          <p class="message single-line" v-else>
            {{ conversationDesc }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ConversationInfo from "@/wfc/model/conversationInfo";
import ConversationType from "@/wfc/model/conversationType";

export default {
  name: "ConversationItemView",
  props: {
    conversationInfo: {
      type: ConversationInfo,
      required: true,
    },
  },
  data() {
    return {};
  },
  methods: {},
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
  }
};
</script>

<style scoped>
.conversation-item-container {
  padding-left: 12px;
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

.content {
  width: 100%;
  height: 50px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
}

.content .title-time-container {
  display: flex;
  width: 100%;
  padding-right: 12px;
  justify-content: space-between;
}

.content .title-time-container .title {
  display: inline-block;
  font-size: 14px;
  color: #262626;
  font-style: normal;
  font-weight: normal;
  padding-right: 10px;
}

.content .title-time-container .time {
  display: inline-block;
  color: gray;
  font-size: 10px;
}

.content .draft {
  color: red;
}

.content .message {
  color: #b8b8b8;
  font-size: 13px;
}


</style>
