<template>
  <TextMessageContentView :message="message"
                          v-if="message.messageContent.type === 1"
                          v-bind:class="{leftarrow:message.direction === 1, rightarrow: message.direction === 0}"/>
  <ImageMessageContentView :message="message" v-else-if="message.messageContent.type === 3"
                           v-bind:class="{leftarrow:message.direction === 1, rightarrow: message.direction === 0}"/>
  <VideoMessageContentView :message="message" v-else-if="message.messageContent.type === 6"
                           v-bind:class="{leftarrow:message.direction === 1, rightarrow: message.direction === 0}"/>
  <p v-else>unknown</p>
</template>

<script>
import Message from "@/wfc/messages/message";
import TextMessageContentView from "@/ui/main/conversation/message/content/TextMessageContentView";
import ImageMessageContentView from "@/ui/main/conversation/message/content/ImageMessageContentView";
import VideoMessageContentView from "@/ui/main/conversation/message/content/VideoMessageContentView";

export default {
  name: "MessageContentContainerView",
  props: {
    message: {
      type: Message,
      required: true,
    }
  },
  components: {
    TextMessageContentView,
    ImageMessageContentView,
    VideoMessageContentView,
  }
}
</script>

<style scoped>

.leftarrow:before {
  /*right: -10px;*/
  left: -10px;
  top: 15px;
  position: absolute;
  border: solid transparent;
  content: "";
  height: 0;
  width: 0;
  pointer-events: none;
}

.leftarrow:before {
  border-color: transparent;
  border-right-color: #98ea70;
  border-width: 5px;
}


.rightarrow:before {
  /*right: -10px;*/
  left: 100%;
  top: 15px;
  position: absolute;
  border: solid transparent;
  content: "";
  height: 0;
  width: 0;
  pointer-events: none;
}

.rightarrow:before {
  border-color: transparent;
  border-left-color: #98ea70;
  border-width: 5px;
}
</style>
