<template>
    <div class="poll-home">
        <div class="home-content">
            <div class="home-title">{{ $t('poll.poll') }}</div>
            <div class="home-menu">
                <div class="home-menu-item" @click="goToCreate">
                    <div class="menu-icon create-icon">📊</div>
                    <div class="menu-text">{{ $t('poll.create_poll') }}</div>
                    <div class="menu-arrow">›</div>
                </div>
                <div class="home-menu-item" @click="goToMyPolls">
                    <div class="menu-icon list-icon">📋</div>
                    <div class="menu-text">{{ $t('poll.my_polls') }}</div>
                    <div class="menu-arrow">›</div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: "PollHome",
    mounted() {
        document.title = this.$t('poll.poll');
    },
    methods: {
        goToCreate() {
            this.$router.push({
                path: '/poll/create',
                query: { groupId: this.$route.query.groupId }
            });
        },
        goToMyPolls() {
            this.$router.push({
                path: '/poll/list',
                query: { groupId: this.$route.query.groupId }
            });
        }
    }
}
</script>

<style scoped>
.poll-home {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    height: 100vh;
    background-color: #f5f6f7;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    color: #333;
    user-select: none;
    padding: 24px;
}

.home-content {
    flex: 1;
    width: 100%;
    height: 100%;
}

.home-title {
    font-size: 28px;
    font-weight: bold;
    margin-bottom: 32px;
    color: #333;
}

.home-menu {
    background: #fff;
    border-radius: 12px;
    overflow: hidden;
}

.home-menu-item {
    display: flex;
    align-items: center;
    padding: 16px;
    cursor: pointer;
    border-bottom: 1px solid #f0f0f0;
}

.home-menu-item:last-child {
    border-bottom: none;
}

.home-menu-item:hover {
    background: #f9f9f9;
}

.menu-icon {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    margin-right: 12px;
}

.create-icon {
    background: #e6f2ff;
}

.list-icon {
    background: #f0f7ff;
}

.menu-text {
    flex: 1;
    font-size: 16px;
    color: #333;
}

.menu-arrow {
    font-size: 20px;
    color: #999;
}
</style>
