<template>
    <div class="setting-container">
        <div class="content">
            <h2>{{ $t('setting.setting') }}</h2>
            <label>
                {{ $t('setting.enable_notification') }}
                <input type="checkbox"
                       :checked="sharedMiscState.enableNotification"
                       @change="enableNotification($event.target.checked)">
            </label>
            <label>
                {{ $t('setting.enable_notification_detail') }}
                <input v-bind:disabled="!sharedMiscState.enableNotification"
                       type="checkbox"
                       :checked="sharedMiscState.enableNotificationMessageDetail"
                       @change="enableNotificationDetail($event.target.checked)">
            </label>
            <label v-if="sharedMiscState.isElectron">
                {{ $t('setting.close_window_to_exit') }}
                <input type="checkbox" :checked="sharedMiscState.enableCloseWindowToExit"
                       @change="enableCloseWindowToExit($event.target.checked)">
            </label>
            <label v-if="sharedMiscState.isElectron">
                {{ $t('setting.enable_minimize') }}
                <input type="checkbox" :checked="sharedMiscState.enableMinimize"
                       @change="enableMinimize($event.target.checked)">
            </label>
            <label
                v-if="sharedMiscState.isElectron || (sharedMiscState.config.CLIENT_ID_STRATEGY === 1 || sharedMiscState.config.CLIENT_ID_STRATEGY === 2)">
                {{ $t('setting.auto_login') }}
                <input type="checkbox" :checked="sharedMiscState.enableAutoLogin"
                       @change="enableAutoLogin($event.target.checked)">
            </label>
            <label v-if="sharedMiscState.wfc.isCommercialServer()">
                {{ $t('setting.sync_draft') }}
                <input type="checkbox" :checked="!sharedMiscState.wfc.isDisableSyncDraft()"
                       @change="sharedMiscState.wfc.setDisableSyncDraft(!$event.target.checked)">
            </label>
            <div>
                {{ $t('setting.lang') }}
                <dropdown class="my-dropdown-toggle"
                          :options="langs"
                          :selected="currentLang"
                          v-on:updateOption="setLang"
                          :placeholder="'Select an Item'"
                          :closeOnOutsideClick="true">
                </dropdown>
            </div>
        </div>
        <footer>
            <a class="button" target="_blank" @click="logout">
                {{ $t('setting.exit_switch_user') }}
                <!--        <i class="icon-ion-ios-email-outline"/>-->
            </a>
            <a
                class="button"
                href="mailto:imndxx@gmail.com?Subject=WildfireChat%20Feedback"
                target="_blank">
                {{ $t('setting.feedback') }}
                <i class="icon-ion-ios-email-outline"/>
            </a>

            <a
                class="button"
                href="https://github.com/wildfirechat/vue-pc-chat"
                target="_blank">
                Star on Github
                <i class="icon-ion-social-github"/>
            </a>

            <a
                class="button"
                href="https://wildfirechat.cn"
                target="_blank">
                关于野火
                <i class="icon-ion-home"/>
            </a>
            <a
                v-if="!sharedMiscState.isElectron"
                class="button"
                href="javascript:"
                @click="openPcChat"
            >
                打开野火PC端
                <i class="icon-ion-android-desktop"/>
            </a>
        </footer>
    </div>
</template>

<script>
import wfc from "@/wfc/client/wfc";
import store from "@/store";
import dropdown from 'vue-dropdowns';
import {clear} from "@/ui/util/storageHelper";
import {ipcRenderer, isElectron} from "@/platform";
import {getItem, setItem} from "../util/storageHelper";

export default {
    name: "SettingPage",
    data() {
        return {
            sharedMiscState: store.state.misc,
            openPcChatTimeoutHandler: 0,
            langs: [{lang: 'zh-CN', name: '简体中文'}, {lang: 'zh-TW', name: '繁體中文'}, {lang: 'en', name: 'English'}],
        }
    },
    methods: {
        logout() {
            clear();
            wfc.disconnect();
            if (isElectron()) {
                ipcRenderer.send('logouted');
            }
        },

        enableNotification(enable) {
            store.setEnableNotification(enable)
        },
        enableMinimize(enable) {
            store.setEnableMinimize(enable)
        },
        enableNotificationDetail(enable) {
            store.setEnableNotificationDetail(enable)
        },
        enableCloseWindowToExit(enable) {
            store.setEnableCloseWindowToExit(enable)
        },

        enableAutoLogin(enable) {
            store.setEnableAutoLogin(enable);
        },

        setLang(lang) {
            setItem('lang', lang.lang)
            // this.$router.go();
        },

        openPcChat() {
            // pc 端，deeplink 的 scheme 是 wfc://
            let url = 'wfc://home';
            // 未安装 pc  版时，跳转到 pc 版的下载链接
            let fallback = 'https://github.com/wildfirechat/vue-pc-chat';
            window.location = url;
            this.openPcChatTimeoutHandler = setTimeout(() => {
                window.open(fallback, '_blank');
            }, 1000)
        },

        blurListener() {
            if (this.openPcChatTimeoutHandler) {
                clearTimeout(this.openPcChatTimeoutHandler);
                this.openPcChatTimeoutHandler = 0;
            }
        }

    },

    mounted() {
        window.addEventListener('blur', this.blurListener)
    },
    beforeDestroy() {
        window.removeEventListener('blur', this.blurListener)
    },
    computed: {
        currentLang() {
            let lang = getItem('lang')
            lang = lang ? lang : 'zh-CN';
            let index = this.langs.findIndex(l => l.lang === lang);
            index = index >= 0 ? index : 0;
            return this.langs[index];
        }
    },
    components: {
        'dropdown': dropdown,
    },
}
</script>

<style lang="css" scoped>
.setting-container {
    height: 100%;
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}

.setting-container .content {
    flex: 1;
    margin-left: 20px;
    margin-top: 10px;
}

.setting-container .content h2 {
    font-weight: normal;
    font-style: normal;
    padding-bottom: 10px;
}

.setting-container .content label {
    padding: 10px 0;
    display: block;
}

.setting-container .content label input {
    margin: 0 10px;
    display: inline-block;
}

.setting-container footer {
    width: 100%;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    border-top: 1px solid #d9d9d9;
}

.setting-container .button {
    /* position: relative; */
    margin-right: 17px;
    color: rgba(0, 0, 0, .8);
    font-size: 14px;
    padding: 9px 8px;
    border: 0;
    border-radius: 2px;
    background: 0;
    outline: 0;
    text-transform: uppercase;
    text-align: left;
    cursor: pointer;
    text-decoration: none;
    transform: translateY(0px);
    transition: .2s;
}

.setting-container .button:hover {
    background: #e0e0e0e5;
}

</style>
