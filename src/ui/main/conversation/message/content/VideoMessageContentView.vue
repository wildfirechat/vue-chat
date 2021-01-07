<template>
  <div class="video-content-container">
    <video @click="preview(message)" v-if="message.messageContent.localPath" preload="metadata"
           controls
           disablePictureInPicture
           :src="message.messageContent.localPath + '#t=0.1'"/>
    <video @click.prevent="preview(message)" v-else preload="metadata"
           controls
           controlsList="nodownload"
           disablePictureInPicture
           :poster="'data:video/jpeg;base64,' + message.messageContent.thumbnail"
           :src="message.messageContent.remotePath +'#t=0.1'"/>
  </div>
</template>

<script>
import Message from "@/wfc/messages/message";
import store from "@/store";

export default {
  name: "VideoMessageContentView",
  props: {
    message: {
      type: Message,
      required: true,
    }
  },
  methods: {
    preview(message) {
      console.log('preview', message);
      store.previewMessage(message, false);
    }
  }
}
</script>

<style lang="css" scoped>
.video-content-container {
  margin: 0 10px;
  position: relative;
  border: 1px solid #efefef;
  border-radius: 5px;
}

.video-content-container video {
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
