<template>
    <div class="conference-invite-message-container"
         @click="showConferenceInfo"
         v-bind:class="{out:message.direction === 0}">
        <div class="flex-row flex-align-center">
            <img class="avatar" alt="host" :src="portrait">
            <div class="flex-1">
                <p class="single-line title">{{ message.messageContent.title }} </p>
                <p class="single-line desc">{{ message.messageContent.desc }}</p>
            </div>
        </div>
        <p class="type">会议邀请</p>
    </div>
</template>

<script>
import Message from "../../../../../wfc/messages/message";
import avenginekitproxy from "../../../../../wfc/av/engine/avenginekitproxy";
import avenginekit from "../../../../../wfc/av/internal/engine.min";
import store from "../../../../../store";
import ConversationType from "../../../../../wfc/model/conversationType";
import ConferenceInfoView from "../../../../voip/conference/ConferenceInfoView";
import conferenceApi from "../../../../../api/conferenceApi";
import Config from "../../../../../config";

export default {
    name: "ConferenceInviteMessageContentView",
    props: {
        message: {
            type: Message,
            required: true,
        }
    },
    mounted() {
    },

    methods: {
        joinConference() {
            if (avenginekit.sendConferenceRequest) {
                let cmc = this.message.messageContent;
                avenginekitproxy.joinConference(cmc.callId, cmc.audioOnly, cmc.pin, cmc.host, cmc.title, cmc.desc, cmc.audience, cmc.advanced, false, false)
            } else {
                this.$notify({
                    title: '不支持会议功能',
                    text: '请使用会议版engine文件',
                    type: 'warn'
                });
            }
        },
        showConferenceInfo() {
            if (avenginekit.sendConferenceRequest) {
                let cmc = this.message.messageContent;
                conferenceApi.queryConferenceInfo(cmc.callId, cmc.password)
                    .then(info => {
                        this.showConferenceInfoDialog(info);
                    })
                    .catch(err => {
                        console.error('query conference info error', err);
                        this.$notify({
                            title: '加载会议信息失败',
                            text: err.message,
                            type: 'warn'
                        });
                    });
            } else {
                this.$notify({
                    title: '不支持会议功能',
                    text: '请使用会议版engine文件',
                    type: 'warn'
                });
            }
        },
        showConferenceInfoDialog(info) {
            let beforeOpen = () => {
                console.log('Opening...')
            };
            let beforeClose = (event) => {
                console.log('Closing...', event, event.params)
            };
            let closed = (event) => {
                console.log('Close...', event)
            };
            this.$modal.show(
                ConferenceInfoView,
                {
                    conferenceInfo: info,
                }, null, {
                    name: 'conference-info-modal',
                    width: 320,
                    height: 600,
                    clickToClose: true,
                }, {
                    'before-open': beforeOpen,
                    'before-close': beforeClose,
                    'closed': closed,
                })

        },
    },

    computed: {
        textContent() {
            let conferenceInviteMessageContent = this.message.messageContent;
            return '会议邀请' + ' ' + conferenceInviteMessageContent.title + ' ' + conferenceInviteMessageContent.desc;
        },

        portrait() {
            let content = this.message.messageContent;
            if (!content.host) {
                return Config.DEFAULT_PORTRAIT_URL;
            }
            let groupId = this.message.conversation.type === ConversationType.Group ? this.message.conversation.target : '';
            let userInfos = store.getUserInfos([content.host], groupId)
            return userInfos[0].portrait;
        }
    }
}
</script>

<style lang="css" scoped>
.conference-invite-message-container {
    margin: 0 10px;
    padding: 5px;
    background-color: white;
    width: 250px;
    max-width: 250px;
    position: relative;
    border-radius: 5px;
}

.avatar {
    width: 60px;
    height: 60px;
    border-radius: 3px;
    background: lightgrey;
    margin: 5px 10px;
}

.type {
    padding-top: 5px;
    margin: 5px 10px 0 10px;
    border-top: 1px solid rgba(211, 211, 211, 0.4);
    font-size: 14px;
    color: gray;
}

.title {
    font-size: 16px;
    color: black;
}

.desc {
    font-size: 14px;
    color: gray;
}

</style>
