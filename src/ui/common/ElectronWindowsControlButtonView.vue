<!--只运行在electron里面-->
<template>
    <div v-if="macos" class="titlebar webkit-draggable">
        <div class="title">
            <p class="single-line">{{ title }}</p>
        </div>
        <div class="titlebar-stoplight">
            <div class="titlebar-close" @click="close">
                <svg x="0px" y="0px" viewBox="0 0 6.4 6.4">
                    <polygon fill="#4d0000"
                             points="6.4,0.8 5.6,0 3.2,2.4 0.8,0 0,0.8 2.4,3.2 0,5.6 0.8,6.4 3.2,4 5.6,6.4 6.4,5.6 4,3.2"></polygon>
                </svg>
            </div>
            <div class="titlebar-minimize" @click="minimize" v-if="sharedMiscState.enableMinimize">
                <svg x="0px" y="0px" viewBox="0 0 8 1.1">
                    <rect fill="#995700" width="8" height="1.1"></rect>
                </svg>
            </div>
            <div class="titlebar-fullscreen" @click="maximize" v-if="maximizable">
                <svg class="fullscreen-svg" x="0px" y="0px" viewBox="0 0 6 5.9">
                    <path fill="#006400" d="M5.4,0h-4L6,4.5V0.6C5.7,0.6,5.3,0.3,5.4,0z"></path>
                    <path fill="#006400" d="M0.6,5.9h4L0,1.4l0,3.9C0.3,5.3,0.6,5.6,0.6,5.9z"></path>
                </svg>
                <svg class="maximize-svg" x="0px" y="0px" viewBox="0 0 7.9 7.9">
                    <polygon fill="#006400"
                             points="7.9,4.5 7.9,3.4 4.5,3.4 4.5,0 3.4,0 3.4,3.4 0,3.4 0,4.5 3.4,4.5 3.4,7.9 4.5,7.9 4.5,4.5"></polygon>
                </svg>
            </div>
        </div>
    </div>
    <div v-else id="window-controls" ref="content">

        <div class="button" id="min-button" @click="minimize" v-if="sharedMiscState.enableMinimize">
            <img class="icon"
                 srcset="@/assets/windows_control_icons/min-k-10.png 1x, @/assets/windows_control_icons/min-k-12.png 1.25x, @/assets/windows_control_icons/min-k-15.png 1.5x, @/assets/windows_control_icons/min-k-15.png 1.75x, @/assets/windows_control_icons/min-k-20.png 2x, @/assets/windows_control_icons/min-k-20.png 2.25x, @/assets/windows_control_icons/min-k-24.png 2.5x, @/assets/windows_control_icons/min-k-30.png 3x, @/assets/windows_control_icons/min-k-30.png 3.5x"
                 draggable="false" alt=""/>
        </div>

        <div class="button" v-bind:class="{disabled: !maximizable}" v-if="maximizable" id="max-button"
             @click="maximize">
            <img class="icon"
                 srcset="@/assets/windows_control_icons/max-k-10.png 1x, @/assets/windows_control_icons/max-k-12.png 1.25x, @/assets/windows_control_icons/max-k-15.png 1.5x, @/assets/windows_control_icons/max-k-15.png 1.75x, @/assets/windows_control_icons/max-k-20.png 2x, @/assets/windows_control_icons/max-k-20.png 2.25x, @/assets/windows_control_icons/max-k-24.png 2.5x, @/assets/windows_control_icons/max-k-30.png 3x, @/assets/windows_control_icons/max-k-30.png 3.5x"
                 draggable="false" alt=""/>
        </div>

        <div class="button" v-bind:class="{disabled: !maximizable}" v-if="maximizable" id="restore-button"
             @click="maximize">
            <img class="icon"
                 srcset="@/assets/windows_control_icons/restore-k-10.png 1x, @/assets/windows_control_icons/restore-k-12.png 1.25x, @/assets/windows_control_icons/restore-k-15.png 1.5x, @/assets/windows_control_icons/restore-k-15.png 1.75x, @/assets/windows_control_icons/restore-k-20.png 2x, @/assets/windows_control_icons/restore-k-20.png 2.25x, @/assets/windows_control_icons/restore-k-24.png 2.5x, @/assets/windows_control_icons/restore-k-30.png 3x, @/assets/windows_control_icons/restore-k-30.png 3.5x"
                 draggable="false" alt=""/>
        </div>

        <div class="button" id="close-button" @click="close">
            <img class="icon"
                 srcset="@/assets/windows_control_icons/close-k-10.png 1x, @/assets/windows_control_icons/close-k-12.png 1.25x, @/assets/windows_control_icons/close-k-15.png 1.5x, @/assets/windows_control_icons/close-k-15.png 1.75x, @/assets/windows_control_icons/close-k-20.png 2x, @/assets/windows_control_icons/close-k-20.png 2.25x, @/assets/windows_control_icons/close-k-24.png 2.5x, @/assets/windows_control_icons/close-k-30.png 3x, @/assets/windows_control_icons/close-k-30.png 3.5x"
                 draggable="false" alt=""/>
        </div>

    </div>
</template>

<script>
import {remote} from "@/platform";
import wfc from "../../wfc/client/wfc";
import store from "../../store";
import {app} from "../../platform";

