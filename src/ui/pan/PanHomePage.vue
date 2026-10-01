<template>
    <div class="pan-layout">
        <!-- 中间栏：空间 / 共享给我的导航 -->
        <section class="pan-nav-panel">
            <header class="pan-nav-header">
                <h1>{{ $t('pan.title') }}</h1>
                <button class="pan-icon-btn" :title="$t('pan.refresh')" @click="load">
                    <i class="icon-ion-android-refresh"/>
                </button>
            </header>

            <div class="pan-nav-body">
                <div v-if="!enabled" class="pan-status">{{ $t('pan.not_configured') }}</div>
                <div v-else-if="loading" class="pan-status">{{ $t('pan.loading') }}</div>
                <div v-else-if="error" class="pan-status">
                    <p>{{ error }}</p>
                    <button class="pan-btn" @click="load">{{ $t('pan.retry') }}</button>
                </div>
                <template v-else>
                    <div class="pan-nav-section">
                        <div class="pan-nav-title">{{ $t('pan.spaces') }}</div>
                        <div v-if="spaces.length === 0" class="pan-empty">{{ $t('pan.no_spaces') }}</div>
                        <div
                            v-for="space in spaces"
                            :key="space.id"
                            class="pan-nav-row"
                            :class="{active: Number(space.id) === activeSpaceId}"
                            @click="selectSpace(space)">
                            <span class="pan-space-icon" :class="spaceIconClass(space)">{{ spaceIcon(space) }}</span>
                            <div class="pan-nav-info">
                                <div class="pan-nav-name">{{ displayName(space) }}</div>
                                <div class="pan-nav-meta">
                                    <span>{{ $t('pan.quota', {used: formatSize(space.usedQuota), total: formatSize(space.totalQuota)}) }}</span>
                                    <span v-if="!canWrite(space)" class="pan-readonly">{{ $t('pan.readonly') }}</span>
                                </div>
                                <div v-if="space.totalQuota > 0" class="pan-quota">
                                    <i :class="{danger: quotaRatio(space) > 0.9}" :style="{width: quotaPercent(space)}"></i>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="pan-nav-section">
                        <div class="pan-nav-title">{{ $t('pan.shared_with_me') }}</div>
                        <div v-if="shared.length === 0" class="pan-empty">{{ $t('pan.shared_empty') }}</div>
                        <div
                            v-for="entry in shared"
                            :key="entry.file.id"
                            class="pan-nav-row"
                            @click="selectShared(entry)">
                            <span class="pan-file-icon" :class="fileIcon(entry.file).cls">{{ fileIcon(entry.file).icon }}</span>
                            <div class="pan-nav-info">
                                <div class="pan-nav-name">{{ entry.file.name }}</div>
                                <div class="pan-nav-meta">
                                    <span>{{ permissionText(entry.permission) }}</span>
                                    <span v-if="entry.file.size">· {{ formatSize(entry.file.size) }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
            </div>
        </section>

        <ResizeBar/>

        <!-- 详情栏：当前空间的文件列表，打开文档时换成在线文档 -->
        <section class="pan-detail">
            <template v-if="activeSpace">
                <PanFileListPage
                    v-show="!activeDoc"
                    :key="'space-' + activeSpaceId"
                    :space-id="activeSpace.id"
                    :space-name="activeSpaceName"
                    embedded
                    @open-doc="openDoc"/>
                <PanDocWebView
                    v-if="activeDoc"
                    :file-id="activeDoc.fileId"
                    :name="activeDoc.name"
                    :title="activeDoc.title"
                    embedded
                    @close="activeDoc = null"/>
            </template>
            <div v-else class="pan-detail-empty">
                <div class="pan-detail-empty-icon">☁</div>
                <p class="pan-detail-empty-title">{{ $t('pan.select_space') }}</p>
                <p class="pan-detail-empty-hint">{{ $t('pan.select_space_hint') }}</p>
            </div>
        </section>
    </div>
</template>

<script>
import panApi from '../../api/panApi';
import {
    canWriteSpace,
    downloadPanFile,
    fileIconOf,
    formatPanSize,
    isInlineWebViewSupported,
    isOnlineDocName,
    isPanEnabled,
    spaceDisplayName,
    spaceIcon,
    spaceIconClass,
} from './panUtil';
import PanFileListPage from './PanFileListPage.vue';
import PanDocWebView from './PanDocWebView.vue';
import ResizeBar from '../common/ResizeBar.vue';

/**
 * 网盘页（三栏布局）：中间栏是空间 / 共享给我的导航，
 * 详情栏是选中空间的文件列表；点开文档时详情栏换成在线文档。
 */
export default {
    name: 'PanHomePage',
    components: {PanFileListPage, PanDocWebView, ResizeBar},
    data() {
        return {
            enabled: isPanEnabled(),
            loading: true,
            error: '',
            spaces: [],
            shared: [],
            activeSpaceId: 0,
            activeDoc: null,
        };
    },
    computed: {
        activeSpace() {
            return this.spaces.find((s) => Number(s.id) === this.activeSpaceId) || null;
        },
        activeSpaceName() {
            return this.activeSpace ? this.displayName(this.activeSpace) : '';
        },
    },
    mounted() {
        document.title = this.$t('pan.title');
        if (this.enabled) {
            this.load();
        } else {
            this.loading = false;
        }
    },
    methods: {
        displayName(space) {
            return spaceDisplayName(space, this.$t);
        },
        spaceIcon,
        spaceIconClass,
        canWrite(space) {
            return canWriteSpace(space);
        },
        formatSize(size) {
            return formatPanSize(size);
        },
        fileIcon(file) {
            return fileIconOf(file);
        },
        permissionText(permission) {
            return permission === 'EDIT' ? this.$t('pan.permission_edit') : this.$t('pan.permission_view');
        },
        quotaRatio(space) {
            if (!space.totalQuota) {
                return 0;
            }
            return Math.min(1, (space.usedQuota || 0) / space.totalQuota);
        },
        quotaPercent(space) {
            const ratio = this.quotaRatio(space);
            if (ratio > 0 && ratio < 0.01) {
                return '1%';
            }
            return (ratio * 100).toFixed(0) + '%';
        },
        async load() {
            if (!this.enabled) {
                return;
            }
            this.loading = true;
            this.error = '';
            try {
                const [spaces, shared] = await Promise.all([
                    panApi.getSpaces(),
                    panApi.sharedWithMe().catch(() => []),
                ]);
                // 私有空间排前面，公共空间放最后
                const order = {USER_PRIVATE: 0, USER_PUBLIC: 1, GLOBAL_PUBLIC: 2};
                this.spaces = (spaces || []).slice().sort((a, b) => {
                    const sa = order[String(a.spaceType).toUpperCase()];
                    const sb = order[String(b.spaceType).toUpperCase()];
                    return (sa === undefined ? 9 : sa) - (sb === undefined ? 9 : sb);
                });
                this.shared = shared || [];
                // 选中的空间没了就落到第一个空间，保证详情栏有内容
                if (!this.activeSpace) {
                    this.activeSpaceId = this.spaces.length ? Number(this.spaces[0].id) : 0;
                    this.activeDoc = null;
                }
            } catch (e) {
                this.error = e.message || this.$t('pan.load_failed');
            } finally {
                this.loading = false;
            }
        },
        selectSpace(space) {
            const id = Number(space.id);
            if (id === this.activeSpaceId) {
                return;
            }
            this.activeSpaceId = id;
            this.activeDoc = null;
        },
        openDoc(doc) {
            this.activeDoc = doc;
        },
        async selectShared(entry) {
            const file = entry.file;
            if (isOnlineDocName(file.name) && isInlineWebViewSupported()) {
                this.activeDoc = {fileId: file.id, name: file.name, title: file.name};
                return;
            }
            try {
                await downloadPanFile(file);
            } catch (e) {
                this.$notify({text: e.message || this.$t('pan.download_failed'), type: 'warn'});
            }
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
}

.pan-nav-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    height: 52px;
    padding: 0 12px 0 16px;
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

.pan-icon-btn {
    border: none;
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    font-size: var(--font-size-xl);
    line-height: 1;
    padding: 6px;
    border-radius: var(--radius-sm);
    flex-shrink: 0;
}

.pan-icon-btn:hover {
    background: var(--background-item-hover);
}

.pan-nav-body {
    flex: 1;
    overflow-y: auto;
    padding: 0 8px 24px;
    box-sizing: border-box;
}

.pan-nav-section {
    margin-bottom: 14px;
}

.pan-nav-title {
    font-size: var(--font-size-xs);
    color: var(--text-hint);
    font-weight: 500;
    margin: 8px 0 6px 8px;
}

.pan-nav-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px;
    border-radius: var(--radius-md);
    cursor: pointer;
    margin-bottom: 2px;
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

/* ---------------- 通用 ---------------- */
.pan-space-icon,
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

.pan-space-icon.global {
    background: rgba(240, 160, 64, 0.18);
}

.pan-space-icon.public {
    background: rgba(60, 180, 120, 0.18);
}

.pan-readonly {
    color: var(--text-warning);
}

.pan-quota {
    height: 4px;
    border-radius: 2px;
    background: var(--border-secondary);
    margin-top: 6px;
    overflow: hidden;
}

.pan-quota i {
    display: block;
    height: 100%;
    background: var(--accent-color);
}

.pan-quota i.danger {
    background: var(--text-danger);
}

.pan-empty,
.pan-status {
    color: var(--text-hint);
    font-size: var(--font-size-sm);
    text-align: center;
    padding: 24px 12px;
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
