<template>
    <div class="call-start-message-container"
         @click="startCall"
         v-bind:class="{out:message.direction === 0}">
        <i class="icon-ion-android-call"></i>
        <p class="text" v-html="this.textContent"></p>
    </div>
</template>

<script>
import Message from "../../../../../wfc/messages/message";
import CallEndReason from "../../../../../wfc/av/engine/callEndReason";
import store from "../../../../../store";
import {numberValue} from "../../../../../wfc/util/longUtil";

export default {
    name: "CallStartMessageContentView",
    props: {
        message: {
            type: Message,
            required: true,
        }
    },
    data() {
        return {
            sharedMiscState: store.state.misc,
            sharedContactState: store.state.contact,
        }
    },
    mounted() {
    },

    methods: {
        startCall() {
            let callStartMsgContent = this.message.messageContent;
            let audioOnly = callStartMsgContent.audioOnly;
            this.$startVoipCall({audioOnly: audioOnly, conversation: this.message.conversation});
        },
    },

    computed: {
        textContent() {
            let voip = this.message.messageContent;
            let desc = this.$t('voip.desc');
            if (voip.endTime > 0 && voip.connectTime > 0) {
                let duration = parseInt((numberValue(voip.endTime) - numberValue(voip.connectTime)) / 1000);
                desc = `通话时长：${duration}''`
            } else if (voip.connectTime > 0) {
                desc = '通话中'
            } else {
                let reason = voip.status;
                switch (reason) {
                    case CallEndReason.REASON_Unknown:
                        desc = this.$t('voip.not_answer');
                        break;
                    case CallEndReason.REASON_Busy:
                        desc = '线路忙';
                        break;
                    case CallEndReason.REASON_SignalError:
                        desc = '网络错误';
                        break;
                    case CallEndReason.REASON_Hangup:
                        desc = '已取消';
                        break;
                    case CallEndReason.REASON_RemoteHangup:
                        desc = '对方已取消';
                        break;
                    case CallEndReason.REASON_OpenCameraFailure:
                        desc = '网络错误';
                        break;
                    case CallEndReason.REASON_Timeout:
                        desc = '未接听';
                        break;
                    case CallEndReason.REASON_AcceptByOtherClient:
                        desc = '已在其他端接听';
                        break;
                    case CallEndReason.REASON_AllLeft:
                        desc = '通话已结束';
                        break;
                    case CallEndReason.RemoteBusy:
                        desc = '对方忙';
                        break;
                    case CallEndReason.RemoteTimeout:
                        desc = '对方未接听';
                        break;
                    case CallEndReason.RemoteNetworkError:
                        desc = '对方网络错误';
                        break;
                    case CallEndReason.RoomDestroyed:
                        desc = '通话已结束';
                        break;
                    case CallEndReason.RoomNotExist:
                        desc = '通话已结束';
                        break;
                    case CallEndReason.RoomParticipantsFull:
                        desc = ' 已达最大通话人数';
                        break;
                    default:
                        break

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
    background-color: #a8bdff;
}


.call-start-message-container .text {
    color: #050505;
    font-size: 13px;
}

</style>
