<template>
    <div class="conversation-info">
        <div class="scroll-container">
            <!-- 成员 Grid -->
            <div class="member-section">
                <div class="member-grid">
                    <tippy
                        v-for="user in users"
                        :key="user.uid"
                        :ref="'memberTippy-' + user.uid.replace('@', '#')"
                        theme="light"
                        :animate-fill="false"
                        animation="fade"
                        interactive
                        trigger="click"
                        placement="left-start"
                    >
                        <div class="member-grid-item">
                            <img :src="user.portrait" @error="onImgError($event)" class="member-avatar"/>
                            <p class="member-name">{{ user._displayName || user.displayName }}</p>
                        </div>
                        <template #content>
                            <UserCardView :user-info="user" v-on:close="closeUserCard(user)"/>
                        </template>
                    </tippy>
                    <!-- 添加按钮（创建群组） -->
                    <div class="member-grid-item action-grid-item" @click="showCreateConversationModal">
                        <div class="action-icon add-icon">+</div>
                        <p class="member-name">{{ $t('conversation.add_member') }}</p>
                    </div>
                </div>
            </div>

            <!-- 操作按钮 -->
            <div v-if="sharedMiscState.isElectron" class="conversation-action-item" @click="clearConversationHistory">{{ $t('conversation.clear_conversation_history') }}</div>
            <div class="conversation-action-item" @click="clearRemoteConversationHistory">{{ $t('conversation.clear_remote_conversation_history') }}</div>
            <div class="conversation-action-item" @click="complain">{{ $t('conversation.complain') }}</div>
        </div>
    </div>
</template>

<script>
import UserCardView from "../user/UserCardView.vue";
import ConversationInfo from "../../../wfc/model/conversationInfo";
import store from "../../../store";
import Config from "../../../config";
import {showComplainAlert} from "./conversationComplainHelper";

export default {
    name: "SingleConversationInfoView",
    inject: {
        conversationActiveStore: {
            default: null,
        },
    },
    props: {
        conversationInfo: {
            type: ConversationInfo,
            required: true,
        }
    },
    data() {
        const activeStore = this.conversationActiveStore || store;
        return {
            activeStore: activeStore,
            users: activeStore.getConversationMemberUsrInfos(this.conversationInfo.conversation),
            sharedContactState: activeStore.state.contact,
            sharedMiscState: activeStore.state.misc,
        }
    },
    components: {UserCardView},
    methods: {
        showCreateConversationModal() {
            let successCB = users => {
                users.push(this.conversationInfo.conversation._target)
                this.activeStore.createConversation(users)
            }
            this.$pickContact({
                successCB,
                initialCheckedUsers: [this.conversationInfo.conversation._target],
                uncheckableUsers: [this.conversationInfo.conversation._target],
                confirmTitle: this.$t('common.add'),
                showOrganization: true
            });
        },

        closeUserCard(user) {
            const ref = this.$refs['memberTippy-' + user.uid.replace('@', '#')];
            const inst = Array.isArray(ref) ? ref[0] : ref;
            if (inst && inst.$el && inst.$el._tippy) inst.$el._tippy.hide();
        },

        onImgError(e) {
            e.target.src = Config.DEFAULT_PORTRAIT_URL;
        },

        clearConversationHistory() {
            this.$alert({
                title: '清空本地聊天记录',
                content: '确定清空本地聊天记录？',
                confirmText: '确定',
                confirmButtonType: 'danger',
                cancelText: '取消',
                cancelCallback: () => {
                    // do nothing
                },
                confirmCallback: () => {
                    this.$parent.enableLoadRemoteHistoryMessage = !this.sharedMiscState.isElectron;
                    this.activeStore.clearConversationHistory(this.conversationInfo.conversation);
                }
            })
        },

        clearRemoteConversationHistory(){
            this.$alert({
                title: '清空远程聊天记录',
                content: '确定清空远程聊天记录？',
                confirmText: '确定',
                confirmButtonType: 'danger',
                cancelText: '取消',
                cancelCallback: () => {
                    // do nothing
                },
                confirmCallback: () => {
                    this.activeStore.clearRemoteConversationHistory(this.conversationInfo.conversation);
                }
            })
        },

        complain(){
            showComplainAlert(this, this.activeStore);
        },
    },

    computed: {}
};
</script>

<style lang="css" scoped>
.conversation-info {
    display: flex;
    flex-direction: column;
    position: relative;
    height: 100%;
    overflow: hidden;
}

.scroll-container {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
}

/* 成员区域 */
.member-section {
    padding: 12px 8px 8px;
    flex-shrink: 0;
}

.member-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px 4px;
}

.member-grid-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 6px 4px;
    cursor: pointer;
    border-radius: 4px;
    min-width: 0;
    overflow: hidden;
}

.member-avatar {
    width: 44px;
    height: 44px;
    border-radius: 5px;
    object-fit: cover;
}

.member-name {
    margin-top: 4px;
    font-size: 11px;
    color: var(--text-secondary-strong);
    text-align: center;
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* 操作格子 hover: 改变图标颜色和边框颜色 */
.action-grid-item:hover .action-icon {
    color: var(--accent-color);
    border-color: var(--accent-color);
}

.action-grid-item .action-icon {
    width: 44px;
    height: 44px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 5px;
    border: 1px dashed var(--border-dashed);
    font-size: 22px;
    color: var(--text-secondary-strong);
}

/* 分隔线 */
.section-divider {
    height: 1px;
    background-color: var(--border-tertiary);
    margin: 4px 0;
    flex-shrink: 0;
}

/* 操作项 */
.conversation-action-item {
    display: flex;
    color: var(--text-danger);
    align-items: center;
    font-size: 12px;
    justify-content: center;
    height: 42px;
    flex-shrink: 0;
    border-top: 1px solid var(--border-tertiary);
    margin: 0 10px;
    cursor: pointer;
}

.conversation-action-item:active {
    background: var(--background-item-placeholder);
}
</style>
