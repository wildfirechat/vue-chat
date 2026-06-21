<template>
    <section>
        <ul>
            <li v-for="(channel, index) in sharedContactState.channelList" :key="index" @click="showChannel(channel)">
                <div class="channel-item"
                     v-bind:class="{active: sharedContactState.currentChannel && sharedContactState.currentChannel.channelId === channel.channelId}">
                    <img class="avatar" :src="channel.portrait">
                    <div class="item-info">
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
    width: var(--size-avatar-contact);
    height: var(--size-avatar-contact);
    border-radius: var(--default-portrait-border-radius);
    object-fit: cover;
    flex-shrink: 0;
}

.channel-item {
    padding: 8px 4px 8px 30px;
    display: flex;
    font-size: var(--font-size-sm);
    align-items: center;
}

.channel-item:hover{
    background-color: var(--background-item-hover);
}

.channel-item.active {
    background-color: var(--background-item-placeholder);
}

.item-info {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    padding-left: 8px;
}

.channel-item span {
    margin-left: 8px;
}

</style>
