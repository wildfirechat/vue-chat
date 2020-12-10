<template>
  <section>
    <div class="group-info-container">
      <div class="group-info">
        <img src="@/assets/images/default_group_avatar.png">
        <p>群名称 {{ group }}</p>
      </div>
      <a>进入群聊</a>
    </div>
  </section>
</template>

<script>
export default {
  name: "GroupDetailView",
  props: {
    group: null,
  }

}
</script>

<style lang="css" scoped>

.group-info-container {
  display: flex;
  height: 100%;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.group-info-container a {
  color: white;
  padding: 10px 40px;
  background-color: #20fb64;
  border-radius: 5px;
  font-size: 14px;
  border: 1px solid transparent;
}

.group-info-container a:active {
  background-color: red;
}

.group-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.group-info img {
  height: 120px;
  width: 120px;
  border: 1px solid red;
  border-radius: 5px;
}

.group-info p {
  margin-top: 20px;
  font-size: 20px;
  margin-bottom: 100px;
}

</style>
