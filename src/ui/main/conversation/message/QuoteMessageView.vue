<template>
  <div class="quoted-message-container">
    <div class="quoted-message">
      <p>
        {{ this.quotedMessageStr }}
      </p>

      <img v-if="[3, 6].indexOf(this.shareConversation.quotedMessage.messageContent.type) >= 0"
           :src="'data:video/jpeg;base64,' + shareConversation.quotedMessage.messageContent.thumbnail" alt="">
    </div>
    <i @click="cancelQuoMessage" class="icon-ion-close"></i>
  </div>
</template>

<script>
import store from "@/store";
import MessageContentType from "@/wfc/messages/messageContentType";

export default {
  name: "QuoteMessageView",
  data() {
    return {
      shareConversation: store.state.conversation,
    }
  },
  methods: {
    cancelQuoMessage() {
      store.quoteMessage(null);
    },
  },
  computed: {
    quotedMessageStr() {
      let str = this.shareConversation.quotedMessage._from._displayName + ':';
      if ([MessageContentType.Image, MessageContentType.Video].indexOf(this.shareConversation.quotedMessage.messageContent.type) < 0) {
        str += this.shareConversation.quotedMessage.messageContent.digest(this.quotedMessage);
      }
      return str;
    }
  },

}

</script>

<style lang="css" scoped>
.quoted-message-container {
  display: flex;
  max-width: 50%;
  align-items: center;
  padding: 10px 20px;
}

.quoted-message {
  display: flex;
  max-width: 100%;
  background-color: #e7e7e7;
  border-radius: 5px;
  padding: 5px 10px;
  margin-right: 10px;
  max-height: 100px;
}

.quoted-message p {
  padding-right: 10px;
  max-width: 100%;
  flex: 1;
  word-wrap: break-word;
  word-break: break-all;
  overflow: hidden;
  text-overflow: ellipsis;
}

.quoted-message img {
  max-width: 100px;
  max-height: 100px;
}

</style>
