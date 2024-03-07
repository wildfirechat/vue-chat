<template>
    <section @click.stop="" class="user-info-container">
        <div class="header">
            <div class="desc">
                <h2>{{ channelInfo.name }}</h2>
                <label>{{ channelInfo.desc }}</label>
            </div>
            <div>
                <img class="avatar" draggable="false" v-bind:src="channelInfo.portrait"/>
            </div>
        </div>
        <div class="content" v-if="false">
            <ul>
                <li>
                    <label>{{ $t('conversation.channel_desc') }}</label>
                    <div>{{ channelInfo.desc }}</div>
                </li>
            </ul>
        </div>
        <div class="action">
            <a href="#" @click.prevent><i class="icon-ion-ios-shuffle" @click.prevent="share"></i></a>
            <a v-if="isSubscribed" href="#" @click.prevent><i class="icon-ion-minus" @click.prevent="subscribe(false)"></i></a>
            <a v-else href="#" @click.prevent><i class="icon-ion-android-add" @click.prevent="subscribe(true)"></i></a>
        </div>
    </section>
</template>

<script>
import store from "../../../store";
import Conversation from "../../../wfc/model/conversation";
import ConversationType from "../../../wfc/model/conversationType";
import wfc from "../../../wfc/client/wfc";

export default {
    name: "ChannelCardView",
    props: {
        channelId: {
            type: String,
            required: true,
        },
        enableUpdatePortrait: {
            type: Boolean,
            required: false,
        }
    },
    data() {
        return {
            channelInfo: null,
        }
    },
    created() {
        this.channelInfo = wfc.getChannelInfo(this.channelId, false);
    },
    methods: {
        share() {
            this.close();
        },
        chat() {
            let conversation = new Conversation(ConversationType.Single, this.channelInfo.uid, 0);
            store.setCurrentConversation(conversation)
            this.close();
        },
        subscribe(toSubscribe) {
            wfc.listenChannel(this.channelId, toSubscribe);
            this.close();
        },
        close() {
            this.$emit('close');
        },
    },

    computed: {
        isSubscribed() {
            return wfc.isListenedChannel(this.channelId);
        }
    }
};
</script>

<style lang="css" scoped>
.user-info-container {
    width: 300px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: #292a2c;
    background-color: #fcfcfc;
}

.user-info-container .avatar {
    width: 60px;
    height: 60px;
    border-radius: 3px;
}

.header {
    width: calc(100% - 40px);
    margin: 10px 20px;
    padding-bottom: 20px;
    display: flex;
    justify-content: space-between;
    border-bottom: 1px solid lightgray;
}


.header .desc {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
}

.content {
    width: 100%;
    text-align: left;
}

.content ul {
    border: 1px solid white;
    list-style: none;
    margin: 10px 20px;
}

.content ul li {
    margin-left: 0;
    height: 40px;
    line-height: 40px;
    display: flex;
}

.content ul li label {
    margin-right: 20px;
}

.content ul li .alias {
    border: none;
    background: none;
}

.content ul li .alias > input {
    width: 100%;
}

.content ul li > div {
    display: inline-block;
    flex: 1;
}

.action {
    width: calc(100% - 40px);
    display: flex;
    justify-content: flex-end;

    padding-top: 20px;
    padding-bottom: 10px;
}

.action a {
    display: inline-block;
    text-decoration: none;
}

.action a i {
    font-size: 24px;
    padding: 5px 30px;
}

.action a i:last-of-type {
    padding-right: 0;
}

i:hover {
    color: #3f64e4;
}


</style>
