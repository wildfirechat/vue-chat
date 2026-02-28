<template>
    <div class="poll-detail">
        <div v-if="loading && !poll" class="loading-state">
            <div class="spinner"></div>
            <p>{{ $t('common.loading') }}</p>
        </div>
        <div v-else-if="error" class="error-state">
            <i class="icon-error"></i>
            <p>{{ error }}</p>
        </div>

        <div v-else-if="poll" class="detail-content">
            <!-- 管理场景返回按钮 -->
            <div v-if="isManagerMode" class="detail-nav-bar">
                <span class="back-btn" @click="goBack">&#8249; {{ $t('common.back') }}</span>
            </div>
            <!-- 头部信息 -->
            <div class="detail-header">
                <div class="creator-info">
                    <img :src="getAvatar(poll.creatorId)" class="creator-avatar" alt="">
                    <div class="creator-text">
                        <span class="creator-name">{{ $t('poll.creator_format', {name: getCreatorName(poll.creatorId)}) }}</span>
                    </div>
                    <span class="status-tag" :class="{ended: isEnded}">{{ statusText }}</span>
                </div>
                <div class="poll-title">{{ poll.title }}</div>
                <div v-if="poll.desc || poll.description" class="poll-desc">{{ poll.desc ? poll.desc : poll.description }}</div>
            </div>

            <div class="divider"></div>

            <!-- 选项标题 -->
            <div class="options-section-title">{{ optionsSectionTitle }}</div>

            <!-- 选项列表 -->
            <div class="options-list vote-options">
                <div v-for="option in poll.options" :key="option.id"
                     class="vote-option-item"
                     :class="{selected: isOptionSelected(option.id), disabled: !canVote}"
                     @click="toggleOption(option.id)">

                    <!-- 进度条背景 -->
                    <div v-if="shouldShowResult" class="progress-bar" :style="{width: option.votePercent + '%'}"></div>

                    <!-- 选择框（仅在投票场景显示） -->
                    <div v-if="canVote" class="check-box">
                        <div class="check-circle" :class="{checked: isOptionSelected(option.id)}">
                            <span v-if="isOptionSelected(option.id)">✓</span>
                        </div>
                    </div>

                    <!-- 选项文字 -->
                    <div class="option-text" :class="{'with-checkbox': canVote}">{{ option.optionText }}</div>

                    <!-- 票数 -->
                    <div v-if="shouldShowResult" class="vote-count">
                        {{ $t('poll.vote_count_format', {percent: option.votePercent, count: option.voteCount}) }}
                    </div>
                </div>
            </div>

            <!-- 底部状态 -->
            <div class="detail-footer">
                <span>{{ footerStatusText }}</span>
            </div>
        </div>

        <!-- 底部操作栏 -->
        <div class="floating-footer" v-if="poll">
            <!-- 投票场景：提交按钮 -->
            <button v-if="canVote" class="action-btn" :disabled="selectedOptions.length === 0" @click="submitVote">
                {{ $t('poll.submit_vote') }}
            </button>

            <!-- 管理场景：导出/结束/删除按钮 -->
            <template v-else-if="isManagerMode">
                <button v-if="!isAnonymous && !isEnded" class="secondary-btn" @click="exportDetails">
                    {{ $t('poll.export_details') }}
                </button>
                <button v-if="!isEnded" class="danger-btn" @click="closePoll">
                    {{ $t('poll.end_poll') }}
                </button>
                <button v-else class="danger-btn" @click="deletePoll">
                    {{ $t('poll.delete_poll') }}
                </button>
            </template>
        </div>
    </div>
</template>

<script>
import pollApi from "../../api/pollApi";
import wfc from "../../wfc/client/wfc";
import Config from "../../config";

