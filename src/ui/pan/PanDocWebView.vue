<template>
    <div class="pan-doc-page">
        <header class="pan-header">
            <div class="pan-header-title">
                <button class="pan-back" @click="goBack">‹</button>
                <h1>{{ pageTitle }}</h1>
            </div>
            <div class="pan-header-actions">
                <button class="pan-text-btn" v-if="mode === 'iframe' && docUrl && !$route.query.href" @click="switchToPopup">{{ $t('pan.open_in_popup') }}</button>
                <button class="pan-text-btn" v-if="mode === 'popup' && docUrl" @click="openPopup">{{ $t('pan.open_doc') }}</button>
                <button class="pan-text-btn" v-if="docUrl" @click="reload">{{ $t('pan.refresh') }}</button>
            </div>
        </header>

        <div class="pan-doc-body">
            <div v-if="!enabled" class="pan-status">{{ $t('pan.not_configured') }}</div>
            <div v-else-if="error" class="pan-status">{{ error }}</div>
            <div v-else-if="!docUrl" class="pan-status">{{ $t('pan.loading') }}</div>
            <!-- 跨站部署时用弹窗打开：文档页是一方文档，PAN_WS Cookie 才不会被浏览器拦掉 -->
            <div v-else-if="mode === 'popup'" class="pan-doc-popup-tip">
                <p>{{ $t('pan.popup_opened') }}</p>
                <p class="pan-status-hint">{{ $t('pan.popup_hint') }}</p>
                <button class="pan-btn" @click="openPopup">{{ $t('pan.open_doc') }}</button>
            </div>
            <iframe
                v-else
                ref="frame"
                class="pan-doc-frame"
                :src="docUrl"
                @load="onFrameLoad"></iframe>
        </div>

        <PanPickGroupDialog
            v-if="groupPickerVisible"
            :groups="groups"
            @confirm="onGroupsPicked"
            @cancel="onGroupsCancel"/>
    </div>
</template>

<script>
import Config from '../../config';
import panApi from '../../api/panApi';
import {
    downloadByUrl,
    getPanAuthCode,
    isPanEnabled,
    loadMyGroups,
    openExternal,
    registerPanBridge,
    withPanAuthCode,
} from './panUtil';
import PanPickGroupDialog from './PanPickGroupDialog.vue';

/**
 * 在线文档页面宿主：把 wf-pan-server 自带的 H5（/doc/open?fileId=… 或 ?url=&name=）
 * 放进 iframe（同站部署）或弹窗（跨站部署，Cookie 才可靠），并实现页面要的桥：
 * getAuthCode / openUrl / downloadFile / chooseContacts / chooseGroup / toast / close。
 *
 * authCode 只放在 URL 的 #panAuthCode= 片段里，页面读完立即抹掉，不进服务端日志。
 */
