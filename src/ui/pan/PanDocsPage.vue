<template>
    <div class="pan-layout">
        <!-- 中间栏：最近打开 / 共享给我的文档列表 -->
        <section class="pan-nav-panel">
            <header class="pan-nav-header">
                <h1>{{ $t('pan.online_docs') }}</h1>
                <div class="pan-nav-header-actions">
                    <button v-if="canCreate" class="pan-icon-btn" :title="$t('pan.new_doc')" @click="createMenuVisible = !createMenuVisible">
                        <i class="icon-ion-ios-add"/>
                    </button>
                    <button class="pan-icon-btn" :title="$t('pan.refresh')" @click="loadTab(currentTab)">
                        <i class="icon-ion-android-refresh"/>
                    </button>
                </div>
            </header>

            <!-- 新建菜单（贴着中间栏右上角） -->
            <div v-if="createMenuVisible" class="pan-create-menu" @click.stop>
                <a @click.prevent="createDoc('docx')">{{ $t('pan.new_word') }}</a>
                <a @click.prevent="createDoc('xlsx')">{{ $t('pan.new_cell') }}</a>
                <a @click.prevent="createDoc('pptx')">{{ $t('pan.new_slide') }}</a>
            </div>

            <div class="pan-tabs">
                <div class="pan-tab" :class="{active: currentTab === 'recent'}" @click="selectTab('recent')">
                    {{ $t('pan.recent_docs') }}
                </div>
                <div class="pan-tab" :class="{active: currentTab === 'shared'}" @click="selectTab('shared')">
                    {{ $t('pan.shared_with_me') }}
                </div>
            </div>

            <div class="pan-nav-body">
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
                <template v-else>
                    <div
                        v-for="entry in entries"
                        :key="entry.file.id"
                        class="pan-nav-row"
                        :class="{active: activeDoc && Number(activeDoc.fileId) === Number(entry.file.id)}"
                        @click="open(entry.file)">
                        <span class="pan-file-icon" :class="fileIcon(entry.file).cls">{{ fileIcon(entry.file).icon }}</span>
                        <div class="pan-nav-info">
                            <div class="pan-nav-name">{{ entry.file.name }}</div>
                            <div class="pan-nav-meta">
                                <span>{{ currentTab === 'recent' ? formatTime(entry.openedAt) : formatTime(entry.sharedAt) }}</span>
                                <span v-if="entry.file.size">· {{ formatSize(entry.file.size) }}</span>
                                <span v-if="currentTab === 'shared'">· {{ permissionText(entry.permission) }}</span>
                            </div>
                        </div>
                        <button v-if="currentTab === 'recent'" class="pan-more" @click.stop="openMenu(entry, $event)">⋯</button>
                    </div>
                </template>
            </div>

            <div class="pan-nav-footer">
                <a href="javascript:" @click.prevent="openLicenses">{{ $t('pan.licenses') }}</a>
            </div>
        </section>

        <ResizeBar/>

        <!-- 详情栏：在线文档 -->
        <section class="pan-detail">
            <PanDocWebView
                v-if="activeDoc"
                :key="docKey"
                :file-id="activeDoc.fileId"
                :href="activeDoc.href"
                :name="activeDoc.name"
                :title="activeDoc.title"
                embedded
                @close="activeDoc = null"/>
            <div v-else class="pan-detail-empty">
                <div class="pan-detail-empty-icon">📄</div>
                <p class="pan-detail-empty-title">{{ $t('pan.select_doc') }}</p>
                <p class="pan-detail-empty-hint">{{ $t('pan.select_doc_hint') }}</p>
            </div>
        </section>

        <!-- 新建菜单的点击外面关闭 -->
        <div v-if="createMenuVisible" class="pan-menu-backdrop" @click="createMenuVisible = false"></div>

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
} from './panUtil';
import PanNameDialog from './PanNameDialog.vue';
import PanShareDialog from './PanShareDialog.vue';
import PanDocWebView from './PanDocWebView.vue';
import ResizeBar from '../common/ResizeBar.vue';

/**
 * 在线文档页（三栏布局）：中间栏是最近打开 / 共享给我的文档列表，
 * 详情栏打开选中的文档（内置网页），新建的文档也直接在这里打开。
 */
export default {
    name: 'PanDocsPage',
    components: {PanNameDialog, PanShareDialog, PanDocWebView, ResizeBar},
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
            createMenuVisible: false,
            shareFile: null,
            menuEntry: null,
            menuStyle: {},
            activeDoc: null,
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
        docKey() {
            if (!this.activeDoc) {
                return '';
            }
            return [this.activeDoc.fileId || '', this.activeDoc.href || '', this.activeDoc.name || ''].join('|');
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
            this.activeDoc = {fileId: file.id, name: file.name, title: file.name};
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
            this.createMenuVisible = false;
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
            // 许可页是服务端自带的静态页，直接放进详情栏，不用过 /doc/open
            this.activeDoc = {
                href: panApi.docLicensesUrl(),
                name: this.$t('pan.licenses'),
                title: this.$t('pan.licenses'),
            };
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
    },
};
</script>

