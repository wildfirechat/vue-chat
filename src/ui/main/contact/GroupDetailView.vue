<template>
    <section class="group-info-container">
        <div class="group-info">
            <img :src="sharedContactState.currentGroup.portrait">
            <p>{{ sharedContactState.currentGroup.name }}</p>
        </div>
        <a @click="chat">{{ $t('group.chat') }}</a>
        <div class="action-container">
            <p @click="unfavGroup">从通讯录中删除</p>
        </div>
    </section>
</template>

<script>
import store from "../../../store";
import Conversation from "../../../wfc/model/conversation";
import ConversationType from "../../../wfc/model/conversationType";
import wfc from "../../../wfc/client/wfc";

export default {
    name: "GroupDetailView",
    props: {},
    data() {
        return {
            sharedContactState: store.state.contact,
        }
    },
    methods: {
        chat() {
            let conversation = new Conversation(ConversationType.Group, this.sharedContactState.currentGroup.target, 0);
            store.setCurrentConversation(conversation);
            this.$router.replace('/home');
        },

        unfavGroup() {
            wfc.setFavGroup(this.sharedContactState.currentGroup.target, false, () => {
                this.sharedContactState.currentGroup = null;
                store.reloadFavGroupList();
            }, err => {
                console.error('setFavGroup error', err);
            });
        }
    }

}
</script>

<style lang="css" scoped>

.group-info-container {
    display: flex;
    height: 100%;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    border-top-right-radius: var(--main-border-radius);
    border-bottom-right-radius: var(--main-border-radius);
    position: relative;
}

.group-info-container a {
    color: white;
    padding: 10px 40px;
    background-color: #3861e0;
    border-radius: 5px;
    font-size: 14px;
    border: 1px solid transparent;
    margin-bottom: 150px;
}

.group-info-container a:active {
    background-color: #4168e0;
}

.group-info {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

.group-info img {
    height: 120px;
    width: 120px;
    border-radius: 5px;
}

.group-info p {
    margin-top: 20px;
    font-size: 20px;
    margin-bottom: 100px;
}

.action-container {
    position: absolute;
    left: 0;
    bottom: 0;
    width: 100%;
    margin-bottom: 20px;
    display: flex;
    justify-content: center;
    color: #3f64e4;
    font-size: 13px;
}

</style>
