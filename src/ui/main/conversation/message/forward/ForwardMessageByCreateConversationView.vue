<template>
    <div class="pick-user-container">
        <section class="user-list-panel">
            <div class="input-container">
                <input type="text" :placeholder="$t('common.search')" v-model="query">
            </div>
            <div class="user-list-container">
                <div class="back" @click="backPickConversation">
                    <p>{{ $t('common.back') }}</p>
                </div>
                <CheckableUserListView class="user-list"
                                       :enable-pick="true"
                                       :users="filteredUsers"
                                       :padding-left="'20px'"
                                       :enable-category-label-sticky="true"/>
            </div>
        </section>
        <section class="checked-user-list-container">
            <header>
                <h2>{{ $t('conversation.forward_title') }}</h2>
                <span v-if="sharedPickState.users.length === 0">{{ $t('conversation.picked_contact') }}</span>
                <span v-else>{{ $t('conversation.picked_contact') + this.sharedPickState.users.length }}</span>
            </header>
            <div class="content">
                <div class="picked-user-container" v-for="(user, index) in sharedPickState.users" :key="index">
                    <div class="picked-user">
                        <img class="avatar" :src="user.portrait" alt="">
                        <button @click="unpick(user)" class="unpick-button">x</button>
                    </div>
                    <span class="name single-line">{{ user.displayName }}</span>
                </div>
            </div>

            <ForwardMessageView ref="forwardMessageView" v-if="sharedPickState.users.length > 0"
                                :forward-type="forwardType"
                                :messages="messages"/>
            <footer>
                <button @click="cancel" class="cancel">{{ $t('common.cancel') }}</button>
                <button @click="confirm" class="confirm">{{ $t('common.send') }}</button>
            </footer>
        </section>
    </div>
</template>

<script>
import store from "../../../../../store";
import ForwardMessageView from "./ForwardMessageView.vue";
import CheckableUserListView from "../../../user/CheckableUserListView.vue";
import Config from "../../../../../config";

export default {
    name: "ForwardMessageByCreateConversationView",
    inject: {
        conversationActiveStore: {
            default: null,
        },
    },
    props: {
        users: {
            type: Array,
            required: true,
        },
        forwardType: {
            // 可参考ForwardType
            type: Number,
            required: false,
        },
        messages: {
            type: Array,
            required: true,
        }
    },
    data() {
        const activeStore = this.conversationActiveStore || store;
        return {
            activeStore: activeStore,
            sharedPickState: activeStore.state.pick,
            query: '',
        }
    },
    methods: {
        unpick(user) {
            this.activeStore.pickOrUnpickUser(user, false);
        },

        backPickConversation() {
            this.sharedPickState.users.length = 0
            this.$modal.hide('forward-by-create-conversation-modal',
                {
                    backPickConversation: true,
                    forwardType: this.forwardType,
                    messages: this.messages,
                })
        },

        cancel() {
            this.sharedPickState.users.length = 0
            this.$modal.hide('forward-by-create-conversation-modal', {confirm: false})
        },

        confirm() {
            let pickedUsers = [...this.sharedPickState.users];
            this.sharedPickState.users.length = 0
            this.$modal.hide('forward-by-create-conversation-modal',
                {
                    confirm: true,
                    users: pickedUsers,
                    forwardType: this.forwardType,
                    messages: this.messages,
                    extraMessageText: this.$refs['forwardMessageView'].extraMessageText,
                })
        },
    },

    computed: {
        filteredUsers() {
            let result ;
            if (this.query && this.query.trim()) {
                result = this.activeStore.filterContact(this.query)
            } else {
                result = this.users;
            }
            return result.filter(u => u.uid !== Config.FILE_HELPER_ID)
        }
    },

    components: {
        CheckableUserListView,
        ForwardMessageView
    },
}
</script>

<style lang="css" scoped>
.pick-user-container {
    display: flex;
    height: 100%;
    width: 100%;
}

