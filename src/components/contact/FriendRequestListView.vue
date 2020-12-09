<template>
  <section>
    <ul>
      <li v-for="(friend,index) in newFriends" :key="index" @click="showFriendRequest(friend)">
        <div class="new-friend-item-container" v-bind:class="{active :sharedState.currentFriendRequest ===friend}">
          <div class="new-friend-item">
            <img class="avatar" src="@/assets/images/user-fallback.png">
            <div class="info">
              <div class="name-action">
                <span class="name single-line">imndx</span>
                <span class="accepted" v-if="index >= 3">已添加</span>
                <button class="accept" v-if="index < 3">添加</button>
              </div>
              <p class="reason single-line">我是{{ friend }}</p>
            </div>
          </div>
        </div>
      </li>
    </ul>
  </section>

</template>

<script>
import store from "@/store";

export default {
  name: "NewFriendListView",
  props: {
    newFriends: null,
  },
  data() {
    return {
      sharedState: store.state,
    };
  },
  methods: {
    showFriendRequest(friendRequest) {
      store.setCurrentFriendRequest(friendRequest);
    }
  }
}
</script>

<style lang="css" scoped>
.new-friend-item-container {
  padding-left: 30px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 3px;
}

.new-friend-item {
  display: flex;
  width: 100%;
  padding: 10px 15px 10px 0;
  align-items: center;
  font-size: 13px;
  border-bottom: 1px solid #e0e0e0;
}


.new-friend-item-container.active {
  background-color: #d6d6d6;
}

.new-friend-item-container:hover {
  background-color: #d6d6d6;
}

.new-friend-item .info {
  margin-left: 10px;
  flex: 1;
}

.new-friend-item .info .name-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.new-friend-item .info .name-action .name {
  flex: 1;
}

.new-friend-item .info .name-action .accept {
  padding: 0 5px;
  text-align: center;
}

.new-friend-item .info .name-action .accepted {
  color: #b2b2b2;
}

.new-friend-item .info .reason {
  font-size: 12px;
  color: #b2b2b2;
}


</style>
