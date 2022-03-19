<template>
    <section class="group-info-container">
        <div class="group-info">
            <img :src="sharedContactState.currentGroup.portrait">
            <p>{{ $t('group.name', [sharedContactState.currentGroup.name]) }}</p>
        </div>
        <a @click="chat">{{ $t('group.chat') }}</a>
    </section>
</template>

<script>
import store from "@/store";
import Conversation from "@/wfc/model/conversation";
import ConversationType from "@/wfc/model/conversationType";

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
}

.group-info-container a {
    color: white;
    padding: 10px 40px;
    background-color: #3497f1;
    border-radius: 5px;
    font-size: 14px;
    border: 1px solid transparent;
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

</style>
