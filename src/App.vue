<template>
    <div id="app-main"
         style="width: 100vw; height: 100vh"
         @contextmenu.prevent=""
         @dragenter="$event.preventDefault()"
         @dragover="$event.preventDefault()"
         @drop="$event.preventDefault()"
         v-visibility-change="visibilityChange">
        <!-- 锁定界面 -->
        <LockScreenView v-if="sharedMiscState.isLocked" />
        <div v-if="!sharedMiscState.isElectron" id="blur-container" class="blur-container">
            <div class="hero-bg-gradient"></div>
            <div class="hero-bg-pattern"></div>
            <div class="hero-bg-blob blob-1"></div>
            <div class="hero-bg-blob blob-2"></div>
            <div class="hero-bg-blob blob-3"></div>
        </div>
        <!--用来实现视频缩略图-->
        <div id="styled_video_container" class="styled_video_container">
            <video id="bgvid" playsinline autoplay muted loop crossorigin="anonymous">
                <!-- <source src="http://thenewcode.com/assets/videos/polina.webm" type="video/webm">
                <source src="http://thenewcode.com/assets/videos/polina.mp4" type="video/mp4"> -->
            </video>
        </div>

        <CoolLightBox
            v-if="!sharedMiscState.isElectron"
            :items="sharedConversationState.previewMediaItems"
            :index="sharedConversationState.previewMediaIndex"
            :slideshow="false"
            @close="sharedConversationState.previewMediaIndex = null">
        </CoolLightBox>
        <notifications v-if="sharedMiscState.isMainWindow"/>
        <IpcMain v-if="sharedMiscState.isMainWindow && sharedMiscState.isElectron"/>
        <router-view id="main-content-container" class="main-content-container"></router-view>
    </div>
</template>

<script>
import store from "./store";
import {isElectron} from "./platform";
import CoolLightBox from './vendor/vue-cool-lightbox'
import './vendor/vue-cool-lightbox/dist/vue-cool-lightbox.min.css'
import IpcMain from "./ipc/ipcMain";
import {currentWindow} from "./platform";
import wfc from "./wfc/client/wfc";
import waterMark from "./ui/util/waterMark";
import Config from "./config";
import LockScreenView from "./ui/common/LockScreenView";

export default {
    name: 'App',
    data() {
        return {
            url: '',
            sharedMiscState: store.state.misc,
            sharedConversationState: store.state.conversation,
        }
    },
    methods: {
        visibilityChange(event, hidden) {
            store.setPageVisibility(!hidden);
            console.log('page visibilityChange', hidden);
            if (!hidden && !isElectron()){
                wfc.onForeground();
            }
        },
        onblur() {
            store.setPageVisibility(false);
        },
        onfocus() {
            store.setPageVisibility(true);
        },
        onBeforeUnload() {
            // 如果处于锁定状态，清除自动登录相关的本地存储
            if (this.sharedMiscState.isLocked) {
                console.log('App is locked, clearing auto login data');
                const userId = localStorage.getItem('userId');
                if (userId) {
                    localStorage.removeItem(userId + '-' + 'autoLogin');
                    localStorage.removeItem('token');
                }
            }
        }
    },

    created() {
        let root = document.documentElement;
        // Apply theme
        store.applyTheme();
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            if (this.sharedMiscState.theme === 'system') {
                store.applyTheme();
            }
        });
        if (isElectron() || window.location.href.indexOf('voip') >= 0) {
            root.style.setProperty('--main-margin-left', '0px');
            root.style.setProperty('--main-margin-right', '0px');
            root.style.setProperty('--main-margin-top', '0px');
            root.style.setProperty('--main-margin-bottom', '0px');
            root.style.setProperty('--composite-message-page-width', '100vw');
            root.style.setProperty('--composite-message-page-height', '100vh');
        }

        if (this.sharedMiscState.isElectronWindowsOrLinux) {
            root.style.setProperty('--main-border-radius', '0px')
            root.style.setProperty('--home-menu-padding-top', '0px')
        }
        window.addEventListener('blur', this.onblur);
        window.addEventListener('focus', this.onfocus);
        window.addEventListener('beforeunload', this.onBeforeUnload);
        if (isElectron()){
            currentWindow.minimizable = this.sharedMiscState.enableMinimize;
        }
    },

    mounted() {
        let href = window.location.href;
        if (href.indexOf('voip') >= 0 || href.indexOf('files') >= 0) {
            let app = document.getElementById("app-main");
            let el;
            el = document.getElementById("blur-container");
            el && app.removeChild(el)
            el = document.getElementById('styled_video_container');
            el && app.removeChild(el)
            // app.style.backgroundColor = 'red'
        }
        this.$eventBus.$on('uploadFile', file => {
            if (!file) {
                return;
            }
            if (file.size > 100 * 1024 * 1024 && !wfc.isSupportBigFilesUpload()) {
                this.$notify({
                    title: '大文件提示',
                    text: ' 不支持大文件上传',
                    type: 'warn'
                });
            }
        })
        if(Config.ENABLE_WATER_MARK){
            waterMark.init()
        }
    },
    beforeUnmount() {
        this.$eventBus.$off('uploadFile');
        window.removeEventListener('blur', this.onblur)
        window.removeEventListener('focus', this.onfocus)
        window.removeEventListener('beforeunload', this.onBeforeUnload)
        if(Config.ENABLE_WATER_MARK) {
            waterMark.remove()
        }
    },
    components: {
        IpcMain,
        CoolLightBox,
        LockScreenView,
    }
}

