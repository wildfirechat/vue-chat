<template>
  <section>
    <ul>
      <li v-for="(user ) in users" :key="user.uid">
        <div class="contact-item">
          <div v-if="user._category" class="label">
            <p>{{ user._category.toUpperCase() }}</p>
          </div>
          <div class="content"
               v-bind:class="{active: user.uid === sharedContactState.currentFriend.uid}"
               @click.stop="clickUserItem(user)">
            <input class="checkbox" v-bind:value="user" v-if="enablePick" type="checkbox"
                   v-model="sharedPickState.users" placeholder="">
            <img class="avatar" :src="user.portrait" alt="">
            <span
                class="single-line"> {{ user._displayName }}</span>
          </div>
        </div>
      </li>
    </ul>
  </section>

</template>

<script>
import store from "@/store";

export default {
  name: "UserListVue",
  props: {
    enablePick: {
      type: Boolean,
      default: false,
    },
    users: {
      type: Array,
      required: true,
    },
  },
  data() {
    return {
      sharedPickState: store.state.pick,
      sharedContactState: store.state.contact,
    }
  },
  methods: {

    clickUserItem(friend) {
      // const test = this.sharedPickState.users.map(u => u.uid);
      // console.log('clickFriendItem t', friend, test, Array.from(test));
      if (this.enablePick) {
        if (this.sharedPickState.users.findIndex(value => value.uid === friend.uid) >= 0) {
          store.pickUser(friend, false);
        } else {
          store.pickUser(friend, true);
        }
      } else {
        store.setCurrentFriend(friend)
      }
    },
  },
  activated() {
    let el = this.$el.getElementsByClassName("active")[0];
    el && el.scrollIntoView({behavior: "instant", block: "center"});
  },
}
</script>

<style lang="css" scoped>

ul {
  list-style: none;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 3px;
}

.checkbox {
  margin-right: 10px;
}

.contact-item {
  display: flex;
  flex-direction: column;
  font-size: 13px;
  align-items: flex-start;
}

.contact-item .label {
  width: 100%;
  padding-left: 30px;
}

.contact-item .label p {
  padding: 5px 5px 5px 0;
  border-bottom: 1px solid #e0e0e0;
}

.contact-item .content {
  padding: 5px 5px 5px 30px;
  display: flex;
  width: 100%;
  align-items: center;
}

.contact-item .content span {
  margin-left: 10px;
}

.contact-item .content.active {
  background-color: #d6d6d6;
}

/*.contact-item .content:hover {*/
/*  background-color: red;*/
/*}*/

</style>