<style scoped>
.pan-layout {
    display: flex;
    flex: 1;
    min-width: 0;
    height: 100%;
    background: var(--background-primary);
    color: var(--text-primary);
    overflow: hidden;
}

/* ---------------- 中间栏 ---------------- */
.pan-nav-panel {
    width: var(--list-panel-width);
    flex: 0 0 var(--list-panel-width);
    height: 100%;
    display: flex;
    flex-direction: column;
    background: var(--background-secondary);
    border-right: 1px solid var(--border-primary);
    overflow: hidden;
    position: relative;
}

.pan-nav-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    height: 52px;
    padding: 0 8px 0 16px;
    flex-shrink: 0;
}

.pan-nav-header h1 {
    font-size: var(--font-size-2xl);
    font-weight: 600;
    margin: 0;
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.pan-nav-header-actions {
    display: flex;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
}

.pan-icon-btn {
    border: none;
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    font-size: var(--font-size-xl);
    line-height: 1;
    padding: 6px;
    border-radius: var(--radius-sm);
}

.pan-icon-btn:hover {
    background: var(--background-item-hover);
}

.pan-tabs {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 0 12px 8px;
    flex-shrink: 0;
}

.pan-tab {
    flex: 1;
    text-align: center;
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    padding: 6px 8px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.pan-tab:hover {
    background: var(--background-item-hover);
}

.pan-tab.active {
    background: var(--background-item-selected);
    color: var(--accent-color-active, var(--accent-color));
}

.pan-nav-body {
    flex: 1;
    overflow-y: auto;
    padding: 0 8px 12px;
    box-sizing: border-box;
}

.pan-nav-footer {
    flex-shrink: 0;
    padding: 8px 16px 12px;
    border-top: 1px solid var(--border-secondary);
}

.pan-nav-footer a {
    font-size: var(--font-size-xs);
    color: var(--text-hint);
    text-decoration: none;
}

.pan-nav-footer a:hover {
    color: var(--accent-color);
}

.pan-nav-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px;
    border-radius: var(--radius-md);
    cursor: pointer;
    margin-bottom: 2px;
    position: relative;
}

.pan-nav-row:hover {
    background: var(--background-item-hover);
}

.pan-nav-row.active {
    background: var(--background-item-selected);
}

.pan-nav-info {
    flex: 1;
    min-width: 0;
}

.pan-nav-name {
    font-size: var(--font-size-base);
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.pan-nav-meta {
    font-size: var(--font-size-xs);
    color: var(--text-hint);
    margin-top: 3px;
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
}

.pan-more {
    border: none;
    background: transparent;
    color: var(--text-hint);
    cursor: pointer;
    font-size: var(--font-size-xl);
    line-height: 1;
    padding: 0 4px;
}

/* ---------------- 详情栏 ---------------- */
.pan-detail {
    flex: 1;
    min-width: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: var(--background-primary);
    overflow: hidden;
}

.pan-detail-empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    color: var(--text-hint);
    background-image: var(--hero-bg-pattern);
    background-size: 20px 20px;
}

.pan-detail-empty-icon {
    font-size: 48px;
    line-height: 1;
    opacity: 0.5;
}

.pan-detail-empty-title {
    margin: 8px 0 0;
    font-size: var(--font-size-lg);
    color: var(--text-secondary);
}

.pan-detail-empty-hint {
    margin: 0;
    font-size: var(--font-size-sm);
    color: var(--text-hint);
}

/* ---------------- 菜单 ---------------- */
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

.pan-create-menu {
    position: absolute;
    z-index: 2600;
    top: 46px;
    right: 12px;
    min-width: 140px;
    background: var(--background-tertiary);
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-md);
    box-shadow: 0 8px 24px var(--background-mask, rgba(0, 0, 0, 0.3));
    padding: 4px;
}

.pan-create-menu a {
    display: block;
    padding: 8px 12px;
    font-size: var(--font-size-base);
    color: var(--text-primary);
    text-decoration: none;
    border-radius: var(--radius-sm);
    cursor: pointer;
}

.pan-create-menu a:hover {
    background: var(--background-item-hover);
}

/* ---------------- 通用 ---------------- */
.pan-file-icon {
    width: 36px;
    height: 36px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--font-size-xl);
    background: var(--background-item-selected);
    color: var(--text-primary);
    flex-shrink: 0;
}

.pan-empty,
.pan-status {
    color: var(--text-hint);
    font-size: var(--font-size-sm);
    text-align: center;
    padding: 24px 12px;
}

.pan-status-hint {
    font-size: var(--font-size-xs);
    margin-top: 6px;
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
