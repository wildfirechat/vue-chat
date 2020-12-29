<template>
  <section>
    <ul>
      <li v-for="(groupUser) in groupedUsers" :key="groupUser.category">
        <div class="contact-item">
          <div class="label"
               v-bind:class="{sticky:enableCategoryLabelSticky}">
            <p>{{ groupUser.category.toUpperCase() }}</p>
          </div>
          <ul>
            <li v-for="(user) in groupUser.users" :key="user.uid">
              <div class="content"
                   v-bind:class="{active: !enablePick && sharedContactState.currentFriend && user.uid === sharedContactState.currentFriend.uid}"
                   @click.stop="clickUserItem(user)">
                <input class="checkbox" v-bind:value="user" v-if="enablePick" type="checkbox"
                       v-model="sharedPickState.users" placeholder="">
                <img class="avatar" :src="user.portrait" alt="">
                <span
                    class="single-line"> {{ user._displayName }}</span>
              </div>

            </li>
          </ul>
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
    enableCategoryLabelSticky: {
      type: Boolean,
      required: false,
      default: false,
    }
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
        store.pickOrUnpickUser(friend)
      } else {
        store.setCurrentFriend(friend)
      }
    },
  },
  activated() {
    let el = this.$el.getElementsByClassName("active")[0];
    el && el.scrollIntoView({behavior: "instant", block: "center"});
  },

  computed: {
    groupedUsers() {
      let groupedUsers = [];
      let current = {};
      this.users.forEach((user) => {
        if (user._category) {
          current = {
            category: user._category,
            users: [user],
          };
          groupedUsers.push(current);
        } else {
          current.users.push(user);
        }
      });
      return groupedUsers;
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
  background-color: #f7f7f7;
}

.contact-item .label p {
  padding: 5px 5px 5px 0;
  border-bottom: 1px solid #e0e0e0;
}

.contact-item .label.sticky {
  position: sticky;
  top: 0;
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

.contact-item .content:active {
  background-color: #d6d6d6;
}

/*.contact-item .content:hover {*/
/*  background-color: red;*/
/*}*/

</style>
