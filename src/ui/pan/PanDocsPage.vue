<template>
    <div class="pan-page">
        <header class="pan-header">
            <div class="pan-header-title">
                <button class="pan-back" @click="goBack">‹</button>
                <h1>{{ $t('pan.online_docs') }}</h1>
            </div>
            <div class="pan-header-actions">
                <template v-if="canCreate">
                    <button class="pan-text-btn" @click="createDoc('docx')">{{ $t('pan.new_word') }}</button>
                    <button class="pan-text-btn" @click="createDoc('xlsx')">{{ $t('pan.new_cell') }}</button>
                    <button class="pan-text-btn" @click="createDoc('pptx')">{{ $t('pan.new_slide') }}</button>
                </template>
                <button class="pan-text-btn" @click="loadTab(currentTab)">{{ $t('pan.refresh') }}</button>
            </div>
        </header>

        <div class="pan-tabs">
            <div class="pan-tab" :class="{active: currentTab === 'recent'}" @click="selectTab('recent')">
                {{ $t('pan.recent_docs') }}
            </div>
            <div class="pan-tab" :class="{active: currentTab === 'shared'}" @click="selectTab('shared')">
                {{ $t('pan.shared_with_me') }}
            </div>
            <a class="pan-licenses" href="javascript:" @click.prevent="openLicenses">{{ $t('pan.licenses') }}</a>
        </div>

        <div class="pan-body">
            <div v-if="!enabled" class="pan-status">{{ $t('pan.not_configured') }}</div>
            <div v-else-if="loading" class="pan-status">{{ $t('pan.loading') }}</div>
            <div v-else-if="error" class="pan-status">
                <p>{{ error }}</p>
                <button class="pan-btn" @click="loadTab(currentTab)">{{ $t('pan.retry') }}</button>
            </div>
            <div v-else-if="entries.length === 0" class="pan-status">
                <p>{{ currentTab === 'recent' ? $t('pan.docs_recent_empty') : $t('pan.shared_empty') }}</p>
                <p class="pan-status-hint">
                    {{ currentTab === 'recent' ? (canCreate ? $t('pan.docs_recent_hint') : $t('pan.docs_recent_hint_no_create')) : $t('pan.docs_shared_hint') }}
                </p>
            </div>
            <div v-else class="pan-list">
                <div v-for="entry in entries" :key="entry.file.id" class="pan-file-row" @click="open(entry.file)">
                    <span class="pan-file-icon" :class="fileIcon(entry.file).cls">{{ fileIcon(entry.file).icon }}</span>
                    <div class="pan-file-info">
                        <div class="pan-file-name">{{ entry.file.name }}</div>
                        <div class="pan-file-meta">
                            <span>{{ currentTab === 'recent' ? formatTime(entry.openedAt) : formatTime(entry.sharedAt) }}</span>
                            <span v-if="entry.file.size">· {{ formatSize(entry.file.size) }}</span>
                            <span v-if="entry.file.creatorName">· {{ entry.file.creatorName }}</span>
                            <span v-if="currentTab === 'shared'">· {{ permissionText(entry.permission) }}</span>
                        </div>
                    </div>
                    <button v-if="currentTab === 'recent'" class="pan-more" @click.stop="openMenu(entry, $event)">⋯</button>
                </div>
            </div>
        </div>

        <div v-if="menuEntry" class="pan-menu-backdrop" @click="menuEntry = null">
            <div class="pan-context-menu" :style="menuStyle">
                <a @click.prevent="open(menuEntry.file)">{{ $t('pan.open') }}</a>
                <a v-if="canShare(menuEntry.file)" @click.prevent="share(menuEntry.file)">{{ $t('pan.share') }}</a>
                <a class="danger" @click.prevent="removeRecent(menuEntry)">{{ $t('pan.docs_remove_recent') }}</a>
            </div>
        </div>

        <PanNameDialog
            v-if="newDocType"
            :title="newDocTitle"
            :hint="$t('pan.docs_name_hint')"
            :initial="untitledName"
            @confirm="doCreateDoc"
            @cancel="newDocType = null"/>

        <PanShareDialog
            v-if="shareFile"
            :file-id="shareFile.id"
            :file-name="shareFile.name"
            @close="shareFile = null"/>
    </div>
</template>

