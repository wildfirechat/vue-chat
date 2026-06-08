<template>
    <div class="setting-container">
        <div class="content">
            <h2>{{ $t('setting.setting') }}</h2>
            <label>
                {{ $t('setting.enable_notification') }}
                <input type="checkbox"
                       :checked="sharedMiscState.enableNotification"
                       role="switch"
                       @change="enableNotification($event.target.checked)">
            </label>
            <label>
                {{ $t('setting.enable_notification_detail') }}
                <input v-bind:disabled="!sharedMiscState.enableNotification"
                       type="checkbox"
                       role="switch"
                       :checked="sharedMiscState.enableNotificationMessageDetail"
                       @change="enableNotificationDetail($event.target.checked)">
            </label>
            <label v-if="sharedMiscState.isElectron">
                {{ $t('setting.close_window_to_exit') }}
                <input type="checkbox" role="switch" :checked="sharedMiscState.enableCloseWindowToExit"
                       @change="enableCloseWindowToExit($event.target.checked)">
            </label>
            <label v-if="sharedMiscState.isElectron">
                {{ $t('setting.enable_minimize') }}
                <input type="checkbox" role="switch" :checked="sharedMiscState.enableMinimize"
                       @change="enableMinimize($event.target.checked)">
            </label>
            <label
                v-if="sharedMiscState.isElectron || (sharedMiscState.config.CLIENT_ID_STRATEGY === 1 || sharedMiscState.config.CLIENT_ID_STRATEGY === 2)">
                {{ $t('setting.auto_login') }}
                <input type="checkbox" role="switch" :checked="sharedMiscState.enableAutoLogin"
                       @change="enableAutoLogin($event.target.checked)">
            </label>
            <label v-if="sharedMiscState.isCommercialServer">
                {{ $t('setting.sync_draft') }}
                <input type="checkbox" role="switch" :checked="!sharedMiscState.isDisableSyncDraft"
                       @change="enableDraftSync($event.target.checked)">
            </label>
            <div class="dropdown-toggle-container">
                {{ $t('setting.lang') }}
                <dropdown
                          :options="langs"
                          :selected="currentLang"
                          v-on:updateOption="setLang"
                          :placeholder="'Select an Item'"
                          :closeOnOutsideClick="true">
                </dropdown>
            </div>
            <div class="dropdown-toggle-container">
                {{ $t('setting.theme') || '外观' }}
                <dropdown
                          :options="themes"
                          :selected="currentTheme"
                          v-on:updateOption="setTheme"
                          :placeholder="'Select Theme'"
                          :closeOnOutsideClick="true">
                </dropdown>
            </div>
        </div>
        <div class="ad-container">
            <p>
                <a target="_blank" href="https://wildfirechat.cn/">野火IM</a>
                ，安全可靠、运维部署简单、方便二开和对接现有系统。
            </p>
            <p>私有化部署，请微信联系：wildfirechat 或 wfchat </p>
        </div>
        <footer>
            <p class="proto-version-info single-line">{{ protoRevision() }}</p>
            <a
                class="button"
                href="https://github.com/wildfirechat/vue-chat/issues"
                target="_blank">
                问题反馈
            </a>
            <a v-if="!sharedMiscState.isElectron" class="button" target="_blank" @click="webrtcTest">
                音视频能力测试
                <!--        <i class="icon-ion-ios-email-outline"/>-->
            </a>
            <a class="button" target="_blank" @click.prevent.stop="showChangePasswordContextMenu">
                修改密码
                <!--        <i class="icon-ion-ios-email-outline"/>-->
            </a>
            <vue-context ref="changePasswordContextMenu" :close-on-scroll="false" v-on:close="onChangePasswordContextMenuClose">
                <li>
                    <a @click.prevent="showChangePasswordDialog()">密码验证</a>
                </li>
                <li>
                    <a @click.prevent="showResetPasswordDialog()">短信验证码验证</a>
                </li>
            </vue-context>
            <a class="button" target="_blank" @click="logout">
                {{ $t('setting.exit_switch_user') }}
                <!--        <i class="icon-ion-ios-email-outline"/>-->
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
import wfc from '../../../wfc/client/wfc';
import store from '../../../store';
import dropdown from 'vue-dropdowns';
import { clear } from '../../util/storageHelper';
import { ipcRenderer, isElectron } from '../../../platform';
import { getItem, setItem } from '../../util/storageHelper';
import ChangePasswordView from './ChangePasswordView';
import ResetPasswordView from './ResetPasswordView';
import IpcEventType from '../../../ipcEventType';
import avenginekit from '../../../wfc/av/internal/engine.min';

