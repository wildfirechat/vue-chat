<template>
    <div class="conference-info-container">
        <h2>会议详情</h2>
        <div class="item-container">
            <div class="item">
                <p class="title">会议主题</p>
                <p class="desc">{{ conferenceInfo.conferenceTitle }}</p>
            </div>
            <div class="item">
                <p class="title">发起人</p>
                <p class="desc">{{ ownerName }}</p>
            </div>
            <div class="item">
                <p class="title">会议号</p>
                <p class="desc" @click="copyConferenceId">{{ conferenceInfo.conferenceId }}</p>
            </div>
            <div class="item">
                <p class="title">二维码</p>
                <i>&gt;</i>
            </div>
        </div>
        <div class="item-container">
            <div class="item">
                <p class="title">开始时间</p>
                <p class="desc">{{ startTime }}</p>
            </div>
            <div class="item">
                <p class="title">结束时间</p>
                <p class="desc">{{ endTime }}</p>
            </div>
        </div>
        <div class="item-container">
            <div class="item">
                <label>
                    开启视频
                    <input :disabled="audience" v-model="enableVideo" type="checkbox">
                </label>
            </div>
            <div class="item">
                <label>
                    开启音频
                    <input :disabled="audience" v-model="enableAudio" type="checkbox">
                </label>
            </div>
        </div>

        <div class="action-container">
            <button class="destroy" v-if="enableDestroy">
                销毁会议
            </button>
            <button ref="favButton" v-if="new Date().getTime() < conferenceInfo.startTime * 1000" @click="favConference">
                尚未开始，收藏会议
            </button>
            <button v-else-if="conferenceInfo.endTime === 0 || new Date().getTime() < conferenceInfo.endTime * 1000" @click="joinConference">
                加入会议
            </button>
            <button v-else :disabled="true">
                会议已结束
            </button>
        </div>
    </div>
</template>

<script>
import wfc from "../../../wfc/client/wfc";
import avenginekitproxy from "../../../wfc/av/engine/avenginekitproxy";
import conferenceApi from "../../../api/conferenceApi";
import conferenceManager from "./conferenceManager";
import {copyText} from "../../util/clipboard";

export default {
    name: "ConferenceInfoView",
    props: {
        conferenceInfo: {
            type: Object,
            required: true,
        }
    },
    data() {
        return {
            enableVideo: false,
            enableAudio: false,
            ownerName: '',
        }
    },
    mounted() {
        console.log('conferenceInfo', this.conferenceInfo);
        this.ownerName = wfc.getUserDisplayName(this.conferenceInfo.owner);
    },
    methods: {
        favConference() {
            conferenceApi.favConference(this.conferenceInfo.conferenceId)
                .then(r => {
                    this.$refs.favButton.title = '已收藏';
                    this.$refs.favButton.disabled = true;
                })
                .catch(err => {
                    console.error('favConference error', err);
                })
        },
        joinConference() {
            let info = this.conferenceInfo;
            console.log('joinConference', info);
            let audience = !this.enableVideo && !this.enableAudio
            avenginekitproxy.joinConference(info.conferenceId, false, info.pin, info.owner, info.conferenceTitle, '', audience, info.advance, !this.enableAudio, !this.enableVideo);
            this.$modal.hide('conference-info-modal');
        },
        copyConferenceId(){
            copyText(this.conferenceInfo.conferenceId)
            this.$notify({
                text: '会议号已复制',
                type: 'info'
            });
        }
    },
    computed: {
        startTime() {
            let date = new Date(this.conferenceInfo.startTime * 1000);
            return date.toString();
        },
        endTime() {
            if (!this.conferenceInfo.endTime) {
                return '-'
            }

            let date = new Date(this.conferenceInfo.endTime * 1000)
            return date.toString();
        },
        audience() {
            return !(this.conferenceInfo.owner === conferenceManager.selfUserId || !this.conferenceInfo.audience || this.conferenceInfo.allowSwitchMode)
                // Safari 浏览器，不支持直接静音自动播放音视频
                || navigator.vendor.indexOf('Apple') > 0
        },
        enableDestroy() {
            return this.conferenceInfo.owner === conferenceManager.selfUserId && new Date().getTime() < this.conferenceInfo.startTime * 1000;
        }
    }
}
</script>

<style scoped>

.conference-info-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: #f8f8f8;
}

.conference-info-container h2 {
    justify-content: center;
    font-weight: normal;
    font-style: normal;
    font-size: 18px;
    background: white;
    text-align: center;
    padding: 20px 0;
}

.item-container {
    background: white;
    margin-bottom: 20px;
    font-size: 14px;
}

.item {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    padding: 12px 20px;
    border-spacing: 20px;
}


/*.item:active {*/
/*    background: #d6d6d6;*/
/*}*/

.item:not(:last-of-type) {
    border-bottom: 1px solid #f1f1f1;
}

.item .desc {
    color: gray;
}

.item label {
    width: 100%;
    display: flex;
    justify-content: space-between;
}

.action-container {
    display: flex;
    margin: 0 10px;
}

button {
    background: white;
    width: 100%;
    text-align: center;
    vertical-align: middle;
    height: 40px;
    line-height: 40px;
    border: none;
}

button:active {
    background: lightgrey;
}

button.destroy {
    margin-right: 10px;
    color: red;
}

</style>
