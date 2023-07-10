<template>
    <div class="conference-simple-info-container">
        <p class="title">xxx的会议</p>
        <div class="info-item">
            <p class="name">会议号</p>
            <p class="value">{{ session.callId }}</p>
            <i class="icon-ion-ios-copy" @click="copyConferenceId"></i>
        </div>
        <div class="info-item">
            <p class="name">主持人</p>
            <p class="value">{{ hostName() }}</p>
        </div>
        <div class="info-item">
            <p class="name">会议链接</p>
            <p class="value single-line">{{ conferenceLink() }}</p>
            <i class="icon-ion-ios-copy" @click="copyConferenceLink"></i>
        </div>
    </div>
</template>

<script>
import WfcScheme from "../../../wfcScheme";
import wfc from "../../../wfc/client/wfc";
import {copyText} from "../../util/clipboard";
export default {
    name: "ConferenceSimpleInfoView",
    props: {
        session: {
            type: Object,
            required: true
        }
    },
    methods: {
        conferenceLink() {
            return WfcScheme.buildConferenceLink(this.session.callId, this.session.pin);
        },
        hostName() {
            let userInfo = wfc.getUserInfo(this.session.host);
            return userInfo.displayName;
        },
        copyConferenceId() {
            copyText(this.session.callId)
        },
        copyConferenceLink() {
            copyText(this.conferenceLink())
        }
    }
}
</script>

<style scoped>

.conference-simple-info-container {
    background: white;
    padding: 5px 10px;
    width: 300px;
    border-radius: 2px;
    box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);
}

.title {
    padding-bottom: 10px;
}

.info-item {
    display: flex;
    font-size: 14px;
    align-items: center;
}

.info-item .name {
    width: 60px;
    min-width: 60px;
    font-size: 13px;
    color: #2d3033;
}

.info-item .value {
    flex: 1 1 auto;
    color: gray;
    text-overflow: ellipsis;
    overflow: hidden;
}

</style>
