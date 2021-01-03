<template>
  <div class="quoted-message-container">
    <div class="quoted-message">
      <p>
        {{ this.quotedMessageStr }}
      </p>

      <img v-if="[3, 6].indexOf(this.message.messageContent.type) >= 0"
           :src="'data:video/jpeg;base64,' + message.messageContent.thumbnail" alt="">
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
  },
  computed: {
    quotedMessageStr() {
      let str = '';
      if (this.message) {
        str = this.message._from._displayName + ':';
        if ([MessageContentType.Image, MessageContentType.Video].indexOf(this.message.messageContent.type) < 0) {
          str += this.message.messageContent.digest(this.message);
        }
      } else {
        str = this.messageDigest;
      }
      return str;
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
