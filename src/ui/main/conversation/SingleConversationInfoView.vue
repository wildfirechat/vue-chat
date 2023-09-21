<template>
    <div class="conversation-info">
        <div class="conversation-action-container">
            <div @click="showCreateConversationModal" class="action-item">
                <div class="icon">+</div>
                <p>{{ $t('conversation.add_member') }}</p>
            </div>
        </div>
        <UserListView :users="users"
                     :show-category-label="false"
                     :padding-left="'20px'"
        />
        <div v-if="sharedMiscState.isElectron" class="conversation-action-item" @click="clearConversationHistory">{{ $t('conversation.clear_conversation_history') }}</div>
        <div class="conversation-action-item" @click="clearRemoteConversationHistory">{{ $t('conversation.clear_remote_conversation_history') }}</div>
    </div>
</template>

<script>
import UserListView from "../user/UserListView.vue";
import ConversationInfo from "../../../wfc/model/conversationInfo";
import store from "../../../store";
import wfc from "../../../wfc/client/wfc";

export default {
    name: "SingleConversationInfoView",
    props: {
        conversationInfo: {
            type: ConversationInfo,
            required: true,
        }
    },
    data() {
        return {
            users: store.getConversationMemberUsrInfos(this.conversationInfo.conversation),
            sharedContactState: store.state.contact,
            sharedMiscState: store.state.misc,
        }
    },
    components: {UserListView},
    methods: {
        showCreateConversationModal() {
            let successCB = users => {
                users.push(this.conversationInfo.conversation._target)
                store.createConversation(users)
            }
            this.$pickContact({
                successCB,
                initialCheckedUsers: [this.conversationInfo.conversation._target],
                uncheckableUsers: [this.conversationInfo.conversation._target],
                confirmTitle: this.$t('common.add'),
            });
        },
        showUserInfo(user) {
            // TODO
            console.log('todo show userInfo', user);
        },

        clearConversationHistory() {
            wfc.clearMessages(this.conversationInfo.conversation);
        },

        clearRemoteConversationHistory(){
            wfc.clearRemoteConversationMessages(this.conversationInfo.conversation);
        }
    },

    computed: {}
};
</script>

<style lang="css" scoped>
.conversation-info {
    display: flex;
    flex-direction: column;
    position: relative;
    justify-content: flex-start;
    height: 100%;
    overflow: hidden;
}

.action-item {
    height: 50px;
    display: flex;
    padding-left: 20px;
    align-items: center;
}

.action-item .icon {
    width: 40px;
    height: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 3px;
    border: 1px dashed #d6d6d6;
}

.action-item img {
    width: 40px;
    height: 40px;
}

.action-item p {
    margin-left: 10px;
    font-size: 13px;
}

.action-item:active {
    background-color: #d6d6d6;
}

.conversation-action-item {
    display: flex;
    color: red;
    align-items: center;
    font-size: 12px;
    justify-content: center;
    height: 42px;
    max-height: 42px;
    border-top: 1px solid #ececec;
}

.conversation-action-item:active {
    background: #d6d6d6;
}

</style>
