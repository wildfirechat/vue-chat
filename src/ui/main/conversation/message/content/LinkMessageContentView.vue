<template>
    <div class="link-message-container"
         @click="clickLink"
         v-bind:class="{out:message.direction === 0}">
        <div class="flex-column flex-align-start" style="display: block">
            <p class="title">{{ this.message.messageContent.title }}</p>
            <p class="desc">{{ this.message.messageContent.digest(this.message) }}</p>
        </div>
        <img :src="message.messageContent.thumbnailUrl" alt="">
    </div>
</template>

<script>
import Message from "../../../../../wfc/messages/message";
import {isElectron, shell} from "../../../../../platform";

export default {
    name: "LinkMessageContentView",
    props: {
        message: {
            type: Message,
            required: true,
        }
    },

    methods: {
        clickLink() {
            if (isElectron()){
                shell.openExternal(this.message.messageContent.url);
            }else {
                window.open(this.message.messageContent.url);
            }
        }
    },

    computed: {}
}
</script>

<style lang="css" scoped>

.link-message-container {
    margin: 0 10px;
    padding: 10px;
    background-color: white;
    position: relative;
    border-radius: 5px;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    max-width: 500px;
    min-width: 150px;
}

.link-message-container img {
    width: 40px;
    height: 40px;
    margin-left: 10px;
    min-width: 40px;
    background: lightgray;
    border-radius: 3px;
}

.link-message-container .title {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
}

.link-message-container .desc {
    color: #888888;
    font-size: 13px;
    -webkit-line-clamp: 3;
    line-height: 20px;
    max-height: 60px;
    overflow: hidden;
    display: inline-block;
    text-overflow: ellipsis;
}

.rightarrow:before {
    border-left-color: white;
}
</style>