</script>

<!--should not scoped-->
<style lang="css">

:root {
    --main-border-radius: 10px;
    --main-margin-left: 80px;
    --main-margin-right: 80px;
    --main-margin-top: 50px;
    --main-margin-bottom: 50px;
    --tippy-right: 0px;
    --home-menu-padding-top: 60px;
    --composite-message-page-width: 100%;
    --composite-message-page-height: 100%;
}

.tippy-tooltip {
    right: var(--tippy-right) !important;
    border: 1px solid var(--border-subtle) !important;
    background-color: var(--background-tooltip) !important;
    box-shadow: var(--shadow-tooltip);
}

#app {
    position: relative;
}

.blur-container {
    overflow: hidden;
    height: 100vh;
    width: 100vw;
    z-index: -10;
    position: fixed;
    margin: 0;
}

.hero-bg-gradient {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--hero-bg-gradient);
}

.hero-bg-pattern {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: var(--hero-bg-pattern);
    background-size: 32px 32px;
}

.hero-bg-blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(100px);
    opacity: var(--hero-bg-blob-opacity);
    animation: float 15s ease-in-out infinite;
}

.blob-1 {
    width: 700px;
    height: 700px;
    background: var(--hero-bg-blob-1);
    top: -250px;
    right: -150px;
    animation-delay: 0s;
}

.blob-2 {
    width: 500px;
    height: 500px;
    background: var(--hero-bg-blob-2);
    bottom: 50px;
    left: -150px;
    animation-delay: -7s;
}

.blob-3 {
    width: 300px;
    height: 300px;
    background: var(--hero-bg-blob-3);
    top: 30%;
    left: 10%;
    filter: blur(80px);
    opacity: var(--hero-bg-blob-opacity-dim);
    animation: float 12s ease-in-out infinite;
    animation-delay: -3s;
}

@keyframes float {
    0%, 100% {
        transform: translate(0, 0);
    }
    50% {
        transform: translate(15px, -25px);
    }
}

.styled_video_container {
    position: fixed;
    top: 0;
    left: 0;
    width: auto;
    height: auto;
    z-index: -999;
    background-size: cover;
    transition: 1s opacity;
    opacity: 0;
}

.main-content-container {
    z-index: 999;
    position: absolute;
    width: calc(100vw - var(--main-margin-left) - var(--main-margin-right));
    height: calc(100vh - var(--main-margin-top) - var(--main-margin-bottom));
    top: 0;
    left: 0;
    margin: var(--main-margin-top) var(--main-margin-right) var(--main-margin-bottom) var(--main-margin-left);
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: var(--main-border-radius);
}

.container-emoji {
    height: 300px;
}


</style>
