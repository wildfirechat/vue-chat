<template>
    <div class="collection-detail">
        <!-- Header -->
        <header v-if="!isElectron" class="page-header">
            <div class="header-left">
                <span class="back-btn" @click="closeWindow">{{ $t('common.back') }}</span>
            </div>
            <div class="header-title">{{ $t('collection.collection_detail') }}</div>
            <div class="header-right"></div>
        </header>

        <div v-if="loading && !collection" class="loading-state">
            <div class="spinner"></div>
            <p>{{ $t('collection.loading') }}</p>
        </div>
        <div v-else-if="error" class="error-state">
            <i class="icon-error"></i>
            <p>{{ error }}</p>
        </div>

        <div v-else-if="collection" class="detail-content">
            <div class="detail-header">
                <div class="creator-info">
                    <img :src="getAvatar(collection.creatorId)" class="creator-avatar" alt="">
                    <div class="creator-text">
                        <span class="creator-name">{{ getCreatorName(collection.creatorId) }}</span>
                        <span class="meta-info">{{ $t('collection.collection_meta_info', { count: collection.participantCount || 0 }) }}</span>
                    </div>
                </div>
                <div class="collection-title">{{ collection.title }}</div>
                <div v-if="collection.desc || collection.description" class="collection-desc">{{ collection.desc ? collection.desc : collection.description }}</div>
                <div v-if="collection.template" class="collection-template">{{ $t('collection.collection_template') }}: {{ collection.template }}</div>
            </div>

            <div class="divider"></div>

            <div class="entry-list">
                <div v-for="(item, index) in displayEntries" :key="index" class="entry-item">
                    <div class="index-badge">{{ item.index }}</div>

                    <!-- Edit Mode -->
                    <div v-if="item.isEdit" class="entry-content edit-mode">
                        <textarea
                            ref="editInput"
                            v-model="myEntryContent"
                            :placeholder="collection.template || $t('collection.collection_join_hint')"
                            class="edit-input"
                            rows="1"
                            @input="autoResize"
                            @keydown.enter.prevent="onSubmit"
                        ></textarea>
                    </div>

                    <!-- View Mode -->
                    <div v-else class="entry-content view-mode">
                        <span class="entry-text">{{ item.content }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Floating Footer Button -->
        <div class="floating-footer" v-if="collection">
            <button class="action-btn" :disabled="!canSubmit" @click="onSubmit">
                {{ $t('collection.done') }}
            </button>
        </div>
    </div>
</template>

<script>
import collectionApi from "../../api/collectionApi";
import wfc from "../../wfc/client/wfc";
import store from "../../store";
import { closeInAppSubWindowOrWindow, getSubWindowQuery } from '../util/subWindowNavigator';

export default {
    name: "CollectionDetail",
    props: {
        subWindowQuery: {
            type: Object,
            required: false,
            default: null,
        }
    },
    data() {
        return {
            loading: false,
            error: null,
            groupId: '',
            collectionId: null,
            collection: null,
            myEntryContent: '',
            originalEntryContent: '',
            sharedMiscState: store.state.misc,
        };
    },
    computed: {
        isElectron() {
            return this.sharedMiscState.isElectron;
        },
        selfUid() {
            return wfc.getUserId();
        },
        hasJoined() {
            if (!this.collection || !this.collection.entries) return false;
            return this.collection.entries.some(e => e.userId === this.selfUid);
        },
        myEntryIndex() {
            if (!this.collection || !this.collection.entries) return -1;
            return this.collection.entries.findIndex(e => e.userId === this.selfUid);
        },
        displayEntries() {
            if (!this.collection) return [];
            let entries = [];
            let rawEntries = this.collection.entries || [];

            // Map existing entries
            rawEntries.forEach((e, i) => {
                let isMe = e.userId === this.selfUid;
                entries.push({
                    index: i + 1,
                    isEdit: isMe && this.collection.status === 0,
                    content: e.content,
                    userId: e.userId,
                    avatar: this.getAvatar(e.userId),
                    timestamp: e.timestamp
                });
            });

            // If not joined and active, add new row
            if (!this.hasJoined && this.collection.status === 0) {
                entries.push({
                    index: rawEntries.length + 1,
                    isEdit: true,
                    content: '',
                    userId: this.selfUid,
                    avatar: this.getAvatar(this.selfUid),
                    timestamp: Date.now()
                });
            }

            return entries;
        },
        canSubmit() {
            if (!this.collection) return false;
            let current = this.myEntryContent.trim();
            let original = this.originalEntryContent.trim();
            return current !== original;
        }
    },
    mounted() {
        document.title = this.$t('collection.collection_detail');
        
        let query = getSubWindowQuery(this);
        this.collectionId = query.collectionId;
        this.groupId = query.groupId || '';
        this.fetchCollection();
    },
    methods: {
        async fetchCollection() {
            this.loading = true;
            try {
                this.collection = await collectionApi.getCollection(this.collectionId, this.groupId);
                if (!this.collection.entries) {
                    this.collection.entries = [];
                }
                if (!this.groupId && this.collection.groupId) {
                    this.groupId = this.collection.groupId;
                }
                this.updateMyEntryState();
            } catch (e) {
                this.error = this.$t('collection.collection_load_failed') + ': ' + e.message;
            } finally {
                this.loading = false;
            }
        },
        updateMyEntryState() {
            if (this.hasJoined) {
                let entry = this.collection.entries[this.myEntryIndex];
                this.myEntryContent = entry.content;
                this.originalEntryContent = entry.content;
            } else {
                this.myEntryContent = '';
                this.originalEntryContent = '';
                // Auto fill name
                let userInfo = wfc.getUserInfo(this.selfUid, false);
                let name = userInfo.displayName || userInfo.name;
                if (name) {
                    this.myEntryContent = name + ' ';
                    this.$nextTick(() => this.autoResize({target: this.$refs.editInput?.[0] || this.$refs.editInput}));
                }
            }
        },
        async onSubmit() {
            let content = this.myEntryContent.trim();
            if (content === this.originalEntryContent && content !== '') return;

            this.loading = true;
            try {
                if (this.hasJoined && content === '') {
                    // Delete
                    if(confirm(this.$t('collection.confirm_delete_entry'))) {
                        await collectionApi.deleteCollectionEntry(this.collectionId, this.groupId);
                    } else {
                        this.loading = false;
                        return;
                    }
                } else {
                    // Join or Update
                    await collectionApi.joinCollection(this.collectionId, this.groupId, content);
                }
                await this.fetchCollection();
                this.closeWindow();
            } catch (e) {
                alert(this.$t('collection.operation_failed') + ': ' + e.message);
            } finally {
                this.loading = false;
            }
        },
        closeWindow() {
            closeInAppSubWindowOrWindow(this);
        },
        getCreatorName(userId) {
            return wfc.getUserDisplayName(userId);
        },
        getAvatar(userId) {
            let userInfo = wfc.getUserInfo(userId, false);
            return userInfo.portrait;
        },
        autoResize(event) {
            if (!event || !event.target) return;
            event.target.style.height = 'auto';
            event.target.style.height = event.target.scrollHeight + 'px';
        }
    }
}
</script>

<style scoped>
.collection-detail {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    height: 100vh;
    background-color: var(--background-tertiary);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    color: var(--text-primary);
    user-select: none;
}

/* Header */
.page-header {
    height: 50px;
    background: var(--background-primary);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    border-bottom: 1px solid var(--border-primary);
    -webkit-app-region: drag;
    flex-shrink: 0;
    z-index: 10;
}
.header-left, .header-right {
    width: 80px;
    -webkit-app-region: no-drag;
}
.header-right {
    text-align: right;
}
.header-title {
    font-weight: 600;
    font-size: 16px;
    color: var(--text-primary);
}
.back-btn {
    cursor: pointer;
    font-size: 14px;
    color: var(--text-muted);
    padding: 5px 0;
}
.back-btn:hover {
    color: var(--text-primary);
}

.loading-state, .error-state {
    padding: 60px;
    text-align: center;
    color: var(--text-hint);
}
.spinner {
    border: 3px solid var(--background-trans-muted);
    width: 30px;
    height: 30px;
    border-radius: 50%;
    border-left-color: var(--accent-color);
    animation: spin 1s linear infinite;
    margin: 0 auto 10px;
}
@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
.error-state {
    color: var(--text-danger);
}

/* Detail Mode */
.detail-content {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    padding-bottom: 80px;
    background: var(--background-primary);
    width: 100%;
}
.detail-header {
    background: var(--background-primary);
    padding: 24px 24px 16px 24px;
}
.creator-info {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
}
.creator-avatar {
    width: 36px;
    height: 36px;
    border-radius: 4px;
    margin-right: 12px;
}
.creator-text {
    display: flex;
    flex-direction: column;
}
.creator-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
}
.meta-info {
    font-size: 12px;
    color: var(--text-hint);
    margin-top: 2px;
}
.collection-title {
    font-size: 24px;
    font-weight: bold;
    color: var(--text-primary);
    margin-bottom: 12px;
    line-height: 1.3;
}
.collection-desc {
    font-size: 15px;
    color: var(--text-muted);
    margin-bottom: 12px;
    white-space: pre-wrap;
    line-height: 1.6;
}
.collection-template {
    font-size: 13px;
    color: var(--accent-color);
    background: var(--background-item-selected);
    display: inline-block;
    padding: 4px 8px;
    border-radius: 4px;
}
.divider {
    height: 8px;
    background: var(--background-tertiary);
    flex-shrink: 0;
}