export default {
    name: "PollDetail",
    data() {
        return {
            loading: false,
            error: null,
            groupId: '',
            pollId: null,
            poll: null,
            selectedOptions: [],
            fromMessage: false
        };
    },
    computed: {
        isEnded() {
            if (!this.poll) return false;
            if (this.poll.status === 1) return true;
            if (this.poll.endTime > 0 && this.poll.endTime < Date.now()) return true;
            return false;
        },
        isAnonymous() {
            return this.poll && this.poll.anonymous === 1;
        },
        /**
         * 是否是管理场景
         * 从消息点击进入：投票场景
         * 从列表点击进入且是创建者：管理场景
         */
        isManagerMode() {
            return this.poll && this.poll.isCreator && !this.fromMessage;
        },
        canVote() {
            if (!this.poll) return false;
            // 管理场景不能投票
            if (this.isManagerMode) return false;
            // 已投票不能再投
            if (this.poll.hasVoted) return false;
            // 已结束不能投
            if (this.isEnded) return false;
            return true;
        },
        shouldShowResult() {
            if (!this.poll) return false;
            // 投票已结束，所有人可见
            if (this.isEnded) return true;
            // 已投票者可见
            if (this.poll.hasVoted) return true;
            // 始终显示结果
            if (this.poll.showResult === 1) return true;
            if (this.isManagerMode) return true;
            return false;
        },
        statusText() {
            if (this.isEnded) {
                return this.$t('poll.poll_ended');
            }
            if (this.poll.endTime > 0) {
                const remaining = this.poll.endTime - Date.now();
                if (remaining > 0) {
                    const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
                    const hours = Math.floor(remaining / (60 * 60 * 1000));
                    if (days > 0) {
                        return this.$t('poll.days_left', {days});
                    } else if (hours > 0) {
                        return this.$t('poll.hours_left', {hours});
                    } else {
                        return this.$t('poll.less_than_one_hour');
                    }
                }
            }
            return '';
        },
        optionsSectionTitle() {
            if (this.poll && this.poll.type === 2) {
                return this.$t('poll.options_with_type', {type: this.$t('poll.multiple_choice')});
            }
            return this.$t('poll.options_title');
        },
        footerStatusText() {
            const parts = [];

            // 匿名/实名
            parts.push(this.isAnonymous ? this.$t('poll.anonymous') : this.$t('poll.named'));

            // 参与人数
            parts.push(this.$t('poll.voter_count', {count: this.poll.voterCount || 0}));

            // 状态
            if (this.isEnded) {
                parts.push(this.$t('poll.poll_ended'));
            } else if (this.poll.hasVoted) {
                parts.push(this.$t('poll.already_voted'));
            }

            return parts.join(' · ');
        }
    },
    mounted() {
        document.title = this.$t('poll.poll_detail');
        let query = this.$route.query;
        this.groupId = query.groupId || '';
        this.fromMessage = query.fromMessage === '1';
        this.pollId = parseInt(query.pollId);
        this.fetchPoll();
    },
    methods: {
        goBack() {
            this.$router.back();
        },
        async fetchPoll() {
            this.loading = true;
            this.selectedOptions = [];
            try {
                this.poll = await pollApi.getPoll(this.pollId, this.groupId);
                // 加载已投票的选项
                if (this.poll.myOptionIds && this.poll.myOptionIds.length > 0) {
                    this.selectedOptions = [...this.poll.myOptionIds];
                }
            } catch (e) {
                this.error = this.$t('poll.poll_load_failed') + ': ' + e.message;
            } finally {
                this.loading = false;
            }
        },
        isOptionSelected(optionId) {
            return this.selectedOptions.includes(optionId);
        },
        toggleOption(optionId) {
            if (!this.canVote) return;

            if (this.poll.type === 1) {
                // 单选：使用 Vue.set 确保响应式
                if (this.selectedOptions.includes(optionId)) {
                    this.$set(this, 'selectedOptions', []);
                } else {
                    this.$set(this, 'selectedOptions', [optionId]);
                }
            } else {
                // 多选
                const index = this.selectedOptions.indexOf(optionId);
                if (index > -1) {
                    this.selectedOptions.splice(index, 1);
                } else {
                    if (this.poll.maxSelect > 0 && this.selectedOptions.length >= this.poll.maxSelect) {
                        alert(this.$t('poll.max_select_limit', {max: this.poll.maxSelect}));
                        return;
                    }
                    this.selectedOptions.push(optionId);
                }
            }
        },
        async submitVote() {
            if (this.selectedOptions.length === 0) {
                alert(this.$t('poll.please_select_option'));
                return;
            }

            this.loading = true;
            try {
                await pollApi.vote(this.pollId, this.groupId, this.selectedOptions);
                this.$notify({
                    text: this.$t('poll.vote_success'),
                    type: 'success',
                });
                this.closeWindow();
            } catch (e) {
                alert(this.$t('poll.vote_failed') + ': ' + e.message);
            } finally {
                this.loading = false;
            }
        },
        async closePoll() {
            if (!confirm(this.$t('poll.confirm_close'))) return;

            this.loading = true;
            try {
                await pollApi.closePoll(this.pollId, this.groupId);
                this.$notify({
                    text: this.$t('poll.poll_closed'),
                    type: 'success',
                });
                await this.fetchPoll();
            } catch (e) {
                alert(this.$t('poll.close_failed') + ': ' + e.message);
            } finally {
                this.loading = false;
            }
        },
        async deletePoll() {
            if (!confirm(this.$t('poll.confirm_delete'))) return;

            this.loading = true;
            try {
                await pollApi.deletePoll(this.pollId, this.groupId);
                this.$notify({
                    text: this.$t('poll.poll_deleted'),
                    type: 'success',
                });
                window.close();
            } catch (e) {
                alert(this.$t('poll.delete_failed') + ': ' + e.message);
            } finally {
                this.loading = false;
            }
        },
        async exportDetails() {
            this.loading = true;
            try {
                const details = await pollApi.exportPollDetails(this.pollId, this.groupId);
                this.downloadCSV(details);
            } catch (e) {
                alert(this.$t('poll.export_failed') + ': ' + e.message);
            } finally {
                this.loading = false;
            }
        },
        downloadCSV(details) {
            if (!details || details.length === 0) {
                alert(this.$t('poll.no_voter_details'));
                return;
            }

            let csv = '\uFEFF';
            csv += this.$t('poll.csv_option') + ',' + this.$t('poll.csv_user') + ',' + this.$t('poll.csv_time') + '\n';

            details.forEach(detail => {
                const time = new Date(detail.createdAt).toLocaleString();
                csv += this.escapeCSV(detail.optionText) + ',' + this.escapeCSV(detail.userName) + ',' + time + '\n';
            });

            const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = (this.poll.title || this.$t('poll.default_file_name')) + '_' + this.$t('poll.details_suffix') + '.csv';
            link.click();
        },
        escapeCSV(field) {
            if (!field) return '';
            if (field.includes(',') || field.includes('"') || field.includes('\n')) {
                return '"' + field.replace(/"/g, '""') + '"';
            }
            return field;
        },
        getCreatorName(userId) {
            return wfc.getUserDisplayName(userId);
        },
        getAvatar(userId) {
            let userInfo = wfc.getUserInfo(userId, false);
            return userInfo.portrait || Config.DEFAULT_PORTRAIT_URL;
        },
        closeWindow() {
            window.close();
        },
    }
}
</script>

<style scoped>
.poll-detail {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    height: 100vh;
    background-color: #f5f6f7;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    color: #333;
    user-select: none;
    position: relative;
}

.loading-state, .error-state {
    padding: 60px;
    text-align: center;
    color: #999;
}

.spinner {
    border: 3px solid rgba(0, 0, 0, 0.1);
    width: 30px;
    height: 30px;
    border-radius: 50%;
    border-left-color: #1f64e4;
    animation: spin 1s linear infinite;
    margin: 0 auto 10px;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.error-state {
    color: #ff3b30;
}

.detail-nav-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 16px 0 16px;
    background: #fff;
    width: 100%;
}

.back-btn {
    font-size: 15px;
    color: #576b95;
    cursor: pointer;
}

.detail-content {
    flex: 1;
    overflow-y: auto;
    padding-bottom: 80px;
    background: #fff;
    width: 100%;
}

.detail-header {
    padding: 20px 24px;
}

.creator-info {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
}

.creator-avatar {
    width: 40px;
    height: 40px;
    border-radius: 4px;
    margin-right: 12px;
}

.creator-text {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.creator-name {
    font-size: 14px;
    color: #666;
}

.status-tag {
    font-size: 13px;
    color: #ff9500;
    background: #fff7e6;
    padding: 4px 8px;
    border-radius: 4px;
}

.status-tag.ended {
    color: #999;
    background: #f5f5f5;
}

.poll-title {
    font-size: 20px;
    font-weight: bold;
    color: #333;
    margin-bottom: 8px;
    line-height: 1.4;
}

.poll-desc {
    font-size: 14px;
    color: #666;
    line-height: 1.6;
}

.divider {
    height: 8px;
    background: #f5f6f7;
}

.options-section-title {
    padding: 16px 24px 8px;
    font-size: 14px;
    color: #666;
    background: #fff;
}

.vote-options {
    padding: 0 16px 16px;
    background: #fff;
}

.vote-option-item {
    position: relative;
    display: flex;
    align-items: center;
    padding: 14px 16px;
    margin-bottom: 8px;
    background: #fff;
    border: 1px solid #e5e5e5;
    border-radius: 8px;
    cursor: pointer;
    overflow: hidden;
}

.vote-option-item.disabled {
    cursor: default;
}

.vote-option-item.selected {
    border-color: #1f64e4;
    background: #f0f7ff;
}

.progress-bar {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    background: #e6f2ff;
    z-index: 0;
}

.check-box {
    position: relative;
    z-index: 1;
    margin-right: 12px;
}

.check-circle {
    width: 22px;
    height: 22px;
    border: 2px solid #ccc;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    color: #fff;
    transition: all 0.2s;
}

.check-circle.checked {
    background: #1f64e4;
    border-color: #1f64e4;
}

.option-text {
    position: relative;
    z-index: 1;
    flex: 1;
    font-size: 15px;
    color: #333;
}

.option-text.with-checkbox {
    margin-left: 0;
}

.vote-count {
    position: relative;
    z-index: 1;
    font-size: 13px;
    color: #666;
    white-space: nowrap;
}

.detail-footer {
    padding: 16px 24px;
    text-align: center;
    font-size: 13px;
    color: #999;
    background: #f5f6f7;
}

.floating-footer {
    position: absolute;
    bottom: 24px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    gap: 12px;
    pointer-events: none;
    padding: 0 24px;
}

.action-btn, .secondary-btn, .danger-btn {
    pointer-events: auto;
    border: none;
    padding: 12px 40px;
    border-radius: 24px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.1s, box-shadow 0.2s, background 0.2s;
}

.action-btn {
    background: #1f64e4;
    color: white;
    box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
}

.action-btn:hover {
    background: #006ce6;
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(0, 122, 255, 0.4);
}

.action-btn:disabled {
    background: #b4d8ff;
    box-shadow: none;
    cursor: default;
    transform: none;
}

.secondary-btn {
    background: #1f64e4;
    color: white;
}

.danger-btn {
    background: #ff3b30;
    color: white;
}
</style>
