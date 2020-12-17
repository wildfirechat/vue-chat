<template>
  <div class="text-message-container">
    <p class="text">{{this.message.messageContent.digest()}}</p>
  </div>
</template>

<script>
import Message from "@/wfc/messages/message";

export default {
  name: "TextMessageContentView",
  props: {
    message: {
      type: Message,
      required: true,
    }
  }
}
</script>

<style lang="css" scoped>
.text-message-container {
  margin: 0 10px;
  padding: 10px;
  background-color: #98ea70;
  position: relative;
  border-radius: 5px;
}

.text-message-container .text {
  color: #050505;
  font-size: 16px;
}

</style>
