<template>
  <div class="home-container">
    <ElectronWindowsControlButtonView style="position: absolute; top: 0; right: 0"
                                      v-if="sharedMiscState.isElectronWindowsOrLinux"/>
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
            <UserCardView v-if="sharedContactState.selfUserInfo" v-on:close="closeUserCard"
                          :user-info="sharedContactState.selfUserInfo"/>
          </tippy>

          <a href="#"><img
              v-if="sharedContactState.selfUserInfo"
              ref="userCardTippy"
              name="infoTrigger"
              class="avatar"
              draggable="false"
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
            <li><i class="icon-ion-android-contact"
                   v-bind:class="{active : this.$router.currentRoute.path === '/home/contact'}"
                   @click="go2Contact"></i></li>
            <li v-if="sharedMiscState.isElectron">
              <i class="icon-ion-android-favorite"
                 v-bind:class="{active : this.$router.currentRoute.path === '/home/fav'}"
                 @click="go2Fav"></i>
            </li>
            <li v-if="sharedMiscState.isElectron && sharedMiscState.isCommercialServer">
              <i class="icon-ion-ios-folder"
                 v-bind:class="{active : this.$router.currentRoute.path === '/home/files'}"
                 @click="go2Files"></i>
            </li>
              <li>
                  <i class="icon-ion-android-upload"
                     @click="showUploadDialog"></i>
              </li>
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
      <div class="drag-area" :style="dragAreaLeft"></div>
      <div v-if="sharedMiscState.connectionStatus === -1" class="unconnected">网络连接断开</div>
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
import {removeItem, storage} from "@/ui/util/storageHelper";
import {BrowserWindow} from "@/platform";
import UploadRecordView from "./bigFile/UploadRecordView";

export default {
  data() {
    return {
      sharedContactState: store.state.contact,
      sharedMiscState: store.state.misc,
      shareConversationState: store.state.conversation,
      isSetting: false,
      fileWindow: null,
    };
  },

  methods: {
    go2Conversation() {
      if (this.$router.currentRoute.path === '/home') {
        return
      }
      this.$router.replace("/home");
      this.isSetting = false;
    },
    go2Contact() {
      if (this.$router.currentRoute.path === '/home/contact') {
        return;
      }
      this.$router.replace("/home/contact");
      this.isSetting = false;
    },
    go2Fav() {
      if (this.$router.currentRoute.path === '/home/fav') {
        return;
      }
      this.$router.replace("/home/fav");
      this.isSetting = false;
    },
    go2Files() {
      if (this.fileWindow) {
        this.fileWindow.show();
        this.fileWindow.focus();
        return;
      }
      let win = new BrowserWindow(
          {
            width: 800,
            height: 730,
            minWidth: 640,
            minHeight: 400,
            resizable: true,
            maximizable: true,
            webPreferences: {
              scrollBounce: false,
              nativeWindowOpen: true,
              nodeIntegration: true,
            },
          }
      );
      this.fileWindow = win;

      // win.webContents.openDevTools();
      win.on('close', () => {
        this.fileWindow = null;
      });

      // win.loadURL(path.join('file://', AppPath, 'src/index.html?' + type));
      let hash = window.location.hash;
      let url = window.location.origin;
      if (hash) {
        url = window.location.href.replace(hash, '#/files');
      } else {
        url += "/files"
      }
      win.loadURL(url);
      console.log('files windows url', url)
      win.show();
    },
    go2Setting() {
      if (this.$router.currentRoute.path === '/home/setting') {
        return;
      }
      this.$router.push({path: "/home/setting"});
      this.isSetting = true;
    },
      showUploadDialog(){
              let beforeOpen = () => {
                  console.log('Opening...')
              };
              let beforeClose = (event) => {
                  console.log('Closing...', event, event.params)
                  // What a gamble... 50% chance to cancel closing
                  // if (event.params.confirm) {
                  //     // TODO
                  //     console.log('confirm')
                  // } else {
                  //     console.log('cancel')
                  //     // TODO clear pick state
                  // }
              };
              let closed = (event) => {
                  console.log('Close...', event)
              };
              this.$modal.show(
                  UploadRecordView,
                  {
                  }, {
                      name: 'upload-modal',
                      width: 600,
                      height: 480,
                      clickToClose: true,
                  }, {
                      'before-open': beforeOpen,
                      'before-close': beforeClose,
                      'closed': closed,
                  })
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
          // TODO 断网时，显示网络断开状态
          // || status === ConnectionStatus.ConnectionStatusUnconnected
          || wfc.getUserId() === '') {

        if (this.$router.currentRoute.path !== '/') {
          this.$router.push({path: "/"});
        }
        if (status === ConnectionStatus.ConnectionStatusSecretKeyMismatch
            || status === ConnectionStatus.ConnectionStatusLogout
            || status === ConnectionStatus.ConnectionStatusTokenIncorrect
            || status === ConnectionStatus.ConnectionStatusRejected) {
          removeItem("userId");
          removeItem('token')
        }
      }
    },
  },

  computed: {
    unread() {
      let count = 0;
      this.shareConversationState.conversationInfoList.forEach(info => {
        if (info.isSilent) {
          return;
        }
        let unreadCount = info.unreadCount;
        count += unreadCount.unread;
      });
      return count;
    },
    dragAreaLeft() {
      // 68为左边菜单栏的宽度，250为会话列表的宽度
      if (this.isSetting) {
        return {
          left: '68px'
        }
      } else {
        return {
          left: 'calc(68px + 250px)'
        }
      }
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
  width: 68px;
  min-width: 68px;
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
  font-size: 26px;
  color: #868686;
  outline-color: red;
  cursor: pointer;
}

i:hover {
  color: deepskyblue;
}

i.active {
  color: #34b7f1;
}

.drag-area {
  position: absolute;
  top: 0;
  height: 60px;
  right: 140px;
  z-index: -1;
  -webkit-app-region: drag;
}

.unconnected {
  position: absolute;
  top: 0;
  left: 68px;
  right: 0;
  color: red;
  padding: 15px 0;
  text-align: center;
  background: #f2f2f280;
  box-shadow: 0 0 1px #000;
}
</style>
