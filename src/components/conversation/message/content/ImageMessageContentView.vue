<template>
  <div class="image-content-container">
    <img v-bind:src="message.messageContent.remotePath">
  </div>
</template>

<script>
import Message from "@/wfc/messages/message";

export default {
  name: "ImageMessageContentView",
  props: {
    message: {
      type: Message,
      required: true,
    }
  }
}
</script>

<style lang="css" scoped>
.image-content-container {
  margin: 0 10px;
  position: relative;
  border: 1px solid #efefef;
  border-radius: 5px;
}

.image-content-container img{
  max-height: 400px;
  max-width: 400px;
  border-radius: 5px;
  overflow: hidden;
}

.right-arrow:before {
  border-left-color: white;
}

.left-arrow:before {
  border-left-color: white;
}

</style>
