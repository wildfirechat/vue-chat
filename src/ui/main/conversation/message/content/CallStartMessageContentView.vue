<template>
    <div class="call-start-message-container"
         v-bind:class="{out:message.direction === 0}">
        <i class="icon-ion-android-call"></i>
        <p class="text" v-html="this.textContent"></p>
    </div>
</template>

<script>
import Message from "@/wfc/messages/message";

export default {
    name: "CallStartMessageContentView",
    props: {
        message: {
            type: Message,
            required: true,
        }
    },
    mounted() {
    },

    computed: {
        textContent() {
            let voip = this.message.messageContent;
            let desc = this.$t('voip.desc');
            if (voip.status === 0) {
                desc = this.$t('voip.not_answer');

            } else if (voip.status === 1) {
                desc = this.$t('voip.ongoing');
            } else {
                if (voip.connectTime && voip.connectedTime > 0) {
                    let duration = (voip.endTime - voip.connectTime()) / 1000;
                    desc = this.$t('voip.duration') + ` : ${duration}`

                } else {
                    desc = this.$t('voip.desc');
                }
            }
            return desc;
        }
    }
}
</script>

<style lang="css" scoped>
.call-start-message-container {
    margin: 0 10px;
    padding: 10px;
    background-color: white;
    position: relative;
    border-radius: 5px;
    display: flex;
    align-items: center;
}

.call-start-message-container p {
    padding-left: 5px;
    white-space: pre-line;
}

.call-start-message-container.out {
    background-color: #98ea70;
}


.call-start-message-container .text {
    color: #050505;
    font-size: 16px;
}

</style>
