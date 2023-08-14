<template>
    <div class="conversation-info">
        <header>
            <label>
                {{ $t('conversation.channel_name') }}
                <input type="text"
                       ref="channelNameInput"
                       :disabled="true"
                       v-model="newChannelName"
                       @keyup.enter="updateChannelName"
                       :placeholder="conversationInfo.conversation._target.name">
            </label>
            <label>
                {{ $t('conversation.channel_desc') }}
                <input type="text"
                       ref="channelDescInput"
                       :disabled="true"
                       @keyup.enter='updateChannelDesc'
                       v-model="newChannelDesc"
                       :placeholder="conversationInfo.conversation._target.desc">
            </label>
        </header>
        <div @click="subscribeChannel" class="unsubscribe-channel-item">
            {{ isSubscribedChannel() ? $t('conversation.unsubscribe_channel') : $t('conversation.subscribe_channel') }}
        </div>
    </div>
</template>

<script>
import ConversationInfo from "../../../wfc/model/conversationInfo";
import store from "../../../store";
import wfc from "../../../wfc/client/wfc";

export default {
    name: "ChannelConversationInfoView",
    props: {
        conversationInfo: {
            type: ConversationInfo,
            required: true,
        }
    },
    data() {
        return {
            sharedContactState: store.state.contact,
            newChannelName: '',
            newChannelDesc: '',
        }
    },


    components: {},
    methods: {

        updateChannelName() {

        },
        updateChannelDesc() {

        },

        isSubscribedChannel() {
            return wfc.isListenedChannel(this.conversationInfo.conversation.target);
        },

        subscribeChannel() {
            store.subscribeChannel(this.conversationInfo.conversation.target, !this.isSubscribedChannel());
        },
    },

    computed: {},
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

header {
    padding-left: 20px;
    padding-right: 20px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

header label {
    width: 100%;
    display: flex;
    margin-top: 15px;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    font-size: 14px;
    color: #999999;
}

header label:last-of-type {
    padding-bottom: 15px;
    border-bottom: 1px solid #ececec;
}

header label input {
    flex: 1;
    margin-top: 5px;
    border: none;
    outline: none;
    width: 100%;
    font-size: 13px;
    background-color: transparent;
}

.unsubscribe-channel-item {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    bottom: 0;
    display: flex;
    color: red;
    align-items: center;
    justify-content: center;
    height: 54px;
    width: 100%;
    border-top: 1px solid #ececec;
}

.unsubscribe-channel-item:active {
    background: #d6d6d6;
}

</style>
