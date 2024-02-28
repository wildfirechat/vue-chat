<template>
    <div class="conversation-info">
        <div class="conversation-action-container">
            <div class="action-item" @click="showCreateConversationModal($event, conversationInfo)">
                {{ burnTimeDesc }}
            </div>
            <div class="action-item" style="color: red" @click="destroySecretChat">
                销毁私密聊天
            </div>
        </div>
    </div>
</template>

<script>
import ConversationInfo from "../../../wfc/model/conversationInfo";
import store from "../../../store";
import ListView from "../../common/ListView.vue";
import wfc from "../../../wfc/client/wfc";

export default {
    name: "SecretConversationInfoView",
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
    methods: {
        showCreateConversationModal() {
            this.$modal.show(
                ListView,
                {
                    list: ['不销毁', '3秒', '10秒', '30秒', '1 分钟', '10 分钟'],
                }, null, {
                    name: 'list-item-modal',
                    width: 320,
                    height: 320,
                    clickToClose: true,
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
            let burnMs = [0, 3000, 10000, 30000, 60000, 600000];
            if (event.params && event.params.position >= 0) {
                wfc.setSecretChatBurnTime(this.conversationInfo.conversation.target, burnMs[event.params.position])
            }
        },
        closed(event) {
            console.log('Close...', event)
        },

        destroySecretChat() {
            wfc.destroySecretChat(this.conversationInfo.conversation.target, () => {
                console.log('xxx de ss')
                store.setCurrentConversation(null);
            }, err => {
                console.log('destroySecretChat failed', err)
            })
        }
    },

    computed: {
        burnTimeDesc() {
            let secretChatInfo = wfc.getSecretChatInfo(this.conversationInfo.conversation.target);
            let desc = ['不销毁', '3秒', '10秒', '30秒', '1分钟', '10分钟'];
            let burnMs = [0, 3000, 10000, 30000, 60000, 600000];
            let tmp = desc[burnMs.indexOf(secretChatInfo.burnTime)]
            return `设置密聊焚毁时间(${tmp})`;
        }
    }
};
</script>

<style lang="css" scoped>
.conversation-info {
    height: 100%;
    width: 100%;
}

.conversation-action-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
}

.action-item {
    height: 50px;
    display: flex;
    padding-left: 20px;
    align-items: center;
    border-bottom: 1px solid #f1f1f1;
}

.action-item-padding {
    flex: 1;
    border-bottom: 1px solid #f1f1f1;
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
