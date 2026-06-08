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
    color: var(--text-on-accent);
    padding: 8px 40px;
    background-color: var(--status-info);
    border-radius: var(--radius-md);
    font-size: var(--font-size-base);
    border: 1px solid transparent;
    margin-bottom: 150px;
}

.group-info-container a:active {
    background-color: var(--accent-color);
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
    border-radius: var(--default-portrait-border-radius);
}

.group-info p {
    margin-top: 20px;
    font-size: var(--font-size-2xl);
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
    color: var(--accent-color);
    font-size: var(--font-size-sm);
}

</style>
