<template>
  <div class="call-start-message-container"
       v-bind:class="{out:message.direction === 0}">
    <i class="icon-ion-android-call"></i>
    <p class="text" v-html="this.textContent"></p>
  </div>
</template>

<script>
import Message from "@/wfc/messages/message";

export default {
  name: "CallStartMessageContentView",
  props: {
    message: {
      type: Message,
      required: true,
    }
  },
  mounted() {
  },

  computed: {
    textContent() {
      let voip = this.message.messageContent;
      console.log('voip', voip);
      let desc = '视频通话';
      if (voip.status === 0) {
        desc = '对方未接听';

      } else if (voip.status === 1) {
        desc = '通话中';
      } else {
        if (voip.connectTime && voip.connectedTime > 0) {
          let duration = (voip.endTime - voip.connectTime()) / 1000;
          desc = `通话时长: ${duration}`

        } else {
          desc = '音视频通话';
        }
      }
      return desc;
    }
  }
}
</script>

<style lang="css" scoped>
.call-start-message-container {
  margin: 0 10px;
  padding: 10px;
  background-color: white;
  position: relative;
  border-radius: 5px;
  display: flex;
  align-items: center;
}

.call-start-message-container p {
  user-select: text;
  padding-left: 5px;
  white-space: pre-line;
}

.call-start-message-container.out {
  background-color: #98ea70;
}


.call-start-message-container .text {
  color: #050505;
  font-size: 16px;
}

</style>