<script>
import panApi from '../../api/panApi';
import {
    fileIconOf,
    formatPanSize,
    formatPanTime,
    isInlineWebViewSupported,
    isPanEnabled,
    isFolder,
    spaceDisplayName,
} from './panUtil';
import PanNameDialog from './PanNameDialog.vue';
import PanShareDialog from './PanShareDialog.vue';

/**
 * 在线文档首页：最近打开、共享给我，新建 Word/Excel/PPT，开源许可入口。
 * 新建在手机上默认不给（服务端 docs/options 打开 mobileEdit 才给），点开文档进内置文档页。
 */
export default {
    name: 'PanDocsPage',
    components: {PanNameDialog, PanShareDialog},
    data() {
        return {
            enabled: isPanEnabled(),
            currentTab: 'recent',
            cache: {recent: null, shared: null},
            loading: true,
            error: '',
            canCreate: true,
            manageableSpaces: new Set(),
            newDocType: null,
            shareFile: null,
            menuEntry: null,
            menuStyle: {},
        };
    },
    computed: {
        entries() {
            return this.cache[this.currentTab] || [];
        },
        newDocTitle() {
            if (this.newDocType === 'xlsx') {
                return this.$t('pan.new_cell');
            }
            if (this.newDocType === 'pptx') {
                return this.$t('pan.new_slide');
            }
            return this.$t('pan.new_word');
        },
        untitledName() {
            if (this.newDocType === 'xlsx') {
                return this.$t('pan.untitled_cell');
            }
            if (this.newDocType === 'pptx') {
                return this.$t('pan.untitled_slide');
            }
            return this.$t('pan.untitled_word');
        },
    },
    mounted() {
        document.title = this.$t('pan.online_docs');
        if (!this.enabled) {
            this.loading = false;
            return;
        }
        this.checkOptions();
        this.loadManageableSpaces();
        this.loadTab('recent');
    },
    methods: {
        isFolder,
        formatSize(size) {
            return formatPanSize(size);
        },
        formatTime(value) {
            return formatPanTime(value, this.$t);
        },
        fileIcon(file) {
            return fileIconOf(file);
        },
        permissionText(permission) {
            return permission === 'EDIT' ? this.$t('pan.permission_edit') : this.$t('pan.permission_view');
        },
        /** 手机上默认不给新建：服务端开了手机端编辑才给（宽屏按电脑端处理） */
        async checkOptions() {
            const wide = window.innerWidth >= 720;
            if (wide) {
                this.canCreate = true;
                return;
            }
            try {
                const options = await panApi.docsOptions();
                this.canCreate = !!(options && options.mobileEdit);
            } catch (e) {
                this.canCreate = false;
            }
        },
        async loadManageableSpaces() {
            try {
                const spaces = await panApi.getSpaces();
                this.manageableSpaces = new Set((spaces || []).filter((s) => s.canManage).map((s) => Number(s.id)));
            } catch (e) {
                this.manageableSpaces = new Set();
            }
        },
        canShare(file) {
            return !isFolder(file) && this.manageableSpaces.has(Number(file.spaceId));
        },
        selectTab(tab) {
            if (this.currentTab === tab && this.cache[tab]) {
                return;
            }
            this.currentTab = tab;
            this.loadTab(tab);
        },
        async loadTab(tab) {
            this.loading = true;
            this.error = '';
            try {
                const data = tab === 'recent' ? await panApi.recentDocs() : await panApi.sharedWithMe();
                this.cache[tab] = data || [];
            } catch (e) {
                if (!this.cache[tab]) {
                    this.error = e.message || this.$t('pan.load_failed');
                }
            } finally {
                this.loading = false;
            }
        },
        open(file) {
            this.menuEntry = null;
            if (!isInlineWebViewSupported()) {
                return;
            }
            this.$router.push({
                path: '/home/pan/doc-web',
                query: {fileId: file.id, name: file.name, title: file.name},
            });
        },
        share(file) {
            this.menuEntry = null;
            this.shareFile = file;
        },
        async removeRecent(entry) {
            this.menuEntry = null;
            this.cache.recent = (this.cache.recent || []).filter((e) => e.file.id !== entry.file.id);
            try {
                await panApi.removeRecentDoc(entry.file.id);
            } catch (e) {
                this.$notify({text: e.message || this.$t('pan.docs_remove_failed'), type: 'warn'});
                this.loadTab('recent');
            }
        },
        createDoc(type) {
            if (!this.canCreate) {
                return;
            }
            this.newDocType = type;
        },
        async doCreateDoc(name) {
            const type = this.newDocType;
            this.newDocType = null;
            try {
                const file = await panApi.createDoc(type, name);
                this.currentTab = 'recent';
                await this.loadTab('recent');
                if (file) {
                    this.open(file);
                }
            } catch (e) {
                this.$notify({text: e.message || this.$t('pan.create_failed'), type: 'warn'});
            }
        },
        openLicenses() {
            // 许可页是服务端自带的静态页，直接放进内置网页，不用过 /doc/open
            this.$router.push({
                path: '/home/pan/doc-web',
                query: {
                    href: panApi.docLicensesUrl(),
                    name: this.$t('pan.licenses'),
                    title: this.$t('pan.licenses'),
                },
            });
        },
        openMenu(entry, event) {
            if (this.menuEntry && this.menuEntry.file.id === entry.file.id) {
                this.menuEntry = null;
                return;
            }
            this.menuEntry = entry;
            const rect = event.currentTarget.getBoundingClientRect();
            this.menuStyle = {
                top: Math.max(8, Math.min(rect.bottom + 4, window.innerHeight - 140)) + 'px',
                left: Math.max(8, Math.min(rect.right - 160, window.innerWidth - 176)) + 'px',
            };
        },
        spaceDisplayName(space) {
            return spaceDisplayName(space, this.$t);
        },
        goBack() {
            if (window.history.length > 1) {
                this.$router.back();
            } else {
                this.$router.push({path: '/home/setting'});
            }
        },
    },
};
</script>

