<template>
    <div
        class="poll-result-message-container"
        @click="onClick"
        :class="{ out: message.direction === 0 }"
    >
        <!-- 标题 -->
        <div class="poll-result-title">
            <span class="poll-icon">📊</span>
            <span class="poll-title-text">{{
                message.messageContent.title
            }}</span>
        </div>

        <!-- 统计信息 -->
        <div class="poll-result-stats">
            {{ statsText }}
        </div>

        <!-- 状态 -->
        <div class="poll-result-status" :class="{ ended: isEnded }">
            {{ statusText }}
        </div>
    </div>
</template>

<script>
import Message from "../../../../../wfc/messages/message";
import IpcEventType from "../../../../../ipcEventType";
import Config from "../../../../../config";
import { buildPollUrl } from "../../../../../platformHelper";
import { ipcRenderer, isElectron } from '../../../../../platform';
import { openInAppSubWindow } from '../../../../util/subWindowNavigator';

export default {
    name: "PollResultMessageContentView",
    props: {
        message: {
            type: Message,
            required: true,
        },
    },
    computed: {
        content() {
            return this.message.messageContent;
        },
        isEnded() {
            return this.content.status === 1;
        },
        statsText() {
            const totalVotes = this.content.totalVotes || 0;
            const voterCount = this.content.voterCount || 0;
            return this.$t("poll.result_stats", { totalVotes, voterCount });
        },
        statusText() {
            if (this.isEnded) {
                return this.$t("poll.poll_ended");
            }
            return this.$t("poll.poll_updated");
        },
    },
    methods: {
        onClick() {
            if (!Config.POLL_SERVER) {
                this.$notify({
                    text: "未配置投票服务地址",
                    type: "error",
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
            // 点击结果消息也进入投票详情
            const url = buildPollUrl({
                mode: "detail",
                pollId: this.content.pollId,
                groupId: this.content.groupId,
                fromMessage: true,
            });
            ipcRenderer.send(IpcEventType.SHOW_POLL_WINDOW, {
                url:url,
            });
        },
    },
};
</script>

<style scoped>
.poll-result-message-container {
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

.poll-result-message-container.out {
    background-color: #a8bdff;
}

.poll-result-title {
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

.poll-result-message-container.out .poll-result-title {
    color: #000;
}

.poll-result-stats {
    font-size: 12px;
    color: #888;
    margin-top: 8px;
}

.poll-result-message-container.out .poll-result-stats {
    color: #555;
}

.poll-result-status {
    font-size: 12px;
    color: #576b95;
    margin-top: 4px;
}

.poll-result-message-container.out .poll-result-status {
    color: #333;
}

.poll-result-status.ended {
    color: #999;
}

.poll-result-message-container.out .poll-result-status.ended {
    color: #666;
}
</style>
