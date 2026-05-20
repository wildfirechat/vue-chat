<template>
    <div class="meeting-minutes-message-container"
         @click="onClick"
         v-bind:class="{out:message.direction === 0}">
        <div class="content-wrapper">
            <p v-if="title" class="title">{{ title }}</p>
            <p class="text" v-html="this.$xss(formattedText)"></p>
        </div>
    </div>
</template>

<script>
import Message from "../../../../../wfc/messages/message";
import {isElectron, shell} from "../../../../../platform";
import Config from "../../../../../config";

export default {
    name: "MeetingMinutesMessageContentView",
    props: {
        message: {
            type: Message,
            required: true,
        }
    },

    computed: {
        title() {
            return this.message.messageContent.title;
        },
        formattedText() {
            let text = this.message.messageContent.text || '';
            return text.replace(/\n/g, '<br>');
        }
    },

    methods: {
        onClick() {
            let meetingId = this.message.messageContent.meetingId;
            let isFromMinutesRobot = this.message.conversation.target === Config.AI_MINUTES_ROBOT_ID
                || this.message.from === Config.AI_MINUTES_ROBOT_ID;
            if (Config.AI_MINUTES_ROBOT_ID && Config.MINUTES_URL
                && isFromMinutesRobot
                && meetingId) {
                let url = `${Config.MINUTES_URL}?conferenceId=${encodeURIComponent(meetingId)}`;
                if (isElectron()) {
                    shell.openExternal(url);
                } else {
                    this.$router.push({
                        path: '/home/h-wp',
                        query: { url: encodeURIComponent(url) }
                    });
                }
            }
        }
    }
}
</script>

<style lang="css" scoped>
.meeting-minutes-message-container {
    margin: 0 10px;
    padding: 10px;
    background-color: var(--background-primary);
    position: relative;
    border-radius: 5px;
    display: flex;
    align-items: flex-start;
    max-width: 400px;
    cursor: pointer;
}

.meeting-minutes-message-container.out {
    background-color: var(--background-message-out);
}

.content-wrapper {
    display: flex;
    flex-direction: column;
}

.title {
    color: var(--text-primary);
    font-size: 15px;
    font-weight: bold;
    line-height: 22px;
    margin: 0 0 4px 0;
    word-break: break-word;
}

.text {
    color: var(--text-secondary);
    font-size: 13px;
    line-height: 20px;
    margin: 0;
    word-break: break-word;
}
</style>
