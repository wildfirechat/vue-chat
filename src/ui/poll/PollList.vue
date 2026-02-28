<template>
    <div class="poll-list-page">
        <div class="list-header">
            <span class="back-btn" @click="goBack">‹ {{ $t('common.back') }}</span>
            <span class="list-title">{{ $t('poll.my_polls') }}</span>
            <span class="placeholder"></span>
        </div>
        <div class="list-content">
            <div v-if="loading" class="loading-state">
                <div class="spinner"></div>
                <p>{{ $t('common.loading') }}</p>
            </div>
            <div v-else-if="polls.length === 0" class="empty-state">
                <p>{{ $t('poll.no_polls') }}</p>
            </div>
            <div v-else class="poll-list">
                <div v-for="poll in polls" :key="poll.pollId" class="poll-list-item" @click="openPollDetail(poll)">
                    <div class="poll-type-icon">
                        <span v-if="poll.type === 1">◉</span>
                        <span v-else>☑</span>
                    </div>
                    <div class="poll-info">
                        <div class="poll-list-title">{{ poll.title }}</div>
                        <div class="poll-list-meta">
                            <span class="poll-status" :class="{ended: poll.status === 1 || isPollExpired(poll)}">
                                {{ getPollStatusText(poll) }}
                            </span>
                            <span class="poll-count">{{ $t('poll.voter_count', {count: poll.voterCount || 0}) }}</span>
                        </div>
                    </div>
                    <div class="poll-arrow">›</div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import pollApi from "../../api/pollApi";

export default {
    name: "PollList",
    data() {
        return {
            loading: false,
            polls: [],
            groupId: ''
        };
    },
    mounted() {
        document.title = this.$t('poll.my_polls');
        this.groupId = this.$route.query.groupId || '';
        this.loadMyPolls();
    },
    methods: {
        goBack() {
            this.$router.back();
        },
        async loadMyPolls() {
            this.loading = true;
            try {
                this.polls = await pollApi.getMyPolls();
            } catch (e) {
                alert(this.$t('poll.poll_load_failed') + ': ' + e.message);
            } finally {
                this.loading = false;
            }
        },
        isPollExpired(poll) {
            if (poll.endTime > 0) {
                return poll.endTime < Date.now();
            }
            return false;
        },
        getPollStatusText(poll) {
            if (poll.status === 1 || this.isPollExpired(poll)) {
                return this.$t('poll.poll_ended');
            }
            return this.$t('poll.poll_in_progress');
        },
        openPollDetail(poll) {
            this.$router.push({
                path: '/poll/detail',
                query: {
                    pollId: poll.id,
                    groupId: this.groupId
                }
            });
        }
    }
}
</script>

<style scoped>
.poll-list-page {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    height: 100vh;
    width: 100%;
    background-color: #f5f6f7;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    color: #333;
    user-select: none;
}

.list-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    background: #fff;
    border-bottom: 1px solid #e5e5e5;
    width: 100%;
}

.back-btn {
    font-size: 15px;
    color: #576b95;
    cursor: pointer;
}

.list-title {
    font-size: 17px;
    font-weight: 600;
}

.placeholder {
    width: 60px;
}

.list-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    width: 100%;
}

.loading-state {
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

.empty-state {
    padding: 60px;
    text-align: center;
    color: #999;
}

.poll-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.poll-list-item {
    display: flex;
    align-items: center;
    padding: 16px;
    background: #fff;
    border-radius: 8px;
    cursor: pointer;
}

.poll-list-item:hover {
    background: #f9f9f9;
}

.poll-type-icon {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #f0f7ff;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 12px;
    font-size: 18px;
    color: #1f64e4;
}

.poll-info {
    flex: 1;
}

.poll-list-title {
    font-size: 15px;
    font-weight: 500;
    color: #333;
    margin-bottom: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.poll-list-meta {
    display: flex;
    align-items: center;
    gap: 8px;
}

.poll-status {
    font-size: 12px;
    color: #1f64e4;
    background: #f0f7ff;
    padding: 2px 8px;
    border-radius: 4px;
}

.poll-status.ended {
    color: #999;
    background: #f5f5f5;
}

.poll-count {
    font-size: 12px;
    color: #888;
}

.poll-arrow {
    font-size: 20px;
    color: #999;
}
</style>
