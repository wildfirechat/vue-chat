<template>
  <section class="forward-message-container">
    <div class="forward-message">
      <img v-if="[3, 6].indexOf(message.messageContent.type) >= 0"
           :src="'data:video/jpeg;base64,' + message.messageContent.thumbnail" alt="">
      <p v-else>
        {{ this.forwardMessageStr }}
      </p>
    </div>
    <label>
      <input type="text" placeholder="给朋友留言" v-model="extraMessageText">
    </label>
  </section>
</template>

<script>
import Message from "@/wfc/messages/message";
import MessageContentType from "@/wfc/messages/messageContentType";

export default {
  name: "ForwardMessageView",
  props: {
    message: {
      type: Message,
      required: true,
    },
  },
  data() {
    return {
      extraMessageText: '',
    }
  },
  methods: {},
  computed: {
    forwardMessageStr() {
      let str = this.message._from._displayName + ':';
      if ([MessageContentType.Image, MessageContentType.Video].indexOf(this.message.messageContent.type) < 0) {
        str += this.message.messageContent.digest(this.quotedMessage);
      }
      return str;
    }
  },
}
</script>

<style lang="css" scoped>
.forward-message-container {
  width: 100%;
  padding: 0 30px;
}

.forward-message {
  display: flex;
  max-width: 100%;
  border-radius: 5px;
  justify-content: center;
  max-height: 100px;
}

.forward-message p {
  padding: 5px 10px;
  border-radius: 5px;
  word-wrap: break-word;
  word-break: break-all;
  color: #aaaaaa;
  font-size: 13px;
  overflow: hidden;
  background-color: #e7e7e7;
  text-overflow: ellipsis;
}

.forward-message img {
  max-width: 200px;
  max-height: 200px;
  border-radius: 3px;
}

.forward-message-container label input {
  width: 100%;
  margin: 20px 0;
  outline: none;
  border-top: 0;
  border-right: 0;
  border-left: 0;
  border-bottom: 1px solid #e6e6e6;
}

</style>
