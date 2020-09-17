<template>
  <div class="hello">
    <h2>野火IM 消息收发功能测试</h2>
    <div>
      <p>Send message to robot</p>
      <input v-model="messageToSend" placeholder="input to send">
      <button v-on:click="sendMessageToFireRobot">Send</button>
    </div>

    <h3>Last message from robot </h3>
    <p>{{ lastMessageFromRobot }}</p>
  </div>
</template>

<script>
import wfc from "@/wfc/client/wfc";
import EventType from "@/wfc/client/wfcEvent";
import Conversation from "@/wfc/model/conversation";
import ConversationType from "@/wfc/model/conversationType";
import TextMessageContent from "@/wfc/messages/textMessageContent";

export default {
  name: 'TestWfc',
  props: {},

  data() {
    return {
      lastMessageFromRobot: '',
      messageToSend: null,
    }
  },

  created() {
    wfc.eventEmitter.on(EventType.ReceiveMessage, this.onReceiveMessage);

  },

  methods: {
    onReceiveMessage(message) {
      console.log('receive msg', message);
      if (message.from === 'FireRobot') {
        this.lastMessageFromRobot = message.messageContent.digest();
      }
    },
    sendMessageToFireRobot() {
      if (!this.messageToSend) {
        console.log('not nothing...')
        return;
      }
      let conversation = new Conversation(ConversationType.Single, 'FireRobot', 0);
      let textMessageContent = new TextMessageContent(this.messageToSend);
      wfc.sendConversationMessage(conversation, textMessageContent);
      this.messageToSend = null;
    }
  },


}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  display: inline-block;
  margin: 0 10px;
}

a {
  color: #42b983;
}
</style>
