<template>
    <section>
        <ul>
            <li v-for="(channel, index) in sharedContactState.channelList" :key="index" @click="showChannel(channel)">
                <div class="channel-item"
                     v-bind:class="{active: sharedContactState.currentChannel && sharedContactState.currentChannel.channelId === channel.channelId}">
                    <img class="avatar" :src="channel.portrait">
                    <div style="padding-left: 10px">
                        <p class="single-line">{{ channel.remark ? channel.remark : channel.name }}</p>
                    </div>
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
    width: 32px;
    height: 32px;
    border-radius: 3px;
    object-fit: cover;
}

.channel-item {
    padding: 10px 5px 10px 30px;
    display: flex;
    font-size: 13px;
    align-items: center;
}

.channel-item:hover{
    background-color: var(--background-item-hover);
}

.channel-item.active {
    background-color: var(--background-item-placeholder);
}

.channel-item span {
    margin-left: 10px;
}

</style>
