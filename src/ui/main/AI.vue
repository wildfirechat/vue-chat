<template>
  <div class="ai-container">
    <iframe
      src="https://static.wildfirechat.cn/chatbox-web/index.html"
      class="ai-frame"
      frameborder="0"
      allow="microphone; camera"
    ></iframe>
  </div>
</template>

<script>
export default {
  name: 'AI',
}
</script>

<style scoped>
.ai-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.ai-frame {
  width: 100%;
  height: 100%;
  border: none;
}
</style>
