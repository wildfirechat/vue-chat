<template>
    <section>
        <ul>
            <li v-for="(channel, index) in sharedContactState.channelList" :key="index" @click="showChannel(channel)">
                <div class="channel-item"
                     v-bind:class="{active: sharedContactState.currentChannel && sharedContactState.currentChannel.channelId === channel.channelId}">
                    <img class="avatar" :src="channel.portrait">
                    <span class="single-line">{{ channel.remark ? channel.remark : channel.name }}</span>
                </div>
            </li>
        </ul>
    </section>

</template>

<script>
import store from "../../../store";

export default {
    name: "ChannelListView",
    props: {},
    data() {
        return {
            sharedContactState: store.state.contact,
        }
    },
    methods: {
        showChannel(channel) {
            store.setCurrentChannel(channel)
        }
    },
}
</script>

<style scoped>
.avatar {
    width: 40px;
    height: 40px;
    border-radius: 3px;
}

.channel-item {
    height: 50px;
    padding: 5px 10px 5px 30px;
    display: flex;
    font-size: 13px;
    align-items: center;
}

.channel-item.active {
    background-color: #d6d6d6;
}

.channel-item span {
    margin-left: 10px;
}

</style>
