<template>
  <section>
    <ul>
      <li v-for="(groupUser) in groupedUsers" :key="groupUser.category">
        <div ref="contactItem" class="contact-item">
          <div v-if="showCategoryLabel" class="label"
               :style="paddingStyle"
               v-bind:class="{sticky:enableCategoryLabelSticky}">
            <p>{{ groupUser.category.toUpperCase() }}</p>
          </div>
          <ul>
            <li v-for="(user) in groupUser.users" :key="user.uid">
              <div class="content"
                   :name="'user-'+user.uid"
                   :style="paddingStyle"
                   v-bind:class="{disabled: isUserUncheckable(user)}"
                   @click.stop="clickUserItem(user)">
                <input class="checkbox"
                       v-bind:value="user"
                       :checked="isUserInitialChecked(user)"
                       :disabled="isUserUncheckable(user)"
                       type="checkbox"
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
  name: "CheckableUserListView",
  props: {
    enablePick: {
      type: Boolean,
      default: false,
    },
    users: {
      type: Array,
      required: true,
    },
    initialCheckedUsers: {
      type: Array,
      required: false,
      default: null,
    },
    uncheckableUsers: {
      type: Array,
      required: false,
      default: null,
    },
    showCategoryLabel: {
      type: Boolean,
      required: false,
      default: true,
    },
    enableCategoryLabelSticky: {
      type: Boolean,
      required: false,
      default: false,
    },
    paddingLeft: {
      type: String,
      required: false,
      default: '5px'
    }
  },
  data() {
    return {
      sharedPickState: store.state.pick,
      sharedContactState: store.state.contact,
    }
  },
  methods: {
    clickUserItem(user) {
      if (this.isUserUncheckable(user)) {
        return;
      }
      store.pickOrUnpickUser(user)
    },

    isUserInitialChecked(user) {
      return this.initialCheckedUsers && this.initialCheckedUsers.findIndex(u => u.uid === user.uid) >= 0
    },

    isUserUncheckable(user) {
      return this.uncheckableUsers && this.uncheckableUsers.findIndex(u => u.uid === user.uid) >= 0;
    },
  },

  mounted() {
    if (this.initialCheckedUsers) {
      this.initialCheckedUsers.forEach(u => store.pickOrUnpickUser(u))
    }
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
    },
    paddingStyle() {
      return {
        paddingLeft: this.paddingLeft
      }
    },
  },
}
</script>

<style lang="css" scoped>

.contact-item {
  --user-item-padding-left: 30px;
}

ul {
  list-style: none;
  width: 100%;
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
  background-color: #fafafa;
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
  padding: 5px 5px 5px 0;
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

.disabled {
  pointer-events: none;
}
</style>
