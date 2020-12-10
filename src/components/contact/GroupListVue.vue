<template>
  <section>
    <ul>
      <li v-for="(group, index) in groups" :key="index" @click="showGroup(group)">
        <div class="group-item" v-bind:class="{active: sharedContactState.currentGroup === group}">
          <img class="avatar" src="@/assets/images/user-fallback.png">
          <span class="single-line">imndx的群组</span>
        </div>
      </li>
    </ul>
  </section>

</template>

<script>
import store from "@/store";

export default {
  name: "GroupListVue",
  props: {
    groups: null,
  },
  data() {
    return {
      sharedContactState: store.state.contact,
    }
  },
  methods: {
    showGroup(group) {
      store.setCurrentGroup(group)
    }
  },
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
