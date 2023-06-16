<template>
    <section class="channel-info-container">
        <div class="channel-info">
            <img :src="sharedContactState.currentChannel.portrait">
            <p>{{ $t('channel.name', [sharedContactState.currentChannel.name]) }}</p>
        </div>
        <a @click="chat">{{ $t('channel.chat') }}</a>
    </section>
</template>

<script>
import store from "@/store";
import Conversation from "@/wfc/model/conversation";
import ConversationType from "@/wfc/model/conversationType";

export default {
    name: "ChannelDetailView",
    props: {},
    data() {
        return {
            sharedContactState: store.state.contact,
        }
    },
    methods: {
        chat() {
            let conversation = new Conversation(ConversationType.Channel, this.sharedContactState.currentChannel.channelId, 0);
            store.setCurrentConversation(conversation);
            this.$router.replace('/home');
        }
    }

}
</script>

<style lang="css" scoped>

.channel-info-container {
    display: flex;
    height: 100%;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    border-top-right-radius: var(--main-border-radius);
    border-bottom-right-radius: var(--main-border-radius);
}

.channel-info-container a {
    color: white;
    padding: 10px 40px;
    background-color: #3861e0;
    border-radius: 5px;
    font-size: 14px;
    border: 1px solid transparent;
    margin-bottom: 150px;
}

.channel-info-container a:active {
    background-color: #4168e0;
}

.channel-info {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

.channel-info img {
    height: 120px;
    width: 120px;
    border-radius: 5px;
}

.channel-info p {
    margin-top: 20px;
    font-size: 20px;
    margin-bottom: 100px;
}

</style>