export default {
    name: 'PanDocWebView',
    components: {PanPickGroupDialog},
    data() {
        return {
            enabled: isPanEnabled(),
            mode: 'iframe',
            docUrl: '',
            error: '',
            popupWindow: null,
            targetWindow: null,
            unregisterBridge: null,
            groups: [],
            groupPickerVisible: false,
            groupResolve: null,
            groupReject: null,
        };
    },
    computed: {
        pageTitle() {
            const query = this.$route.query || {};
            return query.title || query.name || this.$t('pan.online_docs');
        },
    },
    async mounted() {
        // 该页面被 HomePage 的 keep-alive 缓存，换一个文档时组件不会重新挂载，
        // 所以打开逻辑抽出来，由 $route 的 watch 再触发一次。
        await this.openFromRoute();
    },
    watch: {
        '$route.fullPath'(fullPath) {
            if (fullPath.indexOf('/home/pan/doc-web') !== 0) {
                return;
            }
            this.reset();
            this.openFromRoute();
        },
    },
    beforeUnmount() {
        if (this.unregisterBridge) {
            this.unregisterBridge();
        }
        if (this.popupWindow && !this.popupWindow.closed) {
            try {
                this.popupWindow.close();
            } catch (e) {
                // 浏览器可能不允许脚本关闭弹窗，忽略
            }
        }
    },
    methods: {
        /** 换文档前清掉上一份的状态（监听、弹窗、地址） */
        reset() {
            if (this.unregisterBridge) {
                this.unregisterBridge();
                this.unregisterBridge = null;
            }
            if (this.popupWindow && !this.popupWindow.closed) {
                try {
                    this.popupWindow.close();
                } catch (e) {
                    // 忽略
                }
            }
            this.popupWindow = null;
            this.targetWindow = null;
            this.docUrl = '';
            this.error = '';
            this.mode = 'iframe';
            this.enabled = Config.isPanEnabled();
        },
        async openFromRoute() {
            this.reset();
            document.title = this.pageTitle;
            if (!this.enabled) {
                return;
            }
            const query = this.$route.query || {};
            const fileId = Number(query.fileId || 0);
            const viewUrl = query.url || '';
            const directUrl = query.href || '';
            if (!fileId && !viewUrl && !directUrl) {
                this.error = this.$t('pan.doc_missing');
                return;
            }
            // 静态页（开源许可）直接放进 iframe，不用弹窗
            this.mode = directUrl
                ? 'iframe'
                : (query.mode === 'popup' || query.mode === 'iframe'
                    ? query.mode
                    : (this.isSameOrigin() ? 'iframe' : 'popup'));
            // 页面会在第一次消息里判断宿主，宿主先挂上监听，再让页面开始跑
            this.unregisterBridge = registerPanBridge(() => this.targetWindow, {
                onToast: (text) => this.$notify({text: text || '', type: 'warn'}),
                onOpenUrl: (url) => openExternal(url),
                onDownloadFile: (url) => downloadByUrl(url),
                chooseContacts: () => this.chooseContacts(),
                chooseGroup: () => this.chooseGroup(),
                onClose: () => this.goBack(),
            });

            if (this.mode === 'iframe') {
                await this.$nextTick();
                this.targetWindow = this.$refs.frame ? this.$refs.frame.contentWindow : null;
            }

            try {
                const authCode = await getPanAuthCode();
                let url;
                if (directUrl) {
                    url = directUrl;
                } else if (fileId) {
                    url = panApi.docOpenUrl(fileId);
                } else {
                    url = panApi.docViewUrl(viewUrl, query.name || '');
                }
                this.docUrl = withPanAuthCode(url, authCode);
                if (this.mode === 'popup') {
                    this.$nextTick(() => this.openPopup());
                }
            } catch (e) {
                this.error = e.message || this.$t('pan.doc_open_failed');
            }
        },
        isSameOrigin() {
            const base = Config.getPanServer() || '';
            try {
                const pan = new URL(base);
                if (pan.origin === window.location.origin) {
                    return true;
                }
                // 同一个站点（同主机不同端口）也算，iframe 里 Cookie 不会被当成第三方
                return pan.hostname === window.location.hostname;
            } catch (e) {
                return false;
            }
        },
        onFrameLoad() {
            const frame = this.$refs.frame;
            this.targetWindow = frame ? frame.contentWindow : null;
        },
        reload() {
            if (this.mode === 'popup') {
                this.openPopup();
                return;
            }
            const frame = this.$refs.frame;
            if (frame) {
                // 片段里的 authCode 只在首次加载时被页面读走，重新加载要走原地址
                frame.src = this.docUrl;
            }
        },
        switchToPopup() {
            this.mode = 'popup';
            this.$nextTick(() => this.openPopup());
        },
        openPopup() {
            const popup = window.open(this.docUrl, '_blank');
            if (!popup) {
                this.$notify({text: this.$t('pan.popup_blocked'), type: 'warn'});
                return;
            }
            this.popupWindow = popup;
            this.targetWindow = popup;
            try {
                popup.focus();
            } catch (e) {
                // 忽略
            }
        },
        chooseContacts() {
            return new Promise((resolve, reject) => {
                this.$pickContact({
                    title: this.$t('pan.add_member'),
                    successCB: (users) => resolve(users.map((u) => ({
                        uid: u.uid,
                        name: u.displayName || u.name || u.uid,
                        portrait: u.portrait || '',
                    }))),
                    failCB: () => reject(new Error('user canceled')),
                });
            });
        },
        async chooseGroup() {
            this.groups = await loadMyGroups();
            return new Promise((resolve, reject) => {
                this.groupResolve = resolve;
                this.groupReject = reject;
                this.groupPickerVisible = true;
            });
        },
        onGroupsPicked(groups) {
            this.groupPickerVisible = false;
            if (this.groupResolve) {
                this.groupResolve(groups.map((g) => ({gid: g.gid, name: g.name})));
                this.groupResolve = null;
                this.groupReject = null;
            }
        },
        onGroupsCancel() {
            this.groupPickerVisible = false;
            if (this.groupReject) {
                this.groupReject(new Error('user canceled'));
                this.groupResolve = null;
                this.groupReject = null;
            }
        },
        goBack() {
            if (this.$router && window.history.length > 1) {
                this.$router.back();
            } else {
                this.$router.push({path: '/home/pan/docs'});
            }
        },
    },
};
</script>

<style scoped>
.pan-doc-page {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    /* 作为 HomePage 的子路由，占满图标导航栏右侧的剩余空间 */
    flex: 1;
    min-width: 0;
    background: var(--background-primary);
    color: var(--text-primary);
    overflow: hidden;
}

.pan-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-height: 52px;
    padding: 0 16px;
    border-bottom: 1px solid var(--border-secondary);
    flex-shrink: 0;
}

.pan-header-title {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
}

.pan-header-title h1 {
    font-size: var(--font-size-lg);
    font-weight: 600;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.pan-header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
}

.pan-back {
    border: none;
    background: transparent;
    color: var(--text-secondary);
    font-size: var(--font-size-3xl);
    line-height: 1;
    cursor: pointer;
    padding: 0 4px;
}

.pan-text-btn {
    border: 1px solid var(--border-primary);
    background: transparent;
    color: var(--text-primary);
    border-radius: var(--radius-sm);
    height: 30px;
    padding: 0 12px;
    font-size: var(--font-size-sm);
    cursor: pointer;
    white-space: nowrap;
}

.pan-text-btn:hover {
    background: var(--background-item-hover);
}

.pan-doc-body {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
}

.pan-doc-frame {
    flex: 1;
    width: 100%;
    height: 100%;
    border: none;
    background: var(--background-primary);
}

.pan-doc-popup-tip {
    margin: auto;
    text-align: center;
    color: var(--text-secondary);
    font-size: var(--font-size-base);
    padding: 24px;
}

.pan-status {
    color: var(--text-hint);
    font-size: var(--font-size-sm);
    text-align: center;
    padding: 40px 16px;
}

.pan-status-hint {
    font-size: var(--font-size-xs);
    margin-top: 6px;
    color: var(--text-hint);
}

.pan-btn {
    height: 32px;
    padding: 0 16px;
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-primary);
    font-size: var(--font-size-base);
    cursor: pointer;
    margin-top: 12px;
}
</style>
