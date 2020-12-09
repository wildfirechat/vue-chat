<template>
  <section>
    <ul>
      <li v-for="(group, index) in groups" :key="index">
        <div class="group-item" v-bind:class="{active: currentGroup === group}">
          <img class="avatar" src="@/assets/images/user-fallback.png">
          <span class="single-line">imndx的群组</span>
        </div>
      </li>
    </ul>
  </section>

</template>

<script>
export default {
  name: "GroupListVue",
  props: {
    groups: null,
  },
  data() {
    return {
      currentGroup: 2,
    }
  }
}
</script>

<style scoped>
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 3px;
}

.group-item {
  height: 50px;
  padding: 5px 10px 5px 30px;
  display: flex;
  font-size: 13px;
  align-items: center;
}

.group-item.active {
  background-color: #d6d6d6;
}

.group-item span {
  margin-left: 10px;
}

</style>
