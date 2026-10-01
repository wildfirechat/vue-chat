<template>
    <div class="pan-page">
        <header class="pan-header">
            <div class="pan-header-title">
                <button v-if="!embedded || pathStack.length > 1" class="pan-back" @click="goBack">‹</button>
                <nav class="pan-breadcrumb">
                    <template v-for="(segment, index) in pathStack" :key="segment.id + '-' + index">
                        <span v-if="index > 0" class="pan-crumb-sep">/</span>
                        <a
                            v-if="index < pathStack.length - 1"
                            class="pan-crumb"
                            href="javascript:"
                            @click.prevent="goCrumb(index)">{{ segment.name }}</a>
                        <span v-else class="pan-crumb current">{{ segment.name }}</span>
                    </template>
                </nav>
            </div>
            <div class="pan-header-actions">
                <template v-if="writable">
                    <button class="pan-text-btn" @click="newFolderVisible = true">{{ $t('pan.new_folder') }}</button>
                    <button class="pan-text-btn" @click="pickFiles">{{ $t('pan.upload') }}</button>
                    <button class="pan-text-btn" @click="openChatFiles">{{ $t('pan.from_chat') }}</button>
                </template>
                <button class="pan-text-btn" @click="load">{{ $t('pan.refresh') }}</button>
            </div>
        </header>

        <div v-if="space && space.totalQuota > 0" class="pan-quota-strip">
            <div class="pan-quota">
                <i :class="{danger: quotaRatio > 0.9}" :style="{width: quotaPercent}"></i>
            </div>
            <span class="pan-quota-text">{{ $t('pan.quota', {used: formatSize(space.usedQuota), total: formatSize(space.totalQuota)}) }}</span>
        </div>

        <div v-if="uploadTask" class="pan-upload-strip">
            <span class="pan-upload-name">{{ $t('pan.uploading', {name: uploadTask.name}) }}</span>
            <div class="pan-quota grow">
                <i :style="{width: (uploadTask.progress * 100).toFixed(0) + '%'}"></i>
            </div>
            <span class="pan-upload-percent">{{ (uploadTask.progress * 100).toFixed(0) }}%</span>
        </div>

        <div class="pan-body">
            <div v-if="!enabled" class="pan-status">{{ $t('pan.not_configured') }}</div>
            <div v-else-if="loading" class="pan-status">{{ $t('pan.loading') }}</div>
            <div v-else-if="error" class="pan-status">
                <p>{{ error }}</p>
                <button class="pan-btn" @click="load">{{ $t('pan.retry') }}</button>
            </div>
            <div v-else-if="files.length === 0" class="pan-status">
                <p>{{ $t('pan.empty_folder') }}</p>
                <p v-if="writable" class="pan-status-hint">{{ $t('pan.empty_folder_hint') }}</p>
            </div>
            <div v-else class="pan-list">
                <div
                    v-for="file in files"
                    :key="file.id"
                    class="pan-file-row"
                    @click="openEntry(file)">
                    <span class="pan-file-icon" :class="fileIcon(file).cls">{{ fileIcon(file).icon }}</span>
                    <div class="pan-file-info">
                        <div class="pan-file-name">{{ file.name }}</div>
                        <div class="pan-file-meta">
                            <span v-if="isFolder(file)">{{ $t('pan.item_count', {count: file.childCount || 0}) }}</span>
                            <span v-else>{{ formatSize(file.size) }}</span>
                            <span v-if="file.creatorName || file.creatorId">· {{ file.creatorName || file.creatorId }}</span>
                            <span>· {{ formatTime(file.updatedAt || file.createdAt) }}</span>
                        </div>
                    </div>
                    <button class="pan-more" @click.stop="openMenu(file, $event)">⋯</button>
                </div>
            </div>
        </div>

        <input ref="fileInput" type="file" multiple class="pan-hidden-input" @change="onFilesPicked"/>

        <!-- 文件操作菜单 -->
        <div v-if="menuFile" class="pan-menu-backdrop" @click="menuFile = null">
            <div class="pan-context-menu" :style="menuStyle">
                <a v-if="isFolder(menuFile)" @click.prevent="enter(menuFile)">{{ $t('pan.open') }}</a>
                <a v-if="!isFolder(menuFile) && canOpenOnline(menuFile)" @click.prevent="openDoc(menuFile)">{{ $t('pan.open_online') }}</a>
                <a v-if="!isFolder(menuFile)" @click.prevent="download(menuFile)">{{ $t('pan.download') }}</a>
                <a v-if="writable && !isFolder(menuFile)" @click.prevent="openShare(menuFile)">{{ $t('pan.share') }}</a>
                <a v-if="writable" @click.prevent="openRename(menuFile)">{{ $t('pan.rename') }}</a>
                <a v-if="writable" class="danger" @click.prevent="askDelete(menuFile)">{{ $t('pan.delete') }}</a>
            </div>
        </div>

        <PanNameDialog
            v-if="newFolderVisible"
            :title="$t('pan.new_folder')"
            :hint="$t('pan.folder_name')"
            @confirm="createFolder"
            @cancel="newFolderVisible = false"/>

        <PanNameDialog
            v-if="renameFile"
            :title="$t('pan.rename')"
            :hint="$t('pan.new_name')"
            :initial="renameFile.name"
            @confirm="doRename"
            @cancel="renameFile = null"/>

        <PanShareDialog
            v-if="shareFile"
            :file-id="shareFile.id"
            :file-name="shareFile.name"
            @close="shareFile = null"/>

        <div v-if="deleteFile" class="pan-mask" @click.self="deleteFile = null">
            <div class="pan-confirm">
                <p>{{ $t('pan.delete_confirm', {name: deleteFile.name}) }}</p>
                <div class="pan-confirm-actions">
                    <button class="pan-btn" @click="deleteFile = null">{{ $t('pan.cancel') }}</button>
                    <button class="pan-btn danger" @click="doDelete">{{ $t('pan.delete') }}</button>
                </div>
            </div>
        </div>

        <!-- 从聊天文件保存 -->
        <div v-if="chatFilesVisible" class="pan-mask" @click.self="chatFilesVisible = false">
            <div class="pan-dialog">
                <div class="pan-dialog-title">{{ $t('pan.from_chat') }}</div>
                <div v-if="chatFilesLoading" class="pan-status">{{ $t('pan.loading') }}</div>
                <div v-else-if="chatFiles.length === 0" class="pan-status">{{ $t('pan.from_chat_empty') }}</div>
                <div v-else class="pan-chat-file-list">
                    <div v-for="record in chatFiles" :key="record.messageUid" class="pan-chat-file-row" @click="saveChatFile(record)">
                        <span class="pan-file-icon">📄</span>
                        <div class="pan-file-info">
                            <div class="pan-file-name">{{ record.name }}</div>
                            <div class="pan-file-meta">{{ formatSize(record.size) }}</div>
                        </div>
                        <span class="pan-save-text">{{ $t('pan.save_to_pan') }}</span>
                    </div>
                </div>
                <div class="pan-dialog-actions">
                    <button class="pan-btn" @click="chatFilesVisible = false">{{ $t('pan.close') }}</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import wfc from '../../wfc/client/wfc';
