<template>
    <section>
        <div class="message-time-container" v-bind:class="{checked:sharedPickState.messages.indexOf(message) >= 0}">
            <p v-if="this.message._showTime" class="time">{{ message._timeStr }}</p>
            <div class="message-content-container"
                 v-bind:class="{checked:sharedPickState.messages.indexOf(message) >= 0}">
                <input id="checkbox" v-if="sharedConversationState.enableMessageMultiSelection" type="checkbox"
                       class="checkbox"
                       :value="message" placeholder="" v-model="sharedPickState.messages">
                <RichNotificationMessageContentView :message="message"
                                                    v-if="message.messageContent.type === 12"
                                                    @contextmenu.prevent.native="openMessageContextMenu($event, message)"
                />
                <ArticlesMessageContentView :message="message"
                                            v-else-if="message.messageContent.type === 13"
                                            @contextmenu.prevent.native="openMessageContextMenu($event, message)"
                />
            </div>
        </div>
    </section>
</template>

<script>
import RichNotificationMessageContentView from "./RichNotificationMessageContentView";
import ArticlesMessageContentView from "./ArticlesMessageContentView";
import Message from "../../../../wfc/messages/message";
import store from "../../../../store";

export default {
    name: "ContextableNotificationMessageContentContainerView",
    components: {ArticlesMessageContentView, RichNotificationMessageContentView},
    props: {
        message: {
            type: Message,
            required: true,
        }
    },
    data() {
        return {
            sharedConversationState: store.state.conversation,
            sharedPickState: store.state.pick,
            highLight: false,
        }
    },
    methods: {
        openMessageContextMenu(event, message) {
            this.$parent.$emit('openMessageContextMenu', event, message)
            this.highLight = true;
        },
        onContextMenuClosed() {
            this.highLight = false;
        },
    },
    mounted() {
        this.$parent.$on('contextMenuClosed', this.onContextMenuClosed);
    },
    beforeDestroy() {
        this.$parent.$off('contextMenuClosed', this.onContextMenuClosed);
    },
}
</script>

<style scoped>

.message-time-container {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}


.message-time-container.checked {
    background-color: #e7e7e7;
}

.message-time-container .time {
    width: 100%;
    text-align: center;
    color: #b4b4b4;
    font-size: 10px;
    background-color: #f3f3f3;
}

.message-time-container .receipt {
    margin-right: 70px;
    font-size: 12px;
    color: #b4b4b4;
}

.message-content-container {
    width: 100%;
    display: flex;
    padding: 10px 20px 4px 20px;
    justify-content: center;
    align-items: center;
    position: relative;
}

.message-content-container input {
    position: absolute;
    left: 0;
    margin-left: 20px;
}

</style>
