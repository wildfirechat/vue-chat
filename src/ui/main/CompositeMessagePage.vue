<template>
    <section class="composite-page">
        <div v-if="!sharedMiscState.isElectron" class="close-button-container" @click="hideCompositeMessagePage">
            <i class="icon-ion-close"></i>
        </div>
        <div v-if="!compositeMessage">
            {{ 'Null CompositeMessagePage' }}
        </div>
        <ul v-else>
            <li v-for="(message, index) in compositeMessage.messageContent.messages"
                :key="message.uid">
                <div class="message-container">
                    <div class="portrait-container">
                        <img
                            v-if="index === 0 || message.from !== compositeMessage.messageContent.messages[index -1].from"
                            alt="" :src="message._from.portrait">
                    </div>
                    <div class="name-time-content-container">
                        <div class="name-time-container">
                            <p class="name"> {{ message._from._displayName }}</p>
                            <p class="time"> {{ message._timeStr }}</p>
                            <!--                            <p class="time"> 1223</p>-->
                        </div>
                        <div class="content">
                            <!--message content-->
                            <TextMessageContentView :message="message"
                                                    v-if="message.messageContent.type === 1"
                                                    :style="{'--out-arrow-color':'#98ea70', '--in-arrow-color':'white'}"
                                                    v-bind:class="{leftarrow:message.direction === 1, rightarrow: message.direction === 0}"/>
                            <!--                            <AudioMessageContentView :message="message"-->
                            <!--                                                     v-else-if="message.messageContent.type === 2"/>-->
                            <ImageMessageContentView :message="message"
                                                     v-else-if="message.messageContent.type === 3"/>
                            <!--                           v-bind:class="{leftarrow:message.direction === 1, rightarrow: message.direction === 0}"/>-->
                            <FileMessageContentView :message="message"
                                                    v-else-if="message.messageContent.type === 5"
                                                    v-bind:class="{leftarrow:message.direction === 1, rightarrow: message.direction === 0}"/>
                            <VideoMessageContentView :message="message"
                                                     v-else-if="message.messageContent.type === 6"/>
                            <!--                           v-bind:class="{leftarrow:message.direction === 1, rightarrow: message.direction === 0}"/>-->
                            <StickerMessageContentView :message="message"
                                                       v-else-if="message.messageContent.type === 7"/>
                            <CompositeMessageContentView :message="message"
                                                         v-else-if="message.messageContent.type === 11"/>
                            <!--                            <CallStartMessageContentView :message="message"-->
                            <!--                                                         v-else-if="message.messageContent.type === 400"/>-->
                            <!--                            <ConferenceInviteMessageContentView :message="message"-->
                            <!--                                                                v-else-if="message.messageContent.type === 408"/>-->
                            <UnsupportMessageContentView :message="message"
                                                         v-else-if="[2, 10, 400, 408].indexOf(message.messageContent.type) >= 0"/>
                            <UnknowntMessageContentView :message="message"
                                                        v-else
                                                        v-bind:class="{leftarrow:message.direction === 1, rightarrow: message.direction === 0}"/>
                        </div>
                    </div>
                </div>
            </li>
        </ul>
    </section>

</template>

<script>
import TextMessageContentView from "./conversation/message/content/TextMessageContentView";
import UnsupportMessageContentView from "./conversation/message/content/UnsupportMessageContentView";
import store from "../../store";
import CompositeMessageContentView from "./conversation/message/content/CompositeMessageContentView";
import ImageMessageContentView from "./conversation/message/content/ImageMessageContentView";
import VideoMessageContentView from "./conversation/message/content/VideoMessageContentView";
import FileMessageContentView from "./conversation/message/content/FileMessageContentView";
import StickerMessageContentView from "./conversation/message/content/StickerMessageContentView";
import UnknowntMessageContentView from "./conversation/message/content/UnknownMessageContentView";
import Message from "../../wfc/messages/message";
import {stringValue} from "../../wfc/util/longUtil";

export default {
    name: "CompositeMessagePage",
    props: {
        message: {
            required: false,
            type: Message,
            default: null,
        }
    },
    data() {
        return {
            compositeMessage: null,
            sharedMiscState: store.state.misc,
        }
    },

    mounted() {
        if (this.message) {
            this.compositeMessage = this.message;
            return;
        }
        let hash = window.location.hash;
        let messageUid = hash.substring(hash.indexOf('=') + 1);
        this.compositeMessage = store.getMessageByUid(messageUid);
        console.log('xxx', hash, messageUid, this.compositeMessage)
        document.title = this.compositeMessage.messageContent.title;
    },

    methods: {
        hideCompositeMessagePage() {
            this.$modal.hide('show-composite-message-modal' + '-' + stringValue(this.message.messageUid))
        }
    },

    components: {
        UnknowntMessageContentView,
        // ConferenceInviteMessageContentView,
        CompositeMessageContentView,
        // AudioMessageContentView,
        // CallStartMessageContentView,
        UnsupportMessageContentView,
        TextMessageContentView,
        ImageMessageContentView,
        VideoMessageContentView,
        FileMessageContentView,
        StickerMessageContentView,
    }
}
</script>

<style scoped>

.composite-page {
    width: var(--composite-message-page-width);
    height: var(--composite-message-page-height);
    background: #f7f7f7;
    overflow: scroll;
}

.close-button-container {
    position: absolute;
    padding: 5px 10px 10px 5px;
    top: 0;
    right: 0;
}

.close-button-container:active {
    background: lightgrey;
}

.composite-page ul {
    width: 100%;
    height: 100%;
    padding: 20px 30px;
    list-style-position: inside;
}

.composite-page ul li {
    position: relative;
    padding: 10px 0;
}

.composite-page ul li:not(:last-child)::after {
    content: "";
    width: calc(100% - 55px);
    position: absolute;
    margin-left: 55px;
    padding: 5px 0;
    border-bottom: 1px solid #f1f1f1;
}

.message-container {
    width: 100%;
    display: flex;
}

.name-time-content-container {
    width: 100%;
}

.name-time-container {
    width: 100%;
    padding: 5px 0;
    display: flex;
    justify-content: space-between;
}

.name-time-container p {
    font-size: 12px;
    color: #c2c2c2;
}

.name-time-content-container .content {
    display: inline-block;
    margin-left: -10px;
}

.portrait-container {
    width: 40px;
    height: 40px;
    overflow: hidden;
    margin: 10px;
}

.portrait-container img {
    width: 100%;
    height: 100%;
    border-radius: 3px;
}

>>> .text-message-container.out {
    background-color: #f7f7f7;
}

>>> .text-message-container {
    background-color: #f7f7f7;
    padding-left: 0;
}

>>> .rightarrow::before {
    display: none;
}

>>> .leftarrow::before {
    display: none;
}

</style>
