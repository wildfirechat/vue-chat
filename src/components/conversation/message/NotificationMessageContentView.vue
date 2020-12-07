<template>
  <div class="notification-container">
    <p class="notification">Notification Message Content</p>
  </div>
</template>

<script>

export default {
  name: "NotificationMessageContentView",
  components: {}
}
</script>

<style lang="css" scoped>
.notification-container {
  display: flex;
  justify-content: center;
}

.notification-container .notification {
  color: #b8b8b8;
  margin: 20px 0;
  font-size: 14px;
}

</style>
