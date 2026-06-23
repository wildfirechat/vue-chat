<template>
    <section class="setting-container">
        <!-- 左侧菜单栏 -->
        <div class="setting-menu-panel">
            <!-- 设置标题头部 -->
            <div class="setting-menu-header">
                <h2 class="menu-title">{{ $t('setting.setting') }}</h2>
            </div>

            <!-- 设置选项卡列表 -->
            <ul class="setting-menu-list">
                <li class="menu-item" :class="{active: currentTab === 'general'}" @click="currentTab = 'general'">
                    <i class="icon-ion-ios-settings"></i>
                    <span>通用</span>
                </li>
                <li class="menu-item" :class="{active: currentTab === 'notification'}" @click="currentTab = 'notification'">
                    <i class="icon-ion-ios-bell-outline"></i>
                    <span>通知</span>
                </li>
                <li class="menu-item" :class="{active: currentTab === 'appearance'}" @click="currentTab = 'appearance'">
                    <i class="icon-ion-android-color-palette"></i>
                    <span>外观与主题</span>
                </li>
                <li class="menu-item" :class="{active: currentTab === 'security'}" @click="currentTab = 'security'">
                    <i class="icon-ion-ios-locked-outline"></i>
                    <span>账号与安全</span>
                </li>
                <li class="menu-item" :class="{active: currentTab === 'about'}" @click="currentTab = 'about'">
                    <i class="icon-ion-ios-information-outline"></i>
                    <span>关于野火</span>
                </li>
            </ul>
        </div>

        <ResizeBar/>

        <!-- 右侧内容区域 -->
        <div class="setting-content-panel">
            <!-- 选项卡内容：通用 -->
            <div v-if="currentTab === 'general'" class="tab-content">
                <div class="content-header">
                    <h2 class="content-title">通用</h2>
                    <p class="content-subtitle">聊天发送、登录与窗口行为相关的常用设置</p>
                </div>

                <div class="setting-group">
                    <span class="group-label">聊天</span>
                    <div class="setting-card">
                        <div class="card-row switch">
                            <div class="row-info">
                                <span class="row-title">{{ $t('setting.show_send_button') }}</span>
                                <span class="row-desc">在聊天框右下角显示发送按钮，关闭则只能使用回车发送</span>
                            </div>
                            <input type="checkbox" role="switch" :checked="sharedMiscState.showSendButton"
                                   @change="setShowSendButton($event.target.checked)">
                        </div>

                        <div class="card-row switch" v-if="sharedMiscState.isCommercialServer">
                            <div class="row-info">
                                <span class="row-title">{{ $t('setting.sync_draft') }}</span>
                                <span class="row-desc">支持聊天草稿在移动端和电脑端之间进行双向同步</span>
                            </div>
                            <input type="checkbox" role="switch" :checked="!sharedMiscState.isDisableSyncDraft"
                                   @change="enableDraftSync($event.target.checked)">
                        </div>
                    </div>
                </div>

                <div class="setting-group"
                     v-if="sharedMiscState.isElectron">
                    <span class="group-label">启动与窗口</span>
                    <div class="setting-card">
                        <div class="card-row switch" v-if="sharedMiscState.isElectron">
                            <div class="row-info">
                                <span class="row-title">{{ $t('setting.close_window_to_exit') }}</span>
                                <span class="row-desc">点击窗口关闭按钮时退出整个程序，关闭则最小化到系统托盘</span>
                            </div>
                            <input type="checkbox" role="switch" :checked="sharedMiscState.enableCloseWindowToExit"
                                   @change="enableCloseWindowToExit($event.target.checked)">
                        </div>

                        <div class="card-row switch" v-if="sharedMiscState.isElectron">
                            <div class="row-info">
                                <span class="row-title">{{ $t('setting.enable_minimize') }}</span>
                                <span class="row-desc">开启后主窗体支持最小化到任务栏</span>
                            </div>
                            <input type="checkbox" role="switch" :checked="sharedMiscState.enableMinimize"
                                   @change="enableMinimize($event.target.checked)">
                        </div>
                    </div>
                </div>
            </div>

            <!-- 选项卡内容：通知 -->
            <div v-if="currentTab === 'notification'" class="tab-content">
                <div class="content-header">
                    <h2 class="content-title">通知</h2>
                    <p class="content-subtitle">管理新消息的提醒方式与通知中显示的内容</p>
                </div>
                <div class="setting-card">
                    <div class="card-row switch">
                        <div class="row-info">
                            <span class="row-title">{{ $t('setting.enable_notification') }}</span>
                            <span class="row-desc">开启或关闭新消息到达时的系统声音和横幅通知</span>
                        </div>
                        <input type="checkbox"
                               role="switch"
                               :checked="sharedMiscState.enableNotification"
                               @change="enableNotification($event.target.checked)">
                    </div>
                    <div class="card-row switch" :class="{disabled: !sharedMiscState.enableNotification}">
                        <div class="row-info">
                            <span class="row-title">{{ $t('setting.enable_notification_detail') }}</span>
                            <span class="row-desc">开启后通知显示消息的发件人和预览内容，关闭后只显示“收到一条新消息”</span>
                        </div>
                        <input type="checkbox"
                               role="switch"
                               v-bind:disabled="!sharedMiscState.enableNotification"
                               :checked="sharedMiscState.enableNotificationMessageDetail"
                               @change="enableNotificationDetail($event.target.checked)">
                    </div>
                </div>
            </div>

            <!-- 选项卡内容：外观与主题 -->
            <div v-if="currentTab === 'appearance'" class="tab-content">
                <div class="content-header">
                    <h2 class="content-title">外观与主题</h2>
                    <p class="content-subtitle">自定义界面语言、主题风格与字体大小</p>
                </div>
                <div class="setting-card">
                    <div class="card-row select">
                        <div class="row-info">
                            <span class="row-title">{{ $t('setting.lang') }}</span>
                            <span class="row-desc">更改客户端的界面语言，需重新启动应用以生效</span>
                        </div>
                        <dropdown
                            :options="langs"
                            :selected="currentLang"
                            v-on:updateOption="setLang"
                            :placeholder="'Select an Item'"
                            :closeOnOutsideClick="true">
                        </dropdown>
                    </div>

                    <div class="card-row select">
                        <div class="row-info">
                            <span class="row-title">{{ $t('setting.theme') || '外观' }}</span>
                            <span class="row-desc">切换深色、浅色主题风格，或设置跟随系统外观</span>
                        </div>
                        <dropdown
                            :options="themes"
                            :selected="currentTheme"
                            v-on:updateOption="setTheme"
                            :placeholder="'Select Theme'"
                            :closeOnOutsideClick="true">
                        </dropdown>
                    </div>

                    <div class="card-row stacked">
                        <div class="row-info">
                            <span class="row-title">{{ $t('setting.font_size') }}</span>
                            <span class="row-desc">{{ $t('setting.font_size_preview') }}</span>
                        </div>
                        <div class="font-size-slider">
                            <div class="slider-track-wrapper">
                                <div class="slider-rail" :style="sliderFillStyle"></div>
                                <div class="slider-ticks">
                                    <span v-for="(step, index) in fontScaleSteps"
                                          :key="index"
                                          class="slider-tick"></span>
                                </div>
                                <input type="range"
                                       min="0"
                                       :max="fontScaleSteps.length - 1"
                                       step="1"
                                       :value="fontScaleIndex"
                                       @input="onFontScaleInput($event.target.value)"/>
                            </div>
                            <div class="font-size-labels">
                                <span class="font-size-label start">{{ $t('setting.font_size_small') }}</span>
                                <span class="font-size-label standard"
                                      :style="{ left: standardLabelLeft }">{{ $t('setting.font_size_standard') }}</span>
                                <span class="font-size-label end">{{ $t('setting.font_size_large') }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 选项卡内容：账号与安全 -->
            <div v-if="currentTab === 'security'" class="tab-content">
                <div class="content-header">
                    <h2 class="content-title">账号与安全</h2>
                    <p class="content-subtitle">管理登录密码、聊天记录备份与账号登录状态</p>
                </div>

                <!-- 当前登录账号卡片 -->
                <div class="setting-card">
                    <div class="card-row account-row">
                        <img class="account-avatar" :src="selfPortrait || defaultPortrait" @error="imgUrlAlt"/>
                        <div class="row-info account-info">
                            <span class="row-title account-name">{{ selfDisplayName }}</span>
                            <span class="row-desc account-id">{{ selfWfcId }}</span>
                        </div>
                        <button class="account-logout-btn" @click="logout">退出登录</button>
                    </div>

                    <div class="card-row switch"
                         v-if="sharedMiscState.isElectron || sharedMiscState.config.CLIENT_ID_STRATEGY === 1 || sharedMiscState.config.CLIENT_ID_STRATEGY === 2">
                        <div class="row-info">
                            <span class="row-title">{{ $t('setting.auto_login') }}</span>
                            <span class="row-desc">在打开应用时自动登录上次使用的账号</span>
                        </div>
                        <input type="checkbox" role="switch" :checked="sharedMiscState.enableAutoLogin"
                               @change="enableAutoLogin($event.target.checked)">
                    </div>

                    <!-- 使用 .stop.prevent 阻止事件冒泡和默认行为，避免 vue-context 因检测到 document 上的 click 事件而立刻关闭 -->
                    <div class="card-row clickable" @click.stop.prevent="showChangePasswordContextMenu($event)">
                        <div class="row-info">
                            <span class="row-title">修改密码</span>
                            <span class="row-desc">支持使用旧密码验证或手机短信验证码重置登录密码</span>
                        </div>
                        <i class="row-chevron icon-ion-ios-arrow-right"/>
                    </div>

                    <div v-if="sharedMiscState.isElectron" class="card-row clickable" @click="showBackupRestoreDialog">
                        <div class="row-info">
                            <span class="row-title">备份与恢复</span>
                            <span class="row-desc">备份聊天记录到电脑，或从电脑恢复备份到手机客户端</span>
                        </div>
                        <i class="row-chevron icon-ion-ios-arrow-right"/>
                    </div>
                </div>
            </div>

            <!-- 选项卡内容：关于 -->
            <div v-if="currentTab === 'about'" class="tab-content about-tab">
                <div class="about-logo-section">
                    <div class="logo-wrapper">
                        <img :src="logoUrl" alt="Logo" class="about-logo" @error="handleLogoError" />
                    </div>
                    <h3 class="about-app-name">野火 IM</h3>
                    <p class="about-description">
                        <strong>野火IM</strong> 是安全可靠、开发对接便捷、部署维护简单，方便二次开发和对接现有系统的私有化即时通讯平台。
                    </p>
                </div>

                <div class="setting-card">
                    <div class="card-row">
                        <div class="row-info">
                            <span class="row-title">版本信息</span>
                            <span class="row-desc" style="user-select: text">{{ versionInfo() }}</span>
                        </div>
                        <button v-if="sharedMiscState.isElectron" class="check-update-btn" @click="checkForUpdates">检查更新</button>
                    </div>
                    <div class="card-row link-row">
                        <div class="row-info">
                            <span class="row-title">联系我们</span>
                            <span class="row-desc" style="user-select: text">微信： wildfirechat 或 wfchat</span>
                        </div>
                    </div>
                </div>

                <!-- 简约文本按钮链接组，无边框与图标 -->
                <div class="about-links">
                    <a href="https://wildfirechat.cn" target="_blank">官方网站</a>
                    <span class="link-separator">|</span>
                    <a href="https://github.com/wildfirechat/vue-pc-chat" target="_blank">GitHub</a>
                    <span class="link-separator">|</span>
                    <a href="https://github.com/wildfirechat/vue-pc-chat/issues" target="_blank">问题反馈</a>
  					<template v-if="!sharedMiscState.isElectron && !sharedMiscState.isOhos">
                        <span class="link-separator">|</span>
                        <a href="javascript:" @click.prevent.stop="webrtcTest">音视频能力测试</a>
                    </template>
					<template v-if="!sharedMiscState.isElectron && !sharedMiscState.isOhos">
                        <span class="link-separator">|</span>
                        <a href="javascript:" @click.prevent.stop="openPcChat">打开野火PC端</a>
                    </template>
                    <template v-if="sharedMiscState.isElectron && !sharedMiscState.isOhos">
                        <span class="link-separator">|</span>
                        <a href="javascript:" @click.prevent.stop="openLogDir">日志目录</a>
                    </template>
                </div>
            </div>
        </div>

        <!-- 浮动的二级菜单，放置在最外层以防止任何 overflow: hidden 裁剪，且始终在 DOM 中以保证 $refs 可用 -->
        <vue-context ref="changePasswordContextMenu" :close-on-scroll="false" v-on:close="onChangePasswordContextMenuClose">
            <li>
                <a @click.prevent="showChangePasswordDialog()">密码验证</a>
            </li>
            <li>
                <a @click.prevent="showResetPasswordDialog()">短信验证码验证</a>
            </li>
        </vue-context>
    </section>
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
import BackupRestoreView from '../../../backup/BackupRestoreView.vue';
import { shell } from '../../../platform';
import IpcEventType from '../../../ipcEventType';
import avenginekit from '../../../wfc/av/internal/engine.min';
import Config from '../../../config';
import ResizeBar from '../../common/ResizeBar.vue';

export default {
    name: 'SettingPage',
    data() {
        return {
            sharedMiscState: store.state.misc,
            sharedContactState: store.state.contact,
            openPcChatTimeoutHandler: 0,
            appVersion: '',
            langs: [{ lang: 'zh-CN', name: '简体中文' }, { lang: 'zh-TW', name: '繁體中文' }, { lang: 'en', name: 'English' }],
            themes: [{ id: 'system', name: '跟随系统' }, { id: 'light', name: '浅色' }, { id: 'dark', name: '暗黑' }],
            // 字体缩放档位，1 为标准（参考微信PC端）
            fontScaleSteps: [0.85, 1, 1.15, 1.3, 1.45],

            // 选中的导航标签
            currentTab: 'general',
            defaultPortrait: Config.DEFAULT_PORTRAIT_URL,
            logoUrl: require('@/assets/images/icon.png'),
        }
    },
    methods: {
        openLogDir() {
            let appPath = wfc.getAppPath();
            shell.openPath(appPath);
        },
        checkForUpdates() {
            if (isElectron()) {
                ipcRenderer.send(IpcEventType.CHECK_FOR_UPDATES);
            }
        },
        showChangePasswordContextMenu(event) {
            this.$refs.changePasswordContextMenu.open(event);
        },

        onChangePasswordContextMenuClose() {
        },

        showChangePasswordDialog() {
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
                    'closed': () => {}
                })
        },

        showResetPasswordDialog() {
            this.$modal.show(
                ResetPasswordView,
                {}, null, {
                    name: 'rest-password-modal',
                    width: 320,
                    height: 400,
                    clickToClose: true,
                }, {
                    'closed': () => {}
                })
        },

        showBackupRestoreDialog() {
            this.$modal.show(
                BackupRestoreView,
                {}, null, {
                    name: 'backup-restore-modal',
                    width: 560,
                    height: 380,
                    clickToClose: true,
                }, {
                    'closed': () => {
                        console.log('Backup restore dialog closed');
                    }
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

        setShowSendButton(enable) {
            store.setShowSendButton(enable);
        },

        setLang(lang) {
            setItem('lang', lang.lang)
        },

        setTheme(theme) {
            store.setTheme(theme.id);
        },

        onFontScaleInput(index) {
            let scale = this.fontScaleSteps[parseInt(index)] || 1;
            store.setFontScale(scale);
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

        versionInfo() {
            let version = this.appVersion + ' ';
            try {
                version += wfc.getProtoRevision();
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
        },

        imgUrlAlt(e) {
            e.target.src = this.defaultPortrait;
        },

        handleLogoError(e) {
            e.target.style.display = 'none';
        }
    },

    async mounted() {
        window.addEventListener('blur', this.blurListener)
        if (isElectron()) {
            this.appVersion = await ipcRenderer.invoke('get-app-version');
        }
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
        },
        fontScaleIndex() {
            let scale = this.sharedMiscState.fontScale || 1;
            let index = this.fontScaleSteps.indexOf(scale);
            if (index >= 0) {
                return index;
            }
            let closest = 0;
            let minDiff = Infinity;
            this.fontScaleSteps.forEach((step, i) => {
                let diff = Math.abs(step - scale);
                if (diff < minDiff) {
                    minDiff = diff;
                    closest = i;
                }
            });
            return closest;
        },
        fontStandardIndex() {
            let index = this.fontScaleSteps.indexOf(1);
            return index >= 0 ? index : 0;
        },
        standardLabelLeft() {
            let max = this.fontScaleSteps.length - 1;
            let pct = max > 0 ? (this.fontStandardIndex / max) * 100 : 0;
            return pct + '%';
        },
        sliderFillStyle() {
            let max = this.fontScaleSteps.length - 1;
            let pct = max > 0 ? (this.fontScaleIndex / max) * 100 : 0;
            return {
                background: `linear-gradient(to right,` +
                    ` var(--accent-color) 0%, var(--accent-color) ${pct}%,` +
                    ` var(--border-primary) ${pct}%, var(--border-primary) 100%)`,
            };
        },
        selfPortrait() {
            let self = this.sharedContactState.selfUserInfo;
            return (self && self.portrait) || '';
        },
        selfDisplayName() {
            let self = this.sharedContactState.selfUserInfo;
            return (self && (self._displayName || self.displayName)) || '';
        },
        selfWfcId() {
            let self = this.sharedContactState.selfUserInfo;
            return (self && self.name) || '';
        }
    },
    components: {
        'dropdown': dropdown,
        ResizeBar,
    },
}
</script>

<style lang="css" scoped>
.setting-container {
    height: 100%;
    width: 100%;
    flex: 1;
    display: flex;
    flex-direction: row;
    border-top-right-radius: var(--main-border-radius);
    border-bottom-right-radius: var(--main-border-radius);
    background: var(--background-primary);
    overflow: hidden;
}

/* --- 左侧选项栏 --- */
.setting-menu-panel {
    width: var(--list-panel-width);
    height: 100%;
    background: var(--background-secondary);
    border-right: 1px solid var(--border-primary);
    display: flex;
    flex-direction: column;
    flex: 0 0 var(--list-panel-width);
}

.setting-menu-header {
    padding: 24px 20px 12px;
    border-bottom: 1px solid var(--border-separator);
    box-sizing: border-box;
}

.menu-title {
    font-size: var(--font-size-2xl);
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
}

.setting-menu-list {
    flex: 1;
    padding: 16px 8px;
    overflow-y: auto;
    margin: 0;
    list-style: none;
}

.menu-item {
    position: relative;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 16px;
    margin-bottom: 4px;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: background-color var(--duration-fast) ease, color var(--duration-fast) ease;
    font-size: var(--font-size-base);
    color: var(--text-primary);
    user-select: none;
}

.menu-item i {
    width: 20px;
    text-align: center;
    font-size: var(--font-size-lg);
    color: var(--text-secondary);
    transition: color var(--duration-fast) ease;
}

.menu-item:hover {
    background-color: var(--background-item-hover);
}

.menu-item.active {
    background-color: var(--background-selected-alt);
    color: var(--accent-color);
    font-weight: 600;
}

.menu-item.active i {
    color: var(--accent-color);
}

/* --- 右侧设置内容区 --- */
.setting-content-panel {
    flex: 1;
    height: 100%;
    background: var(--background-primary);
    overflow-y: auto;
    overflow-x: hidden;
}

.tab-content {
    width: 100%;
    max-width: 760px;
    padding: 32px clamp(20px, 4vw, 48px);
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 20px;
}

/* --- 内容区标题 --- */
.content-header {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 4px;
}

.content-title {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
}

.content-subtitle {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    line-height: 1.5;
    margin: 0;
}

/* --- 设置项分组 --- */
.setting-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.group-label {
    padding-left: 4px;
    font-size: var(--font-size-xs);
    font-weight: 600;
    letter-spacing: 0.4px;
    color: var(--text-secondary);
}

/* --- 设置项卡片样式 --- */
.setting-card {
    background-color: var(--background-secondary);
    border: 1px solid var(--border-secondary);
    border-radius: var(--radius-lg);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.card-row {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    box-sizing: border-box;
}

/* 行间分割线：左右各留出 padding 间距，不填满整行；hover 背景仍可铺满整行 */
.card-row:not(:last-child)::after {
    content: '';
    position: absolute;
    left: 20px;
    right: 20px;
    bottom: 0;
    height: 1px;
    background: var(--border-separator);
}

.row-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
    margin-right: 24px;
}

.row-title {
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--text-primary);
}

.row-desc {
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
    line-height: 1.4;
}

.card-row.disabled {
    opacity: 0.45;
}

/* 可点击行样式 */
.card-row.clickable {
    cursor: pointer;
    transition: background-color var(--duration-fast) ease;
}

.card-row.clickable:hover {
    background-color: var(--background-item-hover);
}

.row-chevron {
    flex-shrink: 0;
    font-size: var(--font-size-lg);
    color: var(--text-tertiary);
}

.danger-text {
    color: var(--text-danger) !important;
}

/* --- 当前登录账号卡片 --- */
.card-row.account-row {
    gap: 12px;
}

.account-avatar {
    width: 44px;
    height: 44px;
    border-radius: var(--radius-md);
    object-fit: cover;
    flex-shrink: 0;
    background: var(--background-input);
}

.account-info {
    margin-right: 12px;
}

.account-name {
    font-size: var(--font-size-base);
    font-weight: 600;
}

.account-id {
    user-select: text;
}

.account-logout-btn,
.check-update-btn {
    flex-shrink: 0;
    padding: 7px 18px;
    border-radius: var(--radius-md);
    border: 1px solid var(--border-primary);
    background: var(--background-input);
    color: var(--text-primary);
    font-size: var(--font-size-sm);
    cursor: pointer;
    transition: background-color var(--duration-fast) ease;
}

.account-logout-btn:hover,
.check-update-btn:hover {
    background: var(--background-item-hover);
}

/* --- 菜单重写 vue-dropdowns 适配 --- */
.card-row :deep(.btn-group) {
    min-width: auto;
    height: auto;
    margin: 0;
    flex-shrink: 0;
}

.card-row :deep(.dropdown-toggle) {
    min-width: 130px;
    margin: 0;
    padding: 6px 28px 6px 12px;
    border-radius: var(--radius-md);
    background-image: none;
    background-color: var(--background-input);
    border: 1px solid var(--border-primary);
    color: var(--text-primary) !important;
    font-size: var(--font-size-xs);
}

.card-row :deep(.dropdown-toggle:hover) {
    background: var(--background-item-hover);
}

.card-row :deep(.caret) {
    top: 50%;
    transform: translateY(-50%);
    margin-left: 0;
    right: 10px;
    color: var(--text-tertiary);
}

.card-row :deep(.dropdown-menu) {
    left: auto;
    right: 0;
    border-radius: var(--radius-md);
}

/* --- 浮动二级菜单 vue-context 覆盖 --- */
:deep(.v-context) {
    z-index: 9999 !important;
}

/* --- 字体大小（堆叠行） --- */
.card-row.stacked {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
}

.font-size-slider {
    padding: 8px 0 4px;
}

.slider-track-wrapper {
    position: relative;
    height: 24px;
}

.slider-rail {
    position: absolute;
    left: 0;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    height: 6px;
    border-radius: 3px;
}

.slider-ticks {
    position: absolute;
    left: 0;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    justify-content: space-between;
    pointer-events: none;
    z-index: 1;
}

.slider-ticks .slider-tick {
    width: 2px;
    height: 6px;
    border-radius: 1px;
    /* 用卡片背景色做“镂空”刻度，在已填充(主色)和未填充(灰色)轨道上都清晰可见 */
    background: var(--background-secondary);
}

.slider-track-wrapper input[type="range"] {
    position: relative;
    z-index: 2;
    width: 100%;
    height: 24px;
    margin: 0;
    -webkit-appearance: none;
    appearance: none;
    background: transparent;
    outline: none;
    cursor: pointer;
    padding: 0 !important;
    border: none !important;
}

.slider-track-wrapper input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #ffffff;
    border: 0.5px solid rgba(0, 0, 0, 0.04);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
    cursor: pointer;
}

.font-size-labels {
    position: relative;
    height: 18px;
    margin-top: 6px;
}

.font-size-labels .font-size-label {
    position: absolute;
    top: 0;
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
    white-space: nowrap;
}

.font-size-labels .font-size-label.start {
    left: 0;
}

.font-size-labels .font-size-label.standard {
    transform: translateX(-50%);
}

.font-size-labels .font-size-label.end {
    right: 0;
}

/* --- 关于野火选项卡特殊样式 --- */
.about-tab {
    align-items: center;
    text-align: center;
}

.about-logo-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 8px;
}

.logo-wrapper {
    width: 72px;
    height: 72px;
    border-radius: var(--radius-lg);
    background: var(--background-secondary);
    border: 1px solid var(--border-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    margin-bottom: 12px;
}

.about-logo {
    width: 48px;
    height: 48px;
    object-fit: contain;
}

.about-app-name {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 2px;
}

.about-app-version {
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
}

.about-tab .setting-card {
    width: 100%;
    text-align: left;
}

.about-description {
    margin-top: 12px;
    max-width: 420px;
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    line-height: 1.6;
    text-align: center;
}

/* 简约文本按钮样式 */
.about-links {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 24px;
    width: 100%;
}

.about-links a {
    font-size: var(--font-size-sm);
    color: var(--text-link);
    text-decoration: none;
    transition: color var(--duration-fast) ease;
}

.about-links a:hover {
    color: var(--text-link-hover);
    text-decoration: underline;
}

.link-separator {
    color: var(--border-strong);
    font-size: var(--font-size-xs);
    user-select: none;
}

</style>