export default {
    name: "ElectronWindowsControlButtonView",
    props: {
        maximizable: {
            type: Boolean,
            required: false,
            default: true,
        },
        macos: {
            type: Boolean,
            required: false,
            default: false,
        },
        title: {
            type: String,
            required: false,
            default: '',
        }
    },
    data() {
        return {
            sharedMiscState: store.state.misc,
        }
    },
    mounted() {
        if (!this.maximizable) {
            this.$refs.content.style.setProperty('--control-count', '2');
            this.$refs.content.style.setProperty('--close-button-column', '2');
        }
    },
    methods: {
        minimize() {
            const win = remote.getCurrentWindow();
            win.minimize();
        },
        maximize() {
            const win = remote.getCurrentWindow();
            if (win.isMaximized()) {
                win.unmaximize();
            } else {
                win.maximize();
            }
            this.$nextTick(() => {
                this.toggleMaxRestoreButtons();
            });
        },
        close() {
            const win = remote.getCurrentWindow();
            win.close();
            if(!wfc.isLogin()){
                app.exit(0)
            }
        },
        toggleMaxRestoreButtons() {
            const win = remote.getCurrentWindow();
            if (win.isMaximized()) {
                document.body.classList.add('maximized');
            } else {
                document.body.classList.remove('maximized');
            }
        }

    }
}
</script>

<style lang="css" scoped>
/*macos*/
.titlebar {
    padding: 0 3px;
    background-color: #f6f6f6;
    display: flex;
}

.titlebar.webkit-draggable {
    -webkit-app-region: drag;
}

.titlebar-stoplight {
    float: left;
    text-align: left;
}

.titlebar:after,
.titlebar-stoplight:after {
    content: ' ';
    display: table;
    clear: both;
}

.titlebar-stoplight:hover svg,
.titlebar-stoplight:hover svg.fullscreen-svg,
.titlebar-stoplight:hover svg.maximize-svg {
    opacity: 1;
}

.titlebar.alt svg.fullscreen-svg {
    display: none;
}

.titlebar.alt svg.maximize-svg {
    display: block;
}

.titlebar-close,
.titlebar-minimize,
.titlebar-fullscreen {
    float: left;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    margin: 6px 4px;
    line-height: 0;
}

.titlebar.webkit-draggable .titlebar-close,
.titlebar.webkit-draggable .titlebar-minimize,
.titlebar.webkit-draggable .titlebar-fullscreen {
    -webkit-app-region: no-drag;
}

.titlebar-close {
    border: 1px solid #e2463f;
    background-color: #ff5f57;
    margin-left: 6px;
}

.titlebar-close:active {
    border-color: #ad3934;
    background-color: #bf4943;
}

.titlebar-close svg {
    width: 6px;
    height: 6px;
    margin-top: 2px;
    margin-left: 2px;
    opacity: 0;
}

.titlebar-minimize {
    border: 1px solid #e1a116;
    background-color: #ffbd2e;
}

.titlebar-minimize:active {
    border-color: #ad7d15;
    background-color: #bf9123;
}

.titlebar-minimize svg {
    width: 8px;
    height: 8px;
    margin-top: 1px;
    margin-left: 1px;
    opacity: 0;
}

.titlebar-fullscreen,
.titlebar-maximize {
    border: 1px solid #12ac28;
    background-color: #28c940;
}

.titlebar-fullscreen:active {
    border-color: #128622;
    background-color: #1f9a31;
}

.titlebar-fullscreen svg.fullscreen-svg {
    width: 6px;
    height: 6px;
    margin-top: 2px;
    margin-left: 2px;
    opacity: 0;
}

.titlebar-fullscreen svg.maximize-svg {
    width: 8px;
    height: 8px;
    margin-top: 1px;
    margin-left: 1px;
    opacity: 0;
    display: none;
}

.titlebar .title {
    position: absolute;
    left: 62px;
    width: calc(100% - 62px);
    padding: 5px 0;
    display: flex;
    align-content: center;
    justify-content: center;
    -webkit-app-region: drag;
}

.titlebar .title p {
    margin-left: -62px;
}

/*windows or linux*/
#window-controls {
    --control-count: 3;
    --close-button-column: 3;
    display: grid;
    grid-template-columns: repeat(var(--control-count), 46px);
    /*position: absolute;*/
    /*top: 0;*/
    /*right: 0;*/
    height: 30px;
    z-index: 9999;
}

#window-controls {
    -webkit-app-region: no-drag;
}

#window-controls .button {
    grid-row: 1 / span 1;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
}

@media (-kebkit-device-pixel-ratio: 1.5), (device-pixel-ratio: 1.5),
(-kebkit-device-pixel-ratio: 2), (device-pixel-ratio: 2),
(-kebkit-device-pixel-ratio: 3), (device-pixel-ratio: 3) {
    #window-controls .icon {
        width: 10px;
        height: 10px;
    }
}

#window-controls .button {
    user-select: none;
}

#window-controls .button.disabled {
    pointer-events: none;
    background-color: #d9d9d9;
}

#window-controls .button:hover {
    background: rgba(255, 255, 255, 0.1);
}

#window-controls .button:active {
    background: rgba(255, 255, 255, 0.2);
}

#min-button:hover {
    background: #d6d6d6 !important;
}

#max-button:hover {
    background: #d6d6d6 !important;
}

#restore-button:hover {
    background: #d6d6d6 !important;
}

#close-button:hover {
    background: #E81123 !important;
}

#close-button:active {
    background: #F1707A !important;
}

#close-button:active .icon {
    filter: invert(1);
}

#min-button {
    grid-column: 1;
}

#max-button, #restore-button {
    grid-column: 2;
}

#close-button {
    grid-column: var(--close-button-column);
}

#restore-button {
    display: none !important;
}

.maximized #restore-button {
    display: flex !important;
}

.maximized #max-button {
    display: none;
}

</style>
