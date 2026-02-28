<template>
    <div class="collection-message-container" @click="onClick" :class="{out: message.direction === 0}">
        <!-- Header: Icon + Title + Count -->
        <div class="msg-header">
            <i class="icon-ion-ios-list-outline collection-icon" :class="{out: message.direction === 0}"></i>
            <div class="title-container">
                <div class="title">{{ message.messageContent.title }}</div>
            </div>
            <div class="count">{{ formatCount($t('collection.collection_participant_count'), participantCount) }}</div>
        </div>

        <!-- Description (Optional) -->
        <div class="desc" v-if="message.messageContent.desc">{{ message.messageContent.desc }}</div>

        <div class="divider"></div>

        <!-- Entries Preview -->
        <div class="entries-container">
            <div v-if="previewEntries.length === 0" class="empty-hint">
                {{ $t('collection.collection_empty_hint') }}
            </div>
            <div v-else class="entry-list">
                <div v-for="(entry, index) in previewEntries" :key="index" class="entry-item">
                    <span class="entry-text">{{ index + 1 }}. {{ entry.content }}</span>
                </div>
            </div>
            <div v-if="remainingCount > 0" class="more-hint">
                {{ formatCount($t('collection.collection_more_participants'), remainingCount) }}
            </div>
        </div>

        <div class="divider"></div>

        <!-- Footer Action -->
        <div class="footer">
            <span class="action-text" :class="{ended: status !== 0}">{{ actionText }}</span>
        </div>
    </div>
</template>

<script>
import Message from "../../../../../wfc/messages/message";
import IpcEventType from "../../../../../ipcEventType";
import {ipcRenderer, isElectron} from '../../../../../platform';
import Config from '../../../../../config'
import { buildCollectionUrl } from '../../../../../platformHelper';
import { openInAppSubWindow } from '../../../../util/subWindowNavigator';

export default {
    name: "CollectionMessageContentView",
    props: {
        message: {
            type: Message,
            required: true,
        }
    },
    computed: {
        entries() {
            return this.message.messageContent.entries || [];
        },
        participantCount() {
            // Filter out deleted entries if needed, but Android seems to just use list size or dedicated count field
            // Assuming entries list is the source of truth for preview
            return this.entries.length;
        },
        previewEntries() {
            // Show top 5
            return this.entries.slice(0, 5);
        },
        remainingCount() {
            return Math.max(0, this.entries.length - 5);
        },
        status() {
            return this.message.messageContent.status;
        },
        actionText() {
            if (this.status === 1) return this.$t('collection.collection_status_ended');
            if (this.status === 2) return this.$t('collection.collection_status_cancelled');
            return this.$t('collection.collection_join_action');
        }
    },
    methods: {
        formatCount(template, count) {
            return String(template).replace('%d', count);
        },
        onClick() {
            if(!Config.COLLECTION_SERVER){
                this.$notify({
                    text: '未配置接龙服务地址',
                    type: 'error',
                })
                return;
            }
            if (!isElectron()) {
                openInAppSubWindow(this, '/collection/detail', {
                    collectionId: this.message.messageContent.collectionId,
                    groupId: this.message.messageContent.groupId
                });
                return;
            }
            const url = buildCollectionUrl({
                mode: 'detail',
                collectionId: this.message.messageContent.collectionId,
                groupId: this.message.messageContent.groupId
            });
            ipcRenderer.send(IpcEventType.SHOW_COLLECTION_WINDOW, {
                url: url,
                collectionId: this.message.messageContent.collectionId,
                groupId: this.message.messageContent.groupId
            });
        }
    }
}
</script>

<style scoped>
.collection-message-container {
    margin: 0 10px;
    background-color: white;
    border-radius: 5px;
    cursor: pointer;
    width: 280px; /* Slightly wider for list content */
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.collection-message-container.out {
    background-color: #a8bdff; /* Match bubble color */
}

/* Header */
.msg-header {
    padding: 10px 12px 5px 12px;
    display: flex;
    align-items: flex-start;
}
.collection-icon {
    font-size: 20px;
    margin-right: 8px;
    color: #576b95;
    margin-top: 2px;
}
.collection-icon.out {
    color: #333; /* Darker on blue bg */
}
.title-container {
    flex: 1;
    margin-right: 8px;
}
.title {
    font-weight: bold;
    font-size: 15px;
    line-height: 1.4;
    color: #333;
}
.count {
    font-size: 11px;
    color: #888;
    white-space: nowrap;
    margin-top: 4px;
}
.collection-message-container.out .count {
    color: #555;
}

/* Description */
.desc {
    font-size: 13px;
    color: #666;
    padding: 0 12px 8px 12px; /* Indent to align with title */
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}
.collection-message-container.out .desc {
    color: #444;
}

.divider {
    height: 1px;
    background-color: rgba(0,0,0,0.05);
    margin: 0 12px;
}

/* Entries */
.entries-container {
    padding: 8px 12px;
    min-height: 20px;
}
.empty-hint {
    font-size: 13px;
    color: #999;
    text-align: center;
    padding: 10px 0;
}
.collection-message-container.out .empty-hint {
    color: #666;
}
.entry-list {
    display: flex;
    flex-direction: column;
}
.entry-item {
    font-size: 13px;
    color: #333;
    padding: 2px 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.more-hint {
    font-size: 12px;
    color: #888;
    margin-top: 4px;
}
.collection-message-container.out .more-hint {
    color: #555;
}

/* Footer */
.footer {
    padding: 8px 12px;
    font-size: 13px;
    color: #576b95;
    border-top: 1px solid rgba(0,0,0,0.05);
    display: flex;
    justify-content: flex-start;
}
.collection-message-container.out .footer {
    color: #333;
    border-top-color: rgba(0,0,0,0.1);
}
.action-text.ended {
    color: #999;
}
</style>
