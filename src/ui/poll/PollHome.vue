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
import { getSubWindowQuery, isInAppSubWindow, pushInAppSubWindow } from '../util/subWindowNavigator';
export default {
    name: "PollHome",
    props: {
        subWindowQuery: {
            type: Object,
            required: false,
            default: null,
        }
    },
    mounted() {
        document.title = this.$t('poll.poll');
    },
    methods: {
        getQuery() {
            return getSubWindowQuery(this);
        },
        goToCreate() {
            const query = { groupId: this.getQuery().groupId };
            if (isInAppSubWindow(this)) {
                pushInAppSubWindow(this, '/poll/create', query);
            } else {
            this.$router.push({
                path: '/poll/create',
                    query,
            });
            }
        },
        goToMyPolls() {
            const query = { groupId: this.getQuery().groupId };
            if (isInAppSubWindow(this)) {
                pushInAppSubWindow(this, '/poll/list', query);
            } else {
            this.$router.push({
                path: '/poll/list',
                    query,
            });
            }
        }
    }
}
</script>

<style scoped>
.poll-home {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    height: 100vh;
    background-color: var(--background-tertiary);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    color: var(--text-primary);
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
    color: var(--text-primary);
}

.home-menu {
    background: var(--background-primary);
    border-radius: 12px;
    overflow: hidden;
}

.home-menu-item {
    display: flex;
    align-items: center;
    padding: 16px;
    cursor: pointer;
    border-bottom: 1px solid var(--border-secondary);
}

.home-menu-item:last-child {
    border-bottom: none;
}

.home-menu-item:hover {
    background: var(--background-item-hover);
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
    background: var(--background-item-selected);
}

.list-icon {
    background: var(--background-item-selected);
}

.menu-text {
    flex: 1;
    font-size: 16px;
    color: var(--text-primary);
}

.menu-arrow {
    font-size: 20px;
    color: var(--text-hint);
}
</style>
