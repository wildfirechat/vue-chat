<template>
  <section>
    <ul>
      <li v-for="(friend, index) in sharedContactState.friendList" :key="friend.uid">
        <div class="contact-item">
          <div v-if="contactLabel(friend, index)" class="label">
            <p>{{ contactLabel(friend, index) }}</p>
          </div>
          <div class="content"
               v-bind:class="{active: sharedContactState.currentFriend === friend}"
               @click="clickFriendItem(friend)">
            <input class="checkbox" v-bind:value="friend" v-if="enablePick" type="checkbox"
                   v-model="sharedPickState.users">
            <img class="avatar" :src="friend.portrait">
            <span
                class="single-line"> {{friendName(friend)}}</span>
          </div>
        </div>
      </li>
    </ul>
  </section>

</template>

<script>
import store from "@/store";

export default {
  name: "FriendListVue",
  props: {
    enablePick: null,
  },
  data() {
    return {
      sharedContactState: store.state.contact,
      sharedPickState: store.state.pick,
    }
  },
  methods: {

    clickFriendItem(friend) {
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

    friendName(friend) {
      let name;
      if (friend.friendAlias) {
        name = friend.friendAlias;
      } else if (friend.displayName) {
        name = friend.displayName;
      } else {
        name = friend.name;
      }
      return name;
    },

    contactLabel(friend, index) {
      // TODO 和前一个比较
      if (index === 0) {
        return 'A';
      } else if (index === 7) {
        return 'B';
      }
      return null;
    }
  }
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
