<template>
  <TextMessageContentView :message="message"
                          v-if="message.messageContent.type === 1"
                          v-bind:class="{leftarrow:message.direction === 1, rightarrow: message.direction === 0}"/>
  <AudioMessageContentView :message="message"
                           v-else-if="message.messageContent.type === 2"/>
  <ImageMessageContentView :message="message"
                           v-else-if="message.messageContent.type === 3"/>
  <!--                           v-bind:class="{leftarrow:message.direction === 1, rightarrow: message.direction === 0}"/>-->
  <FileMessageContentView :message="message"
                          v-else-if="message.messageContent.type === 5"
                          v-bind:class="{leftarrow:message.direction === 1, rightarrow: message.direction === 0}"/>
  <VideoMessageContentView :message="message"
                           v-else-if="message.messageContent.type === 6"/>
  <!--                           v-bind:class="{leftarrow:message.direction === 1, rightarrow: message.direction === 0}"/>-->
  <StickerMessageContentView :message="message"
                             v-else-if="message.messageContent.type === 7"/>
  <CompositeMessageContentView :message="message"
                               v-else-if="message.messageContent.type === 11"/>
  <CallStartMessageContentView :message="message"
                               v-else-if="message.messageContent.type === 400"/>
  <UserCardMessageContentView :message="message" v-else-if="message.messageContent.type === 10"/>
  <UnsupportMessageContentView :message="message"
                               v-else
                               v-bind:class="{leftarrow:message.direction === 1, rightarrow: message.direction === 0}"/>
</template>

<script>
import Message from "@/wfc/messages/message";
import TextMessageContentView from "@/ui/main/conversation/message/content/TextMessageContentView";
import ImageMessageContentView from "@/ui/main/conversation/message/content/ImageMessageContentView";
import VideoMessageContentView from "@/ui/main/conversation/message/content/VideoMessageContentView";
import UnsupportMessageContentView from "@/ui/main/conversation/message/content/UnsupportMessageContentView";
import FileMessageContentView from "@/ui/main/conversation/message/content/FileMessageContentView";
import StickerMessageContentView from "@/ui/main/conversation/message/content/StickerMessageContentView";
import CallStartMessageContentView from "@/ui/main/conversation/message/content/CallStartMessageContentView";
import AudioMessageContentView from "@/ui/main/conversation/message/content/AudioMessageContentView";
import CompositeMessageContentView from "@/ui/main/conversation/message/content/CompositeMessageContentView";
import UserCardMessageContentView from "./content/UserCardMessageContentView";

export default {
  name: "MessageContentContainerView",
  props: {
    message: {
      type: Message,
      required: true,
    }
  },
  components: {
    CompositeMessageContentView,
    AudioMessageContentView,
    CallStartMessageContentView,
    UnsupportMessageContentView,
    TextMessageContentView,
    ImageMessageContentView,
    VideoMessageContentView,
    FileMessageContentView,
    StickerMessageContentView,
      UserCardMessageContentView
  }
}
</script>

<style lang="css">


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
  border-right-color: white;
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
