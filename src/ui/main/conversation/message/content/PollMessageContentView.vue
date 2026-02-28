<template>
    <div class="poll-message-container" @click="onClick" :class="{out: message.direction === 0}">
        <!-- 标题 -->
        <div class="poll-title">
            <span class="poll-icon">🗳️</span>
            <span class="poll-title-text">{{ message.messageContent.title }}</span>
        </div>

        <!-- 描述 -->
        <div class="poll-desc" v-if="message.messageContent.desc">
            {{ message.messageContent.desc }}
        </div>

        <!-- 信息行 -->
        <div class="poll-info">
            {{ infoText }}
        </div>

        <!-- 操作按钮 -->
        <div class="poll-action" :class="{ended: isEnded}">
            {{ actionText }}
        </div>
    </div>
</template>

<script>
import Message from "../../../../../wfc/messages/message";
import IpcEventType from "../../../../../ipcEventType";
import Config from '../../../../../config'
import { buildPollUrl } from '../../../../../platformHelper';
import { ipcRenderer, isElectron } from '../../../../../platform';
import { openInAppSubWindow } from '../../../../util/subWindowNavigator';

export default {
    name: "PollMessageContentView",
    props: {
        message: {
            type: Message,
            required: true,
        }
    },
    computed: {
        content() {
            return this.message.messageContent;
        },
        isEnded() {
            return this.content.status === 1 || this.isExpired;
        },
        isExpired() {
            if (this.content.endTime > 0) {
                return this.content.endTime < Date.now();
            }
            return false;
        },
        infoText() {
            const parts = [];
            if (this.content.status === 1) {
                parts.push(this.$t('poll.poll_ended'));
            } else if (this.isExpired) {
                parts.push(this.$t('poll.poll_expired'));
            } else {
                parts.push(this.$t('poll.poll_in_progress'));
            }

            if (this.content.anonymous === 1) {
                parts.push(this.$t('poll.anonymous_poll'));
            } else {
                parts.push(this.$t('poll.named_poll'));
            }

            return parts.join(' · ');
        },
        actionText() {
            if (this.isEnded) {
                return this.$t('poll.poll_ended');
            }
            return this.$t('poll.click_to_vote');
        }
    },
    methods: {
        onClick() {
            if (!Config.POLL_SERVER) {
                this.$notify({
                    text: '未配置投票服务地址',
                    type: 'error',
                });
                return;
            }
            if (!isElectron()) {
                openInAppSubWindow(this, '/poll/detail', {
                    pollId: this.content.pollId,
                    groupId: this.content.groupId,
                    fromMessage: '1'
                });
                return;
            }
            // 从消息点击进入详情页，标记 fromMessage 用于区分投票场景
            const url = buildPollUrl({
                mode: 'detail',
                pollId: this.content.pollId,
                groupId: this.content.groupId,
                fromMessage: true
            });
            ipcRenderer.send(IpcEventType.SHOW_POLL_WINDOW, {
                url: url,
            });
        }
    }
}
</script>

<style scoped>
.poll-message-container {
    margin: 0 10px;
    background-color: white;
    border-radius: 5px;
    cursor: pointer;
    width: 240px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 12px;
}

.poll-message-container.out {
    background-color: #a8bdff;
}

.poll-title {
    display: flex;
    align-items: flex-start;
    font-size: 14px;
    font-weight: bold;
    color: #000;
    line-height: 1.4;
}

.poll-icon {
    margin-right: 4px;
    flex-shrink: 0;
}

.poll-title-text {
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

.poll-message-container.out .poll-title {
    color: #000;
}

.poll-desc {
    font-size: 12px;
    color: #888;
    margin-top: 8px;
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

.poll-message-container.out .poll-desc {
    color: #555;
}

.poll-info {
    font-size: 11px;
    color: #888;
    margin-top: 8px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.poll-message-container.out .poll-info {
    color: #555;
}

.poll-action {
    font-size: 12px;
    color: #576b95;
    margin-top: 4px;
}

.poll-message-container.out .poll-action {
    color: #333;
}

.poll-action.ended {
    color: #999;
}

.poll-message-container.out .poll-action.ended {
    color: #666;
}
</style>
