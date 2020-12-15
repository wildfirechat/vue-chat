<template>
  <div class="image-content-container">
    <img src="@/assets/images/crash.png">
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

.right-arrow:before {
  border-left-color: white;
}

.left-arrow:before {
  border-left-color: white;
}

</style>