.user-list-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    background-color: var(--background-item-normal);
    overflow: hidden;
}

.user-list-panel .input-container {
    display: flex;
    width: 100%;
}

.user-list-panel input {
    height: 25px;
    margin: 16px 20px 0 16px;
    flex: 1;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-tertiary);
    background-color: var(--background-primary);
    padding-left: 8px;
    text-align: left;
    outline: none;
    color: var(--text-primary);
    font-size: var(--font-size-sm);
    transition: border-color var(--duration-fast);
}

.user-list-panel input::placeholder {
    color: var(--text-hint);
}

.user-list-panel input:focus {
    border-color: var(--accent-color);
}

.user-list-panel .user-list-container {
    height: 100%;
    overflow: hidden;
}

.user-list-container .back {
    background-color: var(--background-item-normal);
    height: 40px;
    font-size: var(--font-size-sm);
    padding-left: 16px;
    display: flex;
    align-items: center;
    color: var(--text-secondary);
    transition: background var(--duration-fast);
}

.user-list-container .back:hover {
    background-color: var(--background-item-hover);
}

.user-list-container .back:active {
    background-color: var(--border-primary);
}

.checked-user-list-container {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.checked-user-list-container header {
    height: 55px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
    border-bottom: 1px solid var(--border-primary);
}

.checked-user-list-container header h2 {
    font-size: var(--font-size-lg);
    font-weight: 500;
    color: var(--text-primary);
    margin-left: 30px;
}

.checked-user-list-container header span {
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
    margin-right: 20px;
}


.checked-user-list-container .content {
    height: 100%;
    flex: 1;
    display: flex;
    padding: 0 30px;
    flex-wrap: wrap;
    justify-content: flex-start;
    align-items: flex-start;
    align-content: flex-start;
    overflow: auto;
}

.checked-user-list-container .content .picked-user-container {
    width: 33%;
    display: flex;
    flex-direction: column;
    column-count: 1;
    justify-content: center;
    align-items: center;
    padding: 4px 8px;
    overflow: hidden;
}

.checked-user-list-container .content .picked-user-container .name {
    text-align: center;
    max-width: 80px;
    font-size: var(--font-size-xs);
}

.checked-user-list-container .content .picked-user-container .picked-user {
    position: relative;
    height: 65px;
    width: 65px;
}

.checked-user-list-container .content .avatar {
    width: 48px;
    height: 48px;
    margin: 8px 8px;
    border-radius: var(--default-portrait-border-radius);
    object-fit: cover;
}

.checked-user-list-container .content .unpick-button {
    position: absolute;
    width: 20px;
    height: 20px;
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-sm);
    top: 0;
    right: 0;
    background: var(--background-secondary);
    color: var(--text-secondary);
    font-size: var(--font-size-xs);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background var(--duration-fast), color var(--duration-fast), border-color var(--duration-fast);
}

.checked-user-list-container .content .unpick-button:hover {
    background: var(--background-error-subtle);
    color: var(--text-danger);
    border-color: var(--text-danger);
}

.checked-user-list-container .content .unpick-button:active {
    background-color: var(--border-primary);
}

.checked-user-list-container footer {
    height: 55px;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    margin-bottom: 8px;
    flex-shrink: 0;
    border-top: 1px solid var(--border-primary);
}

.checked-user-list-container footer button {
    padding: 4px 30px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-primary);
    background: transparent;
    color: var(--text-primary);
    font-size: var(--font-size-sm);
    transition: background var(--duration-fast), color var(--duration-fast), border-color var(--duration-fast);
}

.checked-user-list-container footer button.cancel:hover {
    background: var(--background-item-hover);
}

.checked-user-list-container footer button.confirm {
    background-color: var(--accent-color);
    border-color: var(--accent-color);
    color: var(--text-on-accent);
    margin-left: 20px;
    margin-right: 20px;
}

.checked-user-list-container footer button.confirm:hover {
    background-color: var(--accent-color-active);
    border-color: var(--accent-color-active);
}


</style>
