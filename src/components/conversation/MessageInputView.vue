<template>
  <section class="message-input-container">
    <section class="input-action-container">
      <ul>
        <li><i class="icon-ion-ios-heart"></i></li>
        <li><i class="icon-ion-android-attach"></i></li>
      </ul>
      <ul>
        <li><i class="icon-ion-ios-telephone"></i></li>
        <li><i class="icon-ion-ios-videocam"></i></li>
      </ul>
    </section>
    <textarea class="input" name="input" id="" cols="30" rows="10"></textarea>
  </section>
</template>

<script>
export default {
  name: "MessageInputView",
};
</script>

<style lang='css' scoped>
.message-input-container {
  display: flex;
  flex-direction: column;
}

.input-action-container {
  height: 60px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.input {
  flex: 1;
}

ul li {
  display: inline;
  margin-left: 10px;
  margin-right: 10px;
}

i {
  font-size: 24px;
  color: #000;
  cursor: pointer;
}

i:hover {
  color: #34b7f1;
}
</style>
