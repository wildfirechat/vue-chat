<template>
    <div class="pan-page">
        <header class="pan-header">
            <div class="pan-header-title">
                <button class="pan-back" @click="goBack">‹</button>
                <h1>{{ $t('pan.title') }}</h1>
            </div>
            <div class="pan-header-actions">
                <button class="pan-text-btn" @click="goDocs">{{ $t('pan.online_docs') }}</button>
                <button class="pan-text-btn" @click="load">{{ $t('pan.refresh') }}</button>
            </div>
        </header>

        <div class="pan-body">
            <div v-if="!enabled" class="pan-status">{{ $t('pan.not_configured') }}</div>
            <div v-else-if="loading" class="pan-status">{{ $t('pan.loading') }}</div>
            <div v-else-if="error" class="pan-status">
                <p>{{ error }}</p>
                <button class="pan-btn" @click="load">{{ $t('pan.retry') }}</button>
            </div>
            <template v-else>
                <section class="pan-section">
                    <h2 class="pan-section-title">{{ $t('pan.spaces') }}</h2>
                    <div v-if="spaces.length === 0" class="pan-empty">{{ $t('pan.no_spaces') }}</div>
                    <div
                        v-for="space in spaces"
                        :key="space.id"
                        class="pan-space-row"
                        @click="openSpace(space)">
                        <span class="pan-space-icon" :class="spaceIconClass(space)">{{ spaceIcon(space) }}</span>
                        <div class="pan-space-info">
                            <div class="pan-space-name">{{ displayName(space) }}</div>
                            <div class="pan-space-meta">
                                <span>{{ $t('pan.quota', {used: formatSize(space.usedQuota), total: formatSize(space.totalQuota)}) }}</span>
                                <span v-if="space.fileCount || space.folderCount">
                                    · {{ $t('pan.item_count', {count: (space.fileCount || 0) + (space.folderCount || 0)}) }}
                                </span>
                                <span v-if="!canWrite(space)" class="pan-readonly">{{ $t('pan.readonly') }}</span>
                            </div>
                            <div v-if="space.totalQuota > 0" class="pan-quota">
                                <i :class="{danger: quotaRatio(space) > 0.9}" :style="{width: quotaPercent(space)}"></i>
                            </div>
                        </div>
                        <span class="pan-chevron">›</span>
                    </div>
                </section>

                <section class="pan-section">
                    <div class="pan-menu-row" @click="goDocs">
                        <span class="pan-menu-icon">📝</span>
                        <span class="pan-menu-text">{{ $t('pan.recent_docs') }}</span>
                        <span class="pan-chevron">›</span>
                    </div>
                </section>

                <section class="pan-section">
                    <h2 class="pan-section-title">{{ $t('pan.shared_with_me') }}</h2>
                    <div v-if="shared.length === 0" class="pan-empty">{{ $t('pan.shared_empty') }}</div>
                    <div
                        v-for="entry in shared"
                        :key="entry.file.id"
                        class="pan-file-row"
                        @click="openShared(entry)">
                        <span class="pan-file-icon" :class="fileIcon(entry.file).cls">{{ fileIcon(entry.file).icon }}</span>
                        <div class="pan-file-info">
                            <div class="pan-file-name">{{ entry.file.name }}</div>
                            <div class="pan-file-meta">
                                <span>{{ permissionText(entry.permission) }}</span>
                                <span v-if="entry.file.size">· {{ formatSize(entry.file.size) }}</span>
                                <span v-if="entry.sharedAt">· {{ formatTime(entry.sharedAt) }}</span>
                            </div>
                        </div>
                        <span class="pan-chevron">›</span>
                    </div>
                </section>
            </template>
        </div>
    </div>
</template>

<script>
import panApi from '../../api/panApi';
import {
    canWriteSpace,
    downloadPanFile,
    fileIconOf,
    formatPanSize,
    formatPanTime,
    isInlineWebViewSupported,
    isOnlineDocName,
    isPanEnabled,
    spaceDisplayName,
    spaceIcon,
    spaceIconClass,
} from './panUtil';

/**
 * 云盘首页：我的空间列表 + 容量、最近文档入口、共享给我的文件。
 * 点空间进文件列表（在那里上传、新建文件夹、选目标目录）。
 */
export default {
    name: 'PanHomePage',
    data() {
        return {
            enabled: isPanEnabled(),
            loading: true,
            error: '',
            spaces: [],
            shared: [],
        };
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
        formatTime(value) {
            return formatPanTime(value, this.$t);
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
            } catch (e) {
                this.error = e.message || this.$t('pan.load_failed');
            } finally {
                this.loading = false;
            }
        },
        openSpace(space) {
            this.$router.push({
                path: '/pan/files',
                query: {spaceId: space.id, spaceName: this.displayName(space)},
            });
        },
        goDocs() {
            this.$router.push({path: '/pan/docs'});
        },
        goBack() {
            if (window.history.length > 1) {
                this.$router.back();
            } else {
                this.$router.push({path: '/home/setting'});
            }
        },
        async openShared(entry) {
            const file = entry.file;
            if (isOnlineDocName(file.name) && isInlineWebViewSupported()) {
                this.$router.push({
                    path: '/pan/doc-web',
                    query: {fileId: file.id, name: file.name, title: file.name},
                });
                return;
            }
            try {
                await downloadPanFile(file);
            } catch (e) {
                this.$notify({text: e.message || this.$t('pan.download_failed'), type: 'warn'});
            }
        },    },
};
</script>

<style scoped>
.pan-page {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    background: var(--background-primary);
    color: var(--text-primary);
    overflow: hidden;
}

.pan-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 52px;
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
    color: var(--text-primary);
}

.pan-header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
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
}

.pan-text-btn:hover {
    background: var(--background-item-hover);
}

.pan-body {
    flex: 1;
    overflow-y: auto;
    padding: 12px 16px 32px;
    box-sizing: border-box;
}

.pan-section {
    margin-bottom: 18px;
}

.pan-section-title {
    font-size: var(--font-size-sm);
    color: var(--text-hint);
    font-weight: 500;
    margin: 0 0 8px 4px;
}

.pan-space-row,
.pan-menu-row,
.pan-file-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border-radius: var(--radius-md);
    background: var(--background-item-normal);
    margin-bottom: 8px;
    cursor: pointer;
}

.pan-space-row:hover,
.pan-menu-row:hover,
.pan-file-row:hover {
    background: var(--background-item-hover);
}

.pan-space-icon {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--font-size-2xl);
    background: var(--background-item-selected);
    flex-shrink: 0;
}

.pan-space-icon.global {
    background: rgba(240, 160, 64, 0.18);
}

.pan-space-icon.public {
    background: rgba(60, 180, 120, 0.18);
}

.pan-space-info,
.pan-file-info {
    flex: 1;
    min-width: 0;
}

.pan-space-name,
.pan-file-name,
.pan-menu-text {
    font-size: var(--font-size-base);
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.pan-menu-icon,
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

.pan-space-meta,
.pan-file-meta {
    font-size: var(--font-size-xs);
    color: var(--text-hint);
    margin-top: 4px;
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
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

.pan-chevron {
    color: var(--text-hint);
    font-size: var(--font-size-2xl);
    flex-shrink: 0;
}

.pan-empty,
.pan-status {
    color: var(--text-hint);
    font-size: var(--font-size-sm);
    text-align: center;
    padding: 32px 16px;
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