import panApi from '../../api/panApi';
import {
    canWriteSpace,
    downloadByUrl,
    fileIconOf,
    formatPanSize,
    formatPanTime,
    isFolder,
    isInlineWebViewSupported,
    isOnlineDocName,
    isPanEnabled,
    saveStorageUrlToPan,
    spaceDisplayName,
    uploadPanFile,
} from './panUtil';
import PanNameDialog from './PanNameDialog.vue';
import PanShareDialog from './PanShareDialog.vue';

/**
 * 一个网盘空间里的文件列表：面包屑、返回上一级、新建文件夹、上传、
 * 下载、重命名、删除、分享、在线打开文档，以及把聊天里的文件转存到当前目录。
 * 只读空间（别人的公开空间）不显示新建/上传/改名/删除/分享。
 */
export default {
    name: 'PanFileListPage',
    components: {PanNameDialog, PanShareDialog},
    props: {
        // 作为网盘页的详情栏内嵌使用时，空间由父组件传进来
        embedded: {
            type: Boolean,
            default: false,
        },
        spaceId: {
            type: [Number, String],
            default: 0,
        },
        spaceName: {
            type: String,
            default: '',
        },
    },
    data() {
        return {
            enabled: isPanEnabled(),
            space: null,
            pathStack: [],
            files: [],
            loading: true,
            error: '',
            uploadTask: null,
            menuFile: null,
            menuStyle: {},
            newFolderVisible: false,
            renameFile: null,
            deleteFile: null,
            shareFile: null,
            chatFilesVisible: false,
            chatFilesLoading: false,
            chatFiles: [],
        };
    },
    computed: {
        folderId() {
            return this.pathStack.length ? this.pathStack[this.pathStack.length - 1].id : 0;
        },
        writable() {
            return canWriteSpace(this.space);
        },
        quotaRatio() {
            if (!this.space || !this.space.totalQuota) {
                return 0;
            }
            return Math.min(1, (this.space.usedQuota || 0) / this.space.totalQuota);
        },
        quotaPercent() {
            const ratio = this.quotaRatio;
            if (ratio > 0 && ratio < 0.01) {
                return '1%';
            }
            return (ratio * 100).toFixed(0) + '%';
        },
    },
    async mounted() {
        await this.init();
    },
    watch: {
        // 内嵌时由父组件切换空间
        spaceId() {
            if (this.embedded) {
                this.init();
            }
        },
        spaceName() {
            if (this.embedded && this.space) {
                this.pathStack[0].name = this.spaceName || this.pathStack[0].name;
            }
        },
    },
    methods: {
        /** 要打开的空间：内嵌取 props，路由模式取 query */
        targetSpaceId() {
            if (this.embedded || this.spaceId) {
                return Number(this.spaceId || 0);
            }
            return Number((this.$route.query || {}).spaceId || 0);
        },
        targetSpaceName() {
            if (this.embedded || this.spaceName) {
                return this.spaceName || '';
            }
            return (this.$route.query || {}).spaceName || '';
        },
        async init() {
            if (!this.enabled) {
                this.loading = false;
                return;
            }
            const spaceId = this.targetSpaceId();
            this.pathStack = [{id: 0, name: this.targetSpaceName() || this.$t('pan.title')}];
            this.files = [];
            this.error = '';
            this.loading = true;
            this.space = null;
            if (!spaceId) {
                this.error = this.$t('pan.space_missing');
                this.loading = false;
                return;
            }
            try {
                const spaces = await panApi.getSpaces();
                this.space = (spaces || []).find((s) => Number(s.id) === spaceId) || null;
            } catch (e) {
                this.error = e.message || this.$t('pan.load_failed');
            }
            if (!this.space) {
                this.error = this.error || this.$t('pan.space_missing');
                this.loading = false;
                return;
            }
            this.pathStack[0].name = spaceDisplayName(this.space, this.$t);
            if (!this.embedded) {
                document.title = this.pathStack[0].name;
            }
            this.load();
        },
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
        canOpenOnline(file) {
            return isOnlineDocName(file.name) && isInlineWebViewSupported();
        },
        async load() {
            if (!this.enabled || !this.space) {
                return;
            }
            this.loading = true;
            this.error = '';
            try {
                const files = await panApi.getSpaceFiles(this.space.id, this.folderId);
                // 文件夹排前面，其余保持服务端顺序
                const list = files || [];
                this.files = [
                    ...list.filter((f) => isFolder(f)),
                    ...list.filter((f) => !isFolder(f)),
                ];
            } catch (e) {
                this.error = e.message || this.$t('pan.load_failed');
            } finally {
                this.loading = false;
            }
        },
        async refreshSpace() {
            try {
                const spaces = await panApi.getSpaces();
                const updated = (spaces || []).find((s) => Number(s.id) === Number(this.space.id));
                if (updated) {
                    this.space = updated;
                }
            } catch (e) {
                // 容量刷新失败不影响主流程
            }
        },
        goBack() {
            if (this.pathStack.length > 1) {
                this.pathStack.pop();
                this.load();
                return;
            }
            if (this.embedded) {
                return;
            }
            this.$router.back();
        },
        goCrumb(index) {
            if (index >= this.pathStack.length - 1) {
                return;
            }
            this.pathStack = this.pathStack.slice(0, index + 1);
            this.load();
        },
        enter(folder) {
            this.menuFile = null;
            this.pathStack.push({id: folder.id, name: folder.name});
            this.load();
        },
        openEntry(file) {
            if (isFolder(file)) {
                this.enter(file);
                return;
            }
            if (this.canOpenOnline(file)) {
                this.openDoc(file);
                return;
            }
            this.download(file);
        },
        openDoc(file) {
            this.menuFile = null;
            if (this.embedded) {
                // 由父页面把文档放到详情栏里打开
                this.$emit('open-doc', {fileId: file.id, name: file.name, title: file.name});
                return;
            }
            this.$router.push({
                path: '/home/pan/doc-web',
                query: {fileId: file.id, name: file.name, title: file.name},
            });
        },
        async download(file) {
            this.menuFile = null;
            try {
                const res = await panApi.getDownloadUrl(file.id);
                downloadByUrl(res && res.storageUrl, file.name);
            } catch (e) {
                this.$notify({text: e.message || this.$t('pan.download_failed'), type: 'warn'});
            }
        },
        // ---- 上传 ----
        pickFiles() {
            this.$refs.fileInput.click();
        },
        async onFilesPicked(event) {
            const input = event.target;
            const picked = Array.from(input.files || []);
            input.value = '';
            if (!picked.length) {
                return;
            }
            let failed = 0;
            for (const file of picked) {
                this.uploadTask = {name: file.name, progress: 0};
                try {
                    await uploadPanFile(file, this.space.id, this.folderId, (progress) => {
                        if (this.uploadTask && this.uploadTask.name === file.name) {
                            this.uploadTask.progress = progress;
                        }
                    });
                } catch (e) {
                    failed++;
                    this.$notify({text: (e.message || this.$t('pan.upload_failed')) + ': ' + file.name, type: 'warn'});
                }
            }
            this.uploadTask = null;
            await this.load();
            this.refreshSpace();
            if (!failed) {
                this.$notify({text: this.$t('pan.upload_success'), type: 'info'});
            }
        },
        // ---- 新建 / 改名 / 删除 ----
        async createFolder(name) {
            this.newFolderVisible = false;
            try {
                await panApi.createFolder(this.space.id, name, this.folderId);
                await this.load();
                this.refreshSpace();
            } catch (e) {
                this.$notify({text: e.message || this.$t('pan.create_failed'), type: 'warn'});
            }
        },
        openRename(file) {
            this.menuFile = null;
            this.renameFile = file;
        },
        async doRename(name) {
            const file = this.renameFile;
            this.renameFile = null;
            if (!file || name === file.name) {
                return;
            }
            try {
                await panApi.renameFile(file.id, name);
                await this.load();
            } catch (e) {
                this.$notify({text: e.message || this.$t('pan.rename_failed'), type: 'warn'});
            }
        },
        askDelete(file) {
            this.menuFile = null;
            this.deleteFile = file;
        },
        async doDelete() {
            const file = this.deleteFile;
            this.deleteFile = null;
            try {
                await panApi.deleteFile(file.id);
                await this.load();
                this.refreshSpace();
            } catch (e) {
                this.$notify({text: e.message || this.$t('pan.delete_failed'), type: 'warn'});
            }
        },
        // ---- 分享 ----
        openShare(file) {
            this.menuFile = null;
            this.shareFile = file;
        },
        openMenu(file, event) {
            if (this.menuFile && this.menuFile.id === file.id) {
                this.menuFile = null;
                return;
            }
            this.menuFile = file;
            const rect = event.currentTarget.getBoundingClientRect();
            const menuHeight = 200;
            const top = Math.min(rect.bottom + 4, window.innerHeight - menuHeight);
            this.menuStyle = {
                top: Math.max(8, top) + 'px',
                left: Math.max(8, Math.min(rect.right - 160, window.innerWidth - 176)) + 'px',
            };
        },
        // ---- 从聊天文件保存 ----
        openChatFiles() {
            this.chatFilesVisible = true;
            this.chatFilesLoading = true;
            this.chatFiles = [];
            wfc.getMyFileRecords(0, 0, 30, (records) => {
                this.chatFiles = (records || []).filter((r) => r.url);
                this.chatFilesLoading = false;
            }, () => {
                this.chatFilesLoading = false;
                this.$notify({text: this.$t('pan.load_failed'), type: 'warn'});
            });
        },
        async saveChatFile(record) {
            try {
                await saveStorageUrlToPan({
                    name: record.name,
                    size: record.size,
                    storageUrl: record.url,
                    spaceId: this.space.id,
                    parentId: this.folderId,
                });
                this.chatFilesVisible = false;
                this.$notify({text: this.$t('pan.save_success'), type: 'info'});
                await this.load();
                this.refreshSpace();
            } catch (e) {
                this.$notify({text: e.message || this.$t('pan.save_failed'), type: 'warn'});
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
    gap: 4px;
    min-width: 0;
    flex: 1;
    overflow: hidden;
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

.pan-breadcrumb {
    display: flex;
    align-items: center;
    gap: 4px;
    overflow-x: auto;
    white-space: nowrap;
    font-size: var(--font-size-lg);
}

.pan-crumb {
    color: var(--text-secondary);
    text-decoration: none;
}

.pan-crumb:hover {
    color: var(--text-link);
}

.pan-crumb.current {
    color: var(--text-primary);
    font-weight: 600;
}

.pan-crumb-sep {
    color: var(--text-hint);
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

.pan-quota-strip,
.pan-upload-strip {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 16px;
    border-bottom: 1px solid var(--border-secondary);
    font-size: var(--font-size-xs);
    color: var(--text-hint);
    flex-shrink: 0;
}

.pan-quota {
    height: 4px;
    border-radius: 2px;
    background: var(--border-secondary);
    overflow: hidden;
    flex: 1;
}

.pan-quota.grow {
    flex: 1;
}

.pan-quota i {
    display: block;
    height: 100%;
    background: var(--accent-color);
}

.pan-quota i.danger {
    background: var(--text-danger);
}

.pan-quota-text,
.pan-upload-percent {
    flex-shrink: 0;
}

.pan-upload-name {
    max-width: 40%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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

.pan-hidden-input {
    display: none;
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

.pan-mask {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--background-overlay);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 3000;
}

.pan-confirm,
.pan-dialog {
    width: 420px;
    max-width: calc(100vw - 48px);
    max-height: 72vh;
    display: flex;
    flex-direction: column;
    background: var(--background-modal);
    border-radius: var(--radius-lg);
    padding: 20px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.24);
}

.pan-confirm p {
    margin: 4px 0 18px;
    font-size: var(--font-size-base);
    color: var(--text-primary);
    word-break: break-all;
}

.pan-confirm-actions,
.pan-dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}

.pan-dialog-title {
    font-size: var(--font-size-lg);
    font-weight: 600;
    margin-bottom: 12px;
}

.pan-chat-file-list {
    flex: 1;
    overflow-y: auto;
    min-height: 120px;
}

.pan-chat-file-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 4px;
    border-bottom: 1px solid var(--border-subtle);
    cursor: pointer;
}

.pan-chat-file-row:hover {
    background: var(--background-item-hover);
}

.pan-save-text {
    font-size: var(--font-size-sm);
    color: var(--text-link);
    flex-shrink: 0;
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

.pan-btn:hover {
    background: var(--background-item-hover);
}

.pan-btn.danger {
    color: var(--text-danger);
    border-color: var(--text-danger);
}
</style>
