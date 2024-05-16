<template>
    <div class="home-container" ref="home-container">
        <ElectronWindowsControlButtonView style="position: absolute; top: 0; right: 0"
                                          v-if="sharedMiscState.isElectronWindowsOrLinux"/>
        <div class="home">
            <section class="menu-container">
                <div>
                    <tippy
                        to="#infoTrigger"
                        interactive
                        :animate-fill="false"
                        distant="7"
                        theme="light"
                        animation="fade"
                        trigger="click"
                        :arrow="true"
                    >
                        <template #content>
                            <UserCardView v-if="sharedContactState.selfUserInfo" v-on:close="closeUserCard"
                                          :enable-update-portrait="true"
                                          :user-info="sharedContactState.selfUserInfo"/>
                        </template>
                    </tippy>

                    <img
                        v-if="sharedContactState.selfUserInfo"
                        ref="userCardTippy"
                        id="infoTrigger"
                        class="avatar"
                        draggable="false"
                        @click.prevent="onClickPortrait"
                        :src="sharedContactState.selfUserInfo.portrait"
                        alt=""
                    />
                </div>
                <nav class="menu">
                    <ul>
                        <li>
                            <div class="menu-item">
                                <i class="icon-ion-ios-chatboxes"
                                   v-bind:class="{active : this.$router.currentRoute.value.path === '/home'}"
                                   @click="go2Conversation"></i>
                                <em v-show="unread > 0" class="badge">{{ unread > 99 ? '···' : unread }}</em>
                            </div>
                        </li>
                        <li>
                            <div class="menu-item">
                                <i class="icon-ion-android-contact"
                                   v-bind:class="{active : this.$router.currentRoute.value.path === '/home/contact'}"
                                   @click="go2Contact"></i>
                                <em v-show="sharedContactState.unreadFriendRequestCount > 0" class="badge">{{ sharedContactState.unreadFriendRequestCount > 99 ? '99' : sharedContactState.unreadFriendRequestCount }}</em>
                            </div>
                        </li>
                        <li>
                            <i class="icon-ion-android-favorite"
                               v-bind:class="{active : this.$router.currentRoute.value.path === '/home/fav'}"
                               @click="go2Fav"></i>
                        </li>
                        <li v-if="sharedMiscState.isElectron && sharedMiscState.isCommercialServer">
                            <i class="icon-ion-ios-folder"
                               v-bind:class="{active : this.$router.currentRoute.value.path === '/home/files'}"
                               @click="go2Files"></i>
                        </li>
                        <li v-if="sharedMiscState.isElectron && sharedMiscState.enableOpenWorkSpace">
                            <i class="icon-ion-code-working"
                               v-bind:class="{active : this.$router.currentRoute.value.path === '/home/h-wp'}"
                               @click="go2Workspace"></i>
                        </li>
                        <li v-if="supportConference">
                            <i class="icon-ion-speakerphone"
                               v-bind:class="{active : this.$router.currentRoute.value.path === '/home/conference'}"
                               @click="go2Conference"></i>
                        </li>
                        <li>
                            <i class="icon-ion-android-settings"
                               v-bind:class="{active : this.$router.currentRoute.value.path === '/home/setting'}"
                               @click="go2Setting"></i>
                        </li>
                    </ul>
                </nav>
            </section>
            <router-view v-slot="{ Component, route }">
                <keep-alive>
                    <component :is="Component" :key="route.path"/>
                </keep-alive>
            </router-view>
            <div v-if="sharedMiscState.connectionStatus === -1" class="unconnected">网络连接断开</div>
            <div class="drag-area" :style="dragAreaLeft"></div>
            <UseDraggable v-if="!sharedMiscState.isElectron && sharedMiscState.isVoipOngoing"
                          class="voip-div-container"
                          draggable="true"
                          :initial-value="{x:'50%', y:'50%'}"
                          :prevent-default="true"
                          v-bind:class="{single:voipProxy.type === 'single', multi:voipProxy.type === 'multi', conference: voipProxy.type === 'conference'}"
            >
                <Single v-if="voipProxy.type === 'single'" ref="handle-id"/>
                <Multi v-if="voipProxy.type === 'multi'" ref="handle-id"/>
                <Conference v-if="voipProxy.type === 'conference'" ref="handle-id"/>
            </UseDraggable>
        </div>
    </div>
</template>

<script>
import UserCardView from "./user/UserCardView.vue";
import store from "../../store";
import wfc from "../../wfc/client/wfc";
import EventType from "../../wfc/client/wfcEvent";
import ConnectionStatus from "../../wfc/client/connectionStatus";
import ElectronWindowsControlButtonView from "../common/ElectronWindowsControlButtonView.vue";
import {removeItem} from "../util/storageHelper";
import {ipcRenderer} from "../../platform";
import avenginekit from "../../wfc/av/internal/engine.min";
import avenginekitproxy from "../../wfc/av/engine/avenginekitproxy";
import IpcEventType from "../../ipcEventType";
import {isElectron} from "../../platform";
import Single from "../voip/Single.vue";
import Multi from "../voip/Multi.vue";
import Conference from "../voip/conference/Conference.vue";
import 'tippy.js/dist/tippy.css' // optional for styling
import {UseDraggable} from '@vueuse/components'

