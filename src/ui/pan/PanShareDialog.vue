<template>
    <div class="pan-mask" @click.self="$emit('close')">
        <div class="pan-dialog">
            <div class="pan-dialog-header">
                <span class="pan-dialog-title">{{ $t('pan.share_title', {name: fileName}) }}</span>
                <button class="pan-close" @click="$emit('close')">×</button>
            </div>

            <div class="pan-dialog-toolbar">
                <select v-model="permission" class="pan-select">
                    <option value="VIEW">{{ $t('pan.permission_view') }}</option>
                    <option value="EDIT">{{ $t('pan.permission_edit') }}</option>
                </select>
                <button class="pan-btn" @click="pickUsers">{{ $t('pan.add_member') }}</button>
                <button class="pan-btn" @click="pickGroup">{{ $t('pan.add_group') }}</button>
            </div>

            <div class="pan-share-list">
                <div v-if="loading" class="pan-dialog-empty">{{ $t('common.loading') || '加载中…' }}</div>
                <div v-else-if="shares.length === 0" class="pan-dialog-empty">{{ $t('pan.share_empty') }}</div>
                <div v-for="share in shares" :key="share.id" class="pan-share-row">
                    <span class="pan-share-avatar" :class="{group: share.targetType === 'GROUP'}">
                        {{ share.targetType === 'GROUP' ? '群' : (share.targetName || '?').slice(0, 1) }}
                    </span>
                    <div class="pan-share-info">
                        <span class="pan-share-name">{{ share.targetName || share.targetId }}</span>
                        <span class="pan-share-meta">
                            {{ share.targetType === 'GROUP' ? $t('pan.group') : $t('pan.member') }} ·
                            {{ share.createdByName || share.createdBy }} · {{ formatTime(share.createdAt) }}
                        </span>
                    </div>
                    <select class="pan-select small" :value="share.permission" @change="changePermission(share, $event.target.value)">
                        <option value="VIEW">{{ $t('pan.permission_view') }}</option>
                        <option value="EDIT">{{ $t('pan.permission_edit') }}</option>
                    </select>
                    <button class="pan-link danger" @click="removeShare(share)">{{ $t('pan.remove') }}</button>
                </div>
            </div>

            <div class="pan-dialog-hint">{{ $t('pan.share_group_hint') }}</div>
        </div>

        <PanPickGroupDialog
            v-if="groupPickerVisible"
            :groups="groups"
            @confirm="onGroupsPicked"
            @cancel="groupPickerVisible = false"/>
    </div>
</template>

<script>
import panApi from '../../api/panApi';
import wfc from '../../wfc/client/wfc';
import {formatPanTime, loadMyGroups} from './panUtil';
import PanPickGroupDialog from './PanPickGroupDialog.vue';

/**
 * 分享网盘文件：成员 / 群两类目标，可选「可查看 / 可编辑」。
 * 重复添加同一个目标是覆盖权限，不是新增一条记录（服务端语义）。
 */
export default {
    name: 'PanShareDialog',
    components: {PanPickGroupDialog},
    props: {
        fileId: {
            type: Number,
            required: true,
        },
        fileName: {
            type: String,
            default: '',
        },
    },
    data() {
        return {
            shares: [],
            loading: true,
            permission: 'VIEW',
            groups: [],
            groupPickerVisible: false,
        };
    },
    mounted() {
        this.reload();
    },
    methods: {
        formatTime(value) {
            return formatPanTime(value, this.$t);
        },
        async reload() {
            this.loading = true;
            try {
                this.shares = (await panApi.listShares(this.fileId)) || [];
            } catch (e) {
                this.$notify({text: e.message || this.$t('pan.share_load_failed'), type: 'warn'});
            } finally {
                this.loading = false;
            }
        },
        pickUsers() {
            this.$pickContact({
                title: this.$t('pan.add_member'),
                successCB: (users) => this.addTargets('USER', users.map((u) => ({id: u.uid, name: u.displayName || u.name || u.uid}))),
                failCB: () => {},
            });
        },
        async pickGroup() {
            this.groups = await loadMyGroups();
            this.groupPickerVisible = true;
        },
        onGroupsPicked(groups) {
            this.groupPickerVisible = false;
            this.addTargets('GROUP', groups.map((g) => ({id: g.gid, name: g.name})));
        },
        async addTargets(targetType, targets) {
            try {
                const selfUserId = wfc.getUserId();
                for (const target of targets) {
                    if (targetType === 'USER' && target.id === selfUserId) {
                        continue;
                    }
                    await panApi.addShare(this.fileId, targetType, target.id, this.permission);
                }
                await this.reload();
            } catch (e) {
                this.$notify({text: e.message || this.$t('pan.share_failed'), type: 'warn'});
                this.reload();
            }
        },
        async changePermission(share, permission) {
            try {
                await panApi.addShare(this.fileId, share.targetType, share.targetId, permission);
                share.permission = permission;
            } catch (e) {
                this.$notify({text: e.message || this.$t('pan.share_failed'), type: 'warn'});
                this.reload();
            }
        },
        async removeShare(share) {
            try {
                await panApi.removeShare(share.id);
                this.shares = this.shares.filter((s) => s.id !== share.id);
            } catch (e) {
                this.$notify({text: e.message || this.$t('pan.share_failed'), type: 'warn'});
            }
        },
    },
};
</script>

<style scoped>
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

.pan-dialog {
    width: 520px;
    max-width: calc(100vw - 48px);
    max-height: 76vh;
    display: flex;
    flex-direction: column;
    background: var(--background-modal);
    border-radius: var(--radius-lg);
    padding: 20px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.24);
}

.pan-dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
}

.pan-dialog-title {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.pan-close {
    border: none;
    background: transparent;
    color: var(--text-hint);
    font-size: var(--font-size-2xl);
    cursor: pointer;
    line-height: 1;
}

.pan-dialog-toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--border-secondary);
}

.pan-select {
    height: 32px;
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-sm);
    background: var(--background-input);
    color: var(--text-primary);
    font-size: var(--font-size-sm);
    padding: 0 6px;
    outline: none;
}

.pan-select.small {
    height: 28px;
}

.pan-share-list {
    flex: 1;
    overflow-y: auto;
    min-height: 100px;
    padding: 6px 0;
}

.pan-dialog-empty {
    color: var(--text-hint);
    font-size: var(--font-size-sm);
    text-align: center;
    padding: 24px 0;
}

.pan-share-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 4px;
    border-radius: var(--radius-sm);
}

.pan-share-row:hover {
    background: var(--background-item-hover);
}

.pan-share-avatar {
    width: 32px;
    height: 32px;
    border-radius: var(--radius-md);
    background: var(--background-item-selected);
    color: var(--text-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--font-size-sm);
    flex-shrink: 0;
}

.pan-share-avatar.group {
    background: var(--background-item-active);
}

.pan-share-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
}

.pan-share-name {
    font-size: var(--font-size-base);
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.pan-share-meta {
    font-size: var(--font-size-xs);
    color: var(--text-hint);
}

.pan-link {
    border: none;
    background: transparent;
    color: var(--text-link);
    font-size: var(--font-size-sm);
    cursor: pointer;
}

.pan-link.danger {
    color: var(--text-danger);
}

.pan-dialog-hint {
    font-size: var(--font-size-xs);
    color: var(--text-hint);
    padding-top: 10px;
    border-top: 1px solid var(--border-secondary);
}

.pan-btn {
    height: 32px;
    padding: 0 14px;
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-primary);
    font-size: var(--font-size-sm);
    cursor: pointer;
}

.pan-btn:hover {
    background: var(--background-item-hover);
}
</style>
