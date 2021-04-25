<template>
    <div class="conversation-info">
        <div class="conversation-action-container">
            <div @click="showCreateConversationModal" class="action-item">
                <div class="icon">+</div>
                <p>{{ $t('conversation.add_member') }}</p>
            </div>
        </div>
        <UserListVue :users="users"
                     :show-category-label="false"
                     :padding-left="'20px'"
        />
    </div>
</template>

<script>
import UserListVue from "@/ui/main/user/UserListVue";
import ConversationInfo from "@/wfc/model/conversationInfo";
import store from "@/store";
import PickUserView from "@/ui/main/pick/PickUserView";

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
        }
    },
    components: {UserListVue},
    methods: {
        showCreateConversationModal() {
            this.$modal.show(
                PickUserView,
                {
                    users: this.sharedContactState.favContactList.concat(this.sharedContactState.friendList),
                    initialCheckedUsers: [this.conversationInfo.conversation._target],
                    uncheckableUsers: [this.conversationInfo.conversation._target],
                    confirmTitle: this.$t('common.add'),
                }, {
                    name: 'pick-user-modal',
                    width: 600,
                    height: 480,
                    clickToClose: false,
                }, {
                    'before-open': this.beforeOpen,
                    'before-close': this.beforeClose,
                    'closed': this.closed,
                })
        },
        showUserInfo(user) {
            // TODO
            console.log('todo show userInfo', user);
        },
        beforeOpen(event) {
            console.log('Opening...')
        },
        beforeClose(event) {
            console.log('Closing...', event, event.params)
            if (event.params.confirm) {
                let newPickedUsers = event.params.users;
                newPickedUsers.push(this.conversationInfo.conversation._target)
                store.createConversation(newPickedUsers)
            }
        },
        closed(event) {
            console.log('Close...', event)
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

</style>
