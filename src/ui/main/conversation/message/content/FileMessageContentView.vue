<template>
  <div class="file-message-container"
       v-bind:class="{out:message.direction === 0}">
    <p class="text">[文件]{{ this.message.messageContent.name }}</p>
  </div>
</template>

<script>
import Message from "@/wfc/messages/message";

export default {
  name: "FileMessageContentView",
  props: {
    message: {
      type: Message,
      required: true,
    }
  },
  mounted() {
    console.log('file message', this.message)
  }
}
</script>

<style lang="css" scoped>
.file-message-container {
  margin: 0 10px;
  padding: 10px;
  background-color: white;
  position: relative;
  border-radius: 5px;
}

.file-message-container.out {
  background-color: #98ea70;
}


.file-message-container .text {
  color: #050505;
  font-size: 16px;
}

</style>
