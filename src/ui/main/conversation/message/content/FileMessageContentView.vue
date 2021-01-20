<template>
  <div class="file-message-container"
       @click="downloadFile"
       v-bind:class="{out:message.direction === 0}">
    <img :src="fileIcon" alt="">
    <div class="flex-column flex-align-start">
      <p class="file-name">{{ this.message.messageContent.name }}</p>
      <p class="file-size single-line">{{ size }}</p>
    </div>
  </div>
</template>

<script>
import Message from "@/wfc/messages/message";
import helper from "@/ui/util/helper";
import {downloadFile} from "@/platformHelper";

export default {
  name: "FileMessageContentView",
  props: {
    message: {
      type: Message,
      required: true,
    }
  },
  methods: {
    downloadFile() {
      downloadFile(this.message)
    }
  },
  mounted() {
    console.log('file message', this.message)
  },
  computed: {
    size() {
      let fileMsgContent = this.message.messageContent;
      return helper.humanSize(fileMsgContent.size)
    },
    fileIcon() {
      let fileName = this.message.messageContent.name;
      let icon = helper.getFiletypeIcon(fileName.substring(fileName.lastIndexOf('.') + 1))
      return require("@/assets/images/filetypes/" + icon);
    }
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
  display: flex;
  align-items: center;
  justify-content: flex-start;
  max-width: 80%;
  min-width: 150px;
}

.file-message-container img {
  width: 32px;
  height: 32px;
  margin-right: 10px;
  border-radius: 3px;
}

.file-message-container .file-name {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-message-container .file-size {
  color: #888888;
  font-size: 13px;
}

.file-message-container .text {
  color: #050505;
  font-size: 16px;
}

</style>