<style scoped>
.pan-page {
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
    font-size: var(--font-size-2xl);
    font-weight: 600;
    margin: 0;
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

.pan-tabs {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 0 16px;
    border-bottom: 1px solid var(--border-secondary);
    flex-shrink: 0;
}

.pan-tab {
    padding: 10px 12px;
    font-size: var(--font-size-base);
    color: var(--text-secondary);
    cursor: pointer;
    border-bottom: 2px solid transparent;
}

.pan-tab.active {
    color: var(--accent-color);
    border-bottom-color: var(--accent-color);
}

.pan-licenses {
    margin-left: auto;
    font-size: var(--font-size-sm);
    color: var(--text-link);
    text-decoration: none;
}

.pan-body {
    flex: 1;
    overflow-y: auto;
    padding: 8px 16px 32px;
    box-sizing: border-box;
}

.pan-file-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 8px;
    border-bottom: 1px solid var(--border-subtle);
    cursor: pointer;
}

.pan-file-row:hover {
    background: var(--background-item-hover);
}

.pan-file-icon {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--font-size-2xl);
    background: var(--background-item-selected);
    color: var(--text-primary);
    flex-shrink: 0;
}

.pan-file-icon.word {
    background: rgba(31, 100, 228, 0.16);
}

.pan-file-icon.excel {
    background: rgba(60, 180, 120, 0.18);
}

.pan-file-icon.ppt {
    background: rgba(240, 120, 60, 0.18);
}

.pan-file-icon.pdf,
.pan-file-icon.image,
.pan-file-icon.video,
.pan-file-icon.audio,
.pan-file-icon.archive {
    background: var(--background-item-active);
}

.pan-file-info {
    flex: 1;
    min-width: 0;
}

.pan-file-name {
    font-size: var(--font-size-base);
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.pan-file-meta {
    font-size: var(--font-size-xs);
    color: var(--text-hint);
    margin-top: 4px;
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
}

.pan-more {
    border: none;
    background: transparent;
    color: var(--text-hint);
    font-size: var(--font-size-2xl);
    cursor: pointer;
    padding: 0 6px;
    flex-shrink: 0;
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
}

.pan-menu-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 2500;
}

.pan-context-menu {
    position: fixed;
    min-width: 160px;
    background: var(--background-modal);
    border: 1px solid var(--border-secondary);
    border-radius: var(--radius-md);
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.18);
    padding: 4px 0;
    display: flex;
    flex-direction: column;
}

.pan-context-menu a {
    padding: 8px 14px;
    font-size: var(--font-size-base);
    color: var(--text-primary);
    text-decoration: none;
    cursor: pointer;
}

.pan-context-menu a:hover {
    background: var(--background-item-hover);
}

.pan-context-menu a.danger {
    color: var(--text-danger);
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
