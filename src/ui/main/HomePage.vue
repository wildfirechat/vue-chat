<template>
  <div class="home-container">
    <ElectronWindowsControlButtonView style="position: absolute; top: 0; right: 0"
                                      v-if="sharedMiscState.isElectronWindows"/>
    <div class="home">
      <section class="menu-container">
        <div>
          <!-- todo tippy example -->
          <tippy
              to="infoTrigger"
              interactive
              :animate-fill="false"
              placement="right"
              distant="7"
              theme="light"
              animation="fade"
              trigger="click"
              arrow
          >
            <UserCardView v-on:close="closeUserCard" :user-info="sharedContactState.selfUserInfo"/>
            <!--            <div class="user-info-container">-->
            <!--              <h3>Header</h3>-->
            <!--              <p style="color: black">TODO - data binding</p>-->
            <!--              <button @click="test">Click</button>-->
            <!--            </div>-->
          </tippy>

          <a href="#"><img
              ref="userCardTippy"
              name="infoTrigger"
              class="avatar"
              :src="sharedContactState.selfUserInfo.portrait"
              alt=""
          /></a>
        </div>
        <nav class="menu">
          <ul>
            <li>
              <div class="menu-item">
                <i class="icon-ion-ios-chatboxes" v-bind:class="{active : this.$router.currentRoute.path === '/home'}"
                   @click="go2Conversation"></i>
                <em v-show="unread > 0" class="badge">{{ unread > 99 ? '99' : unread }}</em>
              </div>
            </li>
            <li><i class="icon-ion-ios-contact"
                   v-bind:class="{active : this.$router.currentRoute.path === '/home/contact'}"
                   @click="go2Contact"></i></li>
            <li>
              <i class="icon-ion-android-settings"
                 v-bind:class="{active : this.$router.currentRoute.path === '/home/setting'}"
                 @click="go2Setting"></i>
            </li>
          </ul>
        </nav>
      </section>
      <keep-alive>
        <router-view :key="$route.fullPath"></router-view>
      </keep-alive>
    </div>
  </div>
</template>

<script>
import UserCardView from "@/ui/main/user/UserCardView";
import store from "@/store";
import wfc from "@/wfc/client/wfc";
import EventType from "@/wfc/client/wfcEvent";
import ConnectionStatus from "@/wfc/client/connectionStatus";
import ElectronWindowsControlButtonView from "@/ui/common/ElectronWindowsControlButtonView";

export default {
  data() {
    return {
      sharedContactState: store.state.contact,
      sharedMiscState: store.state.misc,
      shareConversationState: store.state.conversation,
    };
  },

  methods: {
    go2Conversation() {
      if (this.$router.currentRoute.path === '/home') {
        return
      }
      this.$router.replace("/home");
    },
    go2Contact() {
      if (this.$router.currentRoute.path === '/home/contact') {
        return;
      }
      this.$router.replace("/home/contact");
    },
    go2Setting() {
      if (this.$router.currentRoute.path === '/home/setting') {
        return;
      }
      this.$router.push({path: "/home/setting"});
    },

    closeUserCard() {
      console.log('closeUserCard')
      this.$refs["userCardTippy"]._tippy.hide();
    },

    onConnectionStatusChange(status) {
      if (status === ConnectionStatus.ConnectionStatusRejected
          || status === ConnectionStatus.ConnectionStatusLogout
          || status === ConnectionStatus.ConnectionStatusSecretKeyMismatch
          || status === ConnectionStatus.ConnectionStatusTokenIncorrect
          || status === ConnectionStatus.ConnectionStatusUnconnected
          || wfc.getUserId() === '') {

        if (this.$router.currentRoute.path !== '/') {
          this.$router.push({path: "/"});
        }
      }
    }
  },

  computed: {
    unread() {
      let count = 0;
      this.shareConversationState.conversationInfoList.forEach(info => {
        if (info.isSilent) {
          return;
        }
        let unreadCount = info.unreadCount;
        count += unreadCount.unread + unreadCount.unreadMention + unreadCount.unreadMentionAll;
      });
      return count;
    }

  },

  created() {
    wfc.eventEmitter.on(EventType.ConnectionStatusChanged, this.onConnectionStatusChange)
    this.onConnectionStatusChange(wfc.getConnectionStatus())
  },
  destroyed() {
    wfc.eventEmitter.removeListener(EventType.ConnectionStatusChanged, this.onConnectionStatusChange);
    console.log('home destroy')
  },

  components: {
    UserCardView,
    ElectronWindowsControlButtonView
  },
};
</script>

<style lang="css" scoped>

.home {
  display: flex;
  width: calc(100vw - var(--main-margin-left) - var(--main-margin-right));
  height: calc(100vh - var(--main-margin-top) - var(--main-margin-bottom));
  justify-content: center;
  align-items: center;
  background-color: white;
  border-radius: var(--main-border-radius);
}

.menu-container {
  width: 70px;
  min-width: 70px;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: linear-gradient(180deg, #292a2c 0%, #483a3a 100%);
  border-top-left-radius: var(--main-border-radius);
  border-bottom-left-radius: var(--main-border-radius);
  padding: var(--home-menu-padding-top) 0 20px 0;
  -webkit-app-region: drag;
}

.avatar {
  background-color: gray;
  width: 35px;
  height: 35px;
  display: block;
  margin: 10px auto;
  border-radius: 3px;
}

.menu {
  flex: 1;
}

.menu ul {
  height: 100%;
  display: flex;
  flex-direction: column;
  -webkit-app-region: drag
}

.menu ul li {
  margin: 10px;
  height: 40px;
  line-height: 50px;
}

.menu ul li:last-of-type {
  margin-top: auto;
  margin-bottom: 20px;
}

.menu .menu-item {
  position: relative;
}

.menu .menu-item .badge {
  position: absolute;
  color: white;
  font-size: 10px;
  background-color: red;
  border-radius: 8px;
  width: 16px;
  height: 16px;
  line-height: 16px;
  font-style: normal;
  text-align: center;
  right: -12px;
  top: 4px;
}

i {
  font-size: 24px;
  color: #000;
  cursor: pointer;
}

i:hover {
  color: #34b7f1;
}

i.active {
  color: #34b7f1;
}
</style>