/* Entry List */
.entry-list {
    background: var(--background-primary);
    flex: 1;
    padding: 10px 0;
}
.entry-item {
    display: flex;
    align-items: flex-start;
    padding: 16px 24px;
    border-bottom: 1px solid var(--border-secondary);
    transition: background 0.2s;
}
.entry-item:hover {
    background: var(--background-secondary);
}
.index-badge {
    width: 24px;
    height: 24px;
    background: var(--background-secondary);
    color: var(--text-link);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
    margin-right: 16px;
    flex-shrink: 0;
    margin-top: 4px;
}

.entry-content {
    flex: 1;
    display: flex;
    align-items: flex-start;
}
.view-mode {
    align-items: center;
}
.entry-text {
    flex: 1;
    font-size: 16px;
    color: var(--text-primary);
    line-height: 1.6;
    word-break: break-word;
}

.edit-input {
    width: 100%;
    border: 1px solid var(--border-primary);
    border-radius: 6px;
    padding: 10px 12px;
    font-size: 16px;
    line-height: 1.5;
    outline: none;
    resize: none;
    background: var(--background-primary);
    font-family: inherit;
    color: var(--text-primary);
    box-shadow: var(--shadow-accent-focus);
    border-color: var(--accent-color);
}

/* Floating Footer */
.floating-footer {
    position: absolute;
    bottom: 24px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    pointer-events: none;
}
.action-btn {
    pointer-events: auto;
    background: var(--accent-color);
    color: var(--text-on-accent);
    border: none;
    padding: 12px 60px;
    border-radius: 24px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: var(--shadow-accent);
    transition: transform 0.1s, box-shadow 0.2s, background 0.2s;
}
.action-btn:hover {
    background: var(--status-info);
    transform: translateY(-1px);
    box-shadow: var(--shadow-accent-strong);
}
.action-btn:active {
    transform: translateY(1px);
    box-shadow: var(--shadow-accent);
}
.action-btn:disabled {
    background: var(--accent-color-subtle);
    box-shadow: none;
    cursor: default;
    transform: none;
}
</style>