var avenginkitSetuped = false;
export default {
    data() {
        return {
            sharedContactState: store.state.contact,
            sharedMiscState: store.state.misc,
            shareConversationState: store.state.conversation,
            supportConference: avenginekit.startConference !== undefined,
            isSetting: false,
            fileWindow: null,
            voipProxy: avenginekitproxy,
        };
    },

    methods: {
        onClickPortrait(event) {
            wfc.getUserInfo(this.sharedContactState.selfUserInfo.uid, true);
        },
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
            let hash = window.location.hash;
            let url = window.location.origin;
            if (hash) {
                url = window.location.href.replace(hash, '#/files');
            } else {
                url += "/files"
            }
            ipcRenderer.send(IpcEventType.SHOW_FILE_WINDOW, {
                url: url,
                source: 'file',
            });
            console.log('show-file-window', url)
        },
        go2Workspace() {
            // /workspace 和 /home/workspace 同时存在时，router 无法正确处理
            if (this.$router.currentRoute.path === '/home/h-wp') {
                return;
            }
            this.$router.replace("/home/h-wp");
            this.isSetting = false;
        },
        go2Conference() {
            if (this.$router.currentRoute.path === '/home/conference') {
                return;
            }
            this.$router.replace({path: "/home/conference"});
            this.isSetting = true;
        },
        go2Setting() {
            if (this.$router.currentRoute.path === '/home/setting') {
                return;
            }
            this.$router.replace({path: "/home/setting"});
            this.isSetting = true;
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
                || status === ConnectionStatus.ConnectionStatusKickedOff
                // TODO 断网时，显示网络断开状态
                // || status === ConnectionStatus.ConnectionStatusUnconnected
                || wfc.getUserId() === '') {

                if (this.$router.currentRoute.path !== '/') {
                    this.$router.replace({path: "/"});
                }
                if (status === ConnectionStatus.ConnectionStatusSecretKeyMismatch
                    || status === ConnectionStatus.ConnectionStatusLogout
                    || status === ConnectionStatus.ConnectionStatusTokenIncorrect
                    || status === ConnectionStatus.ConnectionStatusKickedOff
                    || status === ConnectionStatus.ConnectionStatusRejected) {
                    removeItem("userId");
                    removeItem('token')

                    avenginekitproxy.forceCloseVoipWindow();
                    console.error('连接失败', ConnectionStatus.desc(status));
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
            // 60为左边菜单栏的宽度，261为会话列表的宽度
            if (this.isSetting) {
                return {
                    left: '60px'
                }
            } else {
                return {
                    left: 'calc(60px + 261px)'
                }
            }
        }
    },

    created() {
        wfc.eventEmitter.on(EventType.ConnectionStatusChanged, this.onConnectionStatusChange)
        this.onConnectionStatusChange(wfc.getConnectionStatus())

        if (!isElectron() && !avenginkitSetuped) {
            avenginekit.setup();
            avenginkitSetuped = true;
        }
    },

    mounted() {
        avenginekitproxy.onVoipCallErrorCallback = (errorCode) => {
            if (errorCode === -1) {
                this.$notify({
                    title: '不能发起或接听新的音视频通话',
                    text: '目前有音视频通话正在进行中',
                    type: 'warn'
                });

            } else if (errorCode === -2) {
                if (isElectron()) {
                    console.error(`不支持音视频通话，原因可能是:
                        1. 可通过这个网页测试浏览器对音视频通话的支持情况，https://docs.wildfirechat.cn/webrtc/abilitytest/
                        2. 确保系统已授予当前应用 摄像头 和 麦克风 权限
                    `)
                } else {

                    console.error(`不支持音视频通话，原因可能是:
                        1. 浏览器上，只有通过 http://localhost 或 https://xxxx 访问的网页才支持音视频通话
                        2. 可通过这个网页测试浏览器对音视频通话的支持情况，https://docs.wildfirechat.cn/webrtc/abilitytest/
                        3. 确保浏览器已授予网页 摄像头 和 麦克风 权限
                        4. 确保系统已授予浏览器 摄像头 和麦克风 权限
                        5. 配置 https，请参考：https://docs.wildfirechat.cn/faq/web/https.html
                    `)
                }
                this.$notify({
                    title: '不支持音视频通话',
                    text: '请到手机上接听音视频通话',
                    type: 'warn'
                });
            }
        }
    },
    unmounted() {
        wfc.eventEmitter.removeListener(EventType.ConnectionStatusChanged, this.onConnectionStatusChange);
        console.log('home destroy')
    },

    components: {
        Conference,
        Multi,
        Single,
        UserCardView,
        ElectronWindowsControlButtonView,
        UseDraggable
    },
    directives: {}
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
    overflow: hidden;
}

.menu-container {
    width: 60px;
    min-width: 60px;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    /*background: linear-gradient(180deg, #292a2c 0%, #483a3a 100%);*/
    background: #E0E0DF;
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
    min-width: 16px;
    height: 16px;
    padding: 0 5px;
    line-height: 16px;
    font-style: normal;
    text-align: center;
    right: -12px;
    top: 4px;
}

i {
    font-size: 26px;
    color: #868686;
    cursor: pointer;
}

i:hover {
    color: #1f64e4;
}

i.active {
    color: #3f64e4;
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
    left: 60px;
    right: 0;
    color: red;
    padding: 15px 0;
    text-align: center;
    background: #f2f2f280;
    /*box-shadow: 0 0 1px #000;*/
}

.voip-div-container {
    background: #292929;
    position: fixed;
    margin: auto;
    border-radius: 5px;
    box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);
    display: flex;
    flex-direction: column;
}

.voip-div-container.single {
    width: 360px;
    height: 640px;
}

.voip-div-container.multi {
    width: 960px;
    height: 600px;
}

.voip-div-container.conference {
    width: 960px;
    height: 600px;
}

.voip-div-container .title {
    text-align: center;
    padding: 5px 0;
    background: #b6b6b6;
    display: flex;
    justify-content: center;
    align-content: center;
}

.voip-div-container .title i {
    pointer-events: none;
}

.voip-div-container .title i:hover {
    color: #868686;
}

.voip-div-container .title i:active {
    color: #868686;
}

.voip-div-container .content {
    flex: 1;
    border: none;
}
</style>