export default {
    name: 'SettingPage',
    data() {
        return {
            sharedMiscState: store.state.misc,
            openPcChatTimeoutHandler: 0,
            langs: [{lang: 'zh-CN', name: '简体中文'}, {lang: 'zh-TW', name: '繁體中文'}, {lang: 'en', name: 'English'}],
            themes: [{id: 'system', name: '跟随系统'}, {id: 'light', name: '浅色'}, {id: 'dark', name: '暗黑'}],
        }
    },
    methods: {

        showChangePasswordContextMenu(event) {
            this.$refs.changePasswordContextMenu.open(event);
        },

        onChangePasswordContextMenuClose() {

        },

        showChangePasswordDialog() {
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
                ChangePasswordView,
                {},
                null,
                {
                    name: 'change-password-modal',
                    width: 320,
                    height: 400,
                    clickToClose: true,
                },
                {
                    'before-open': beforeOpen,
                    'before-close': beforeClose,
                    'closed': closed,
                })
        },

        showResetPasswordDialog() {
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
                ResetPasswordView,
                {}, null, {
                    name: 'rest-password-modal',
                    width: 320,
                    height: 400,
                    clickToClose: true,
                }, {
                    'before-open': beforeOpen,
                    'before-close': beforeClose,
                    'closed': closed,
                })
        },

        logout() {
            clear();
            wfc.disconnect();
            if (isElectron()) {
                ipcRenderer.send(IpcEventType.LOGOUT);
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
        enableDraftSync(enable) {
            wfc.setDisableSyncDraft(!enable)
        },

        setLang(lang) {
            setItem('lang', lang.lang)
            // this.$router.go();
        },

        setTheme(theme) {
            store.setTheme(theme.id);
        },
        openPcChat() {
            // pc 端，deeplink 的 scheme 是 wfc://
            // 打开和 小火的会话
            let url = 'wfc://conversation?target=FireRobot&line=0&type=0';
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
        },

        protoRevision() {
            let version = '';
            try {
                version = wfc.getProtoRevision();
            } catch (e) {
                version = 'unknown proto version'
                console.log(e)
            }
            let supportConference = avenginekit.startConference !== undefined
            return version + (supportConference ? ' av-conference' : ' av-multi');
        },
        webrtcTest() {
            if (!location.href.startsWith('https://') && !location.href.startsWith('http://localhost')) {
                this.$notify({
                    text: '只有通过https://，或者http://localhost 访问站点时，才支持音视频通话功能',
                    type: 'warn'
                });
            } else {
                this.$notify({
                    title: '请稍后',
                    text: '将进入新页面测试音视频能力',
                    type: 'info'
                });
                setTimeout(() => {
                    window.open('https://docs.wildfirechat.cn/webrtc/abilitytest/')
                }, 2000)
            }
        }

    },

    mounted() {
        window.addEventListener('blur', this.blurListener)
    },
    beforeUnmount() {
        window.removeEventListener('blur', this.blurListener)
    },
    computed: {
        currentLang() {
            let lang = getItem('lang')
            lang = lang ? lang : 'zh-CN';
            let index = this.langs.findIndex(l => l.lang === lang);
            index = index >= 0 ? index : 0;
            return this.langs[index];
        },
        currentTheme() {
            let themeId = this.sharedMiscState.theme || 'light';
            return this.themes.find(t => t.id === themeId) || this.themes[0];
        }
    },
    components: {
        'dropdown':
        dropdown,
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
    margin: 8px 20px 0;
}

.setting-container .content h2 {
    font-weight: normal;
    font-style: normal;
    padding-bottom: 8px;
}

.setting-container .content label {
    padding: 8px 0;
    display: flex;
    justify-content: space-between;
    width: 100%;
    font-size: var(--font-size-base);
}

.setting-container .content label input {
    margin: 0;
    flex-shrink: 0;
}

.setting-container .dropdown-toggle-container {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    font-size: var(--font-size-base);
}

.setting-container .ad-container {
    padding: 10px 20px;
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    background: var(--background-secondary);
    border-top: 1px solid var(--border-separator);
    /*box-shadow: 0 2px 4px 0 var(--background-mask), 0 6px 20px 0 var(--background-mask);*/
}

.ad-container p {
    padding: 2px 0;
    line-height: 1.6;
}

.setting-container footer {
    width: 100%;
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    border-top: 1px solid var(--border-primary);
}

.proto-version-info {
    margin-right: auto;
    padding-left: 12px;
    font-size: var(--font-size-xs);
    color: var(--text-hint);
    max-width: 200px;
}

.setting-container .button {
    /* position: relative; */
    margin-right: 4px;
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
    padding: 6px 10px;
    border: 0;
    border-radius: var(--radius-sm);
    background: transparent;
    outline: 0;
    cursor: pointer;
    text-decoration: none;
    transition: background-color var(--duration-fast), color var(--duration-fast);
    white-space: nowrap;
}

.setting-container .button:hover {
    background: var(--background-item-hover);
    color: var(--text-primary);
}

</style>
