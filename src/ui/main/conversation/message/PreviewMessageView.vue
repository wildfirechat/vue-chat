<template>
  <section>
    <ul>
      <li v-for="msg in messages" :key="msg.messageId">
  <div class="message-container">
          <img src="@/assets/images/user-fallback.png" alt="" class="avatar">
          <div>
            <div class="message-sender-time">
              <p class="sender">消息发送者</p>
              <p class="time">2021/2/3 11:44</p>
  </div>
            <div class="message-content-container">
              <img v-if="msg.type === 3" class="image" src="@/assets/images/user-fallback.png" alt="">
              <p v-else-if="msg.type === 1" class="text">消息内容</p>
              <!--todo more-->
            </div>
          </div>
        </div>
      </li>
    </ul>

  </section>
</template>

<script>

export default {
  name: "PreviewMessageView",
  props: {
    title: {
      type: String,
      require: true,
  },
    messages: {
      type: Array,
      require: true,
    },
  },

  computed: {
    computedMessages() {
      // TODO show avatar or not
    }
  }
}
</script>

<style scoped>

</style>
