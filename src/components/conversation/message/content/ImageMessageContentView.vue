<template>
  <div class="image-content-container">
    <img src="@/assets/images/crash.png">
  </div>
</template>

<script>
export default {
  name: "ImageMessageContentView"
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
