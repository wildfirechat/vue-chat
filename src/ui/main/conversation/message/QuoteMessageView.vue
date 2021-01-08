<template>
  <div class="quoted-message-container">
    <div class="quoted-message">
      <p @click="preview">
        {{ this.quotedMessageStr }}
      </p>

      <img v-if="[3, 6, 7].indexOf(this.message.messageContent.type) >= 0"
           :src="mediaSrc" alt=""
           @click="preview"
      >
    </div>
    <i v-if="showCloseButton" @click="cancelQuoteMessage" class="icon-ion-close"></i>
  </div>
</template>

<script>
import store from "@/store";
import MessageContentType from "@/wfc/messages/messageContentType";
import Message from "@/wfc/messages/message";

export default {
  name: "QuoteMessageView",
  props: {
    showCloseButton: {
      type: Boolean,
      required: false,
      default: false,
    },
    message: {
      type: Message,
      required: true,
    },
    messageDigest: {
      type: String,
      required: false,
      default: '',
    },
    enableMessagePreview: {
      type: Boolean,
      required: false,
      default: false,
    }
  },

  data() {
    return {
      shareConversation: store.state.conversation,
    }
  },
  methods: {
    cancelQuoteMessage() {
      this.$emit('cancelQuoteMessage')
    },

    preview() {
      if (!this.enableMessagePreview) {
        return;
      }
      if (this.message) {
        switch (this.message.messageContent.type) {
          case MessageContentType.Video:
          case MessageContentType.Image:
            store.previewMessage(this.message, false);
            break;
          case MessageContentType.Text:
            // TODO
            break;
          default:
            break

        }
      }
    }
  },
  computed: {
    quotedMessageStr() {
      let str = '';
      if (this.message) {
        str = this.message._from._displayName + ':';
        if ([MessageContentType.Image, MessageContentType.Video, MessageContentType.Sticker].indexOf(this.message.messageContent.type) < 0) {
          str += this.message.messageContent.digest(this.message);
        }
      } else {
        str = this.messageDigest;
      }
      return str;
    },
    mediaSrc() {
      let src;
      let msgCnt = this.message.messageContent;
      src = msgCnt.thumbnail ? 'data:video/jpeg;base64,' + msgCnt.thumbnail : msgCnt.remotePath;
      return src;
    }
  },
}

</script>

<style lang="css" scoped>
.quoted-message-container {
  display: flex;
  align-items: center;
}

.quoted-message {
  display: flex;
  max-width: 100%;
  background-color: #e7e7e7;
  border-radius: 5px;
  padding: 5px 10px;
  margin-right: 10px;
}

.quoted-message p {
  max-width: 100%;
  max-height: 40px;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.quoted-message img {
  margin-left: 10px;
  border-radius: 3px;
  max-width: 100px;
  max-height: 100px;
}

</style>
