<template>
    <section class="multi-selection-action-container">
        <ul>
            <li>
                <div class="action" v-bind:class="{enable: sharedPickState.messages.length > 0}" @click="forwardOneByOne">
                    <div class="icon">
                        <i class="icon-ion-forward"></i>
                    </div>
                    <p>{{ $t('conversation.forward_one_by_one') }}</p>
                </div>
            </li>
            <li>
                <div class="action" v-bind:class="{enable: sharedPickState.messages.length > 0}" @click="forwardComposite">
                    <div class="icon">
                        <i class="icon-ion-quote"></i>
                    </div>
                    <p>{{ $t('conversation.forward_composite') }}</p>
                </div>
            </li>
            <li>
                <div class="action" v-bind:class="{enable: sharedPickState.messages.length > 0}" @click="fav">
                    <div class="icon">
                        <i class="icon-ion-android-favorite"></i>
                    </div>
                    <p>{{ $t('common.fav') }}</p>
                </div>
            </li>
            <li>
                <div class="action" v-bind:class="{enable: sharedPickState.messages.length > 0}" @click="deleteMultiMessage">
                    <div class="icon">
                        <i class="icon-ion-android-delete"></i>
                    </div>
                    <p>{{ $t('common.delete') }}</p>
                </div>
            </li>
            <li>
                <div class="action" style="color: black; pointer-events: auto">
                    <i @click="hideMultiSelectionActionView" class="icon-ion-close"></i>
                </div>
            </li>
        </ul>
    </section>
</template>

<script>
import store from "../../../store";
import ForwardType from "./message/forward/ForwardType";
import wfc from "../../../wfc/client/wfc";
import GroupInfo from "../../../wfc/model/groupInfo";
import ConversationInfo from "../../../wfc/model/conversationInfo";

export default {
    name: "MessageMultiSelectionActionView",
    props: {
        conversationInfo: {
            type: ConversationInfo,
            required: true,
        }
    },
    data() {
        return {
            sharedPickState: store.state.pick,
        }
    },
    methods: {
        deleteMultiMessage() {
            let target = this.conversationInfo.conversation._target;
            let isSuperGroup = false
            if (target instanceof GroupInfo) {
                isSuperGroup = target.superGroup === 1;
            }
            let isElectron = store.state.misc.isElectron;
            this.$alert({
                title: ' 删除消息',
                content: '确定删除选中的消息？',
                confirmText: isElectron ? '本地删除' : '删除',
                cancelText: isSuperGroup || !isElectron ? '取消' : '远程删除',
                cancelCallback: () => {
                    if (!(isSuperGroup || !isElectron)) {
                        store.deleteSelectedMessages(true);
                    }
                },
                confirmCallback: () => {
                    if (this.sharedPickState.isElectron) {
                        store.deleteSelectedMessages(false);
                    } else {
                        store.deleteSelectedMessages(true);
                    }
                }
            })
        },

        hideMultiSelectionActionView() {
            store.toggleMessageMultiSelection();
        },

        forwardOneByOne() {
            let messages = [...this.sharedPickState.messages];
            this.$forwardMessage({
                forwardType:ForwardType.ONE_BY_ONE,
                messages,
            });
            store.toggleMessageMultiSelection();
        },

        forwardComposite() {
            let messages = [...this.sharedPickState.messages];
            this.$forwardMessage({
                forwardType:ForwardType.COMPOSITE,
                messages,
            });
            store.toggleMessageMultiSelection();
        },

        fav(){
            let messages = [...this.sharedPickState.messages];
            this.$parent.favMessages(messages);
            store.toggleMessageMultiSelection();
        }
    },

}
</script>

<style lang="css" scoped>

.multi-selection-action-container {
    width: 100%;
    height: 184px;
    min-height: 184px;
    text-align: center;
    display: flex;
    justify-content: center;
    align-items: center;
    border-top: 1px solid #e2e2e2;
}

ul {
    list-style: none;
}

ul li {
    display: inline-block;
}

.action {
    font-size: 13px;
    padding: 0 15px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: lightgrey;
    pointer-events: none;
}

.action.enable {
    color: black;
    pointer-events: auto;
}

.action .icon {
    width: 60px;
    height: 60px;
    background-color: white;
    border-radius: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
}

.action.enable .icon:active {
    background-color: lightgrey;

}

.action p {
    padding-top: 10px;
}

.action i{
    font-size: 20px;
}


</style>
