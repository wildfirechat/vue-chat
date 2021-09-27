<template>
    <div class="home-container" ref="home-container">
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
                        @click="onClickPortrait()"
                        :src="sharedContactState.selfUserInfo.portrait"
                        alt=""
                    /></a>
                </div>
                <nav class="menu">
                    <ul>
                        <li>
                            <div class="menu-item">
                                <i class="icon-ion-ios-chatboxes"
                                   v-bind:class="{active : this.$router.currentRoute.path === '/home'}"
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
                        <li v-if="sharedMiscState.isElectron && sharedMiscState.wfc.isCommercialServer()">
                            <i class="icon-ion-ios-folder"
                               v-bind:class="{active : this.$router.currentRoute.path === '/home/files'}"
                               @click="go2Files"></i>
                        </li>
                        <li v-if="sharedMiscState.isElectron">
                            <i class="icon-ion-code-working"
                               v-bind:class="{active : this.$router.currentRoute.path === '/home/files'}"
                               @click="go2Workspace"></i>
                        </li>
                        <li>
                            <i class="icon-ion-android-upload"
                               @click="showUploadDialog"></i>
                        </li>
                        <li v-if="supportConference">
                            <i class="icon-ion-speakerphone"
                               @click="createConference"></i>
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
            <div v-if="sharedMiscState.connectionStatus === -1" class="unconnected">网络连接断开</div>
            <div class="drag-area" :style="dragAreaLeft"></div>
            <div v-if="!sharedMiscState.isElectron"
                 v-show="voipProxy.useIframe && voipProxy.callId"
                 class="voip-iframe-container"
                 v-draggable="draggableValue"
                 v-bind:class="{single:voipProxy.type === 'single', multi:voipProxy.type === 'multi', conference: voipProxy.type === 'conference'}"
            >
                <div ref="voip-dragger" class="title">
                    <i class="icon-ion-arrow-move"></i>
                    <p> 音视频通话</p>
                </div>
                <iframe ref="voip-iframe" class="content"
                        allow="geolocation; microphone; camera; midi; encrypted-media;">
                    <!--voip iframe-->
                </iframe>
            </div>
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
import {removeItem} from "@/ui/util/storageHelper";
import {ipcRenderer} from "@/platform";
import UploadRecordView from "./bigFile/UploadRecordView";
import CreateConferenceView from "../voip/CreateConferenceView";
import avenginekit from "../../wfc/av/internal/engine.min";
import localStorageEmitter from "../../ipc/localStorageEmitter";
import CallEndReason from "../../wfc/av/engine/callEndReason";
import avenginekitproxy from "../../wfc/av/engine/avenginekitproxy";
import {Draggable} from 'draggable-vue-directive'

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
            draggableValue: {
                handle: undefined,
                boundingElement: undefined,
                resetInitialPos: true,
            },
        };
    },

    methods: {
        onClickPortrait() {
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
            ipcRenderer.send('show-file-window', {
                url: url,
                source: 'file',
            });
            console.log('show-file-window', url)
        },
        go2Workspace() {
            let hash = window.location.hash;
            let url = window.location.origin;
            if (hash) {
                url = window.location.href.replace(hash, '#/workspace');
            } else {
                url += "/workspace"
            }
            ipcRenderer.send('show-workspace-window', {
                url: url,
            });
            console.log('show-workspace-window', url)
        },
        go2Setting() {
            if (this.$router.currentRoute.path === '/home/setting') {
                return;
            }
            this.$router.push({path: "/home/setting"});
            this.isSetting = true;
        },
        showUploadDialog() {
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
                {}, {
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
        createConference() {
            let beforeOpen = () => {
                console.log('Opening...')
            };
            let beforeClose = (event) => {
                console.log('Closing...', event, event.params)
            };
            let closed = (event) => {
                console.log('Close...', event)
            };
            this.$modal.show(
                CreateConferenceView,
                {}, {
                    name: 'create-conference-modal',
                    width: 320,
                    height: 400,
                    clickToClose: true,
                }, {
                    'before-open': beforeOpen,
                    'before-close': beforeClose,
                    'closed': closed,
                })
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
                    avenginekitproxy.forceCloseVoipWindow();
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
        localStorageEmitter.on('join-conference-failed', (sender, args) => {
            let reason = args.reason;
            let session = args.session;
            if (reason === CallEndReason.RoomNotExist) {
                if (session.host === wfc.getUserId()) {
                    this.$alert({
                        content: '会议已结束，是否重新开启会议？',
                        cancelCallback: () => {
                            // do nothing
                        },
                        confirmCallback: () => {
                            // 等待之前的音视频通话窗口完全关闭
                            setTimeout(() => {
                            avenginekitproxy.startConference(session.callId, session.audioOnly, session.pin, session.host, session.title, session.desc, session.audience, session.advance)
                            }, 1000);
                        }
                    })
                } else {
                    this.$notify({
                        title: '会议已结束',
                        text: '请联系主持人开启会议',
                        type: 'warn'
                    });
                }
            } else if (reason === CallEndReason.RoomParticipantsFull) {
                this.$notify({
                    title: '加入会议失败',
                    text: '参与者已满，请重试',
                    type: 'warn'
                });
            }
        });
    },

    mounted() {
        if (avenginekitproxy.useIframe) {
            let voipIframe = this.$refs["voip-iframe"];
            avenginekitproxy.setVoipIframe(voipIframe)
            this.draggableValue.handle = this.$refs['voip-dragger'];
            this.draggableValue.boundingElement = this.$refs['home-container']
        }
        avenginekitproxy.onVoipCallErrorCallback = (errorCode) => {
            if (errorCode === -1) {
                this.$notify({
                    title: '不能发起或接听新的音视频通话',
                    text: '目前有音视频通话正在进行中',
                    type: 'warn'
                });

            } else if (errorCode === -2) {
                this.$notify({
                    title: '不支持音视频通话',
                    text: '请到手机上接听音视频通话',
                    type: 'warn'
                });
            }
        }
    },
    destroyed() {
        wfc.eventEmitter.removeListener(EventType.ConnectionStatusChanged, this.onConnectionStatusChange);
        console.log('home destroy')
    },

    components: {
        UserCardView,
        ElectronWindowsControlButtonView
    },
    directives: {
        Draggable,
    }
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
    /*box-shadow: 0 0 1px #000;*/
}

.voip-iframe-container {
    background: #292929;
    position: absolute;
    top: 0;
    right: 0;
    display: flex;
    flex-direction: column;
}

.voip-iframe-container.single {
    width: 360px;
    height: 640px;
}

.voip-iframe-container.multi {
    width: 1024px;
    height: 800px;
}

.voip-iframe-container.conference {
    width: 1024px;
    height: 800px;
}

.voip-iframe-container .title {
    text-align: center;
    padding: 5px 0;
    background: #b6b6b6;
    display: flex;
    justify-content: center;
    align-content: center;
}

.voip-iframe-container .title i {
    pointer-events: none;
}

.voip-iframe-container .title i:hover {
    color: #868686;
}

.voip-iframe-container .title i:active {
    color: #868686;
}

.voip-iframe-container .content {
    flex: 1;
    border: none;
}

</style>
