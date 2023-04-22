<template>
    <div class="create-conference-container">
        <h2>预定会议</h2>
        <input v-model="title" class="text-input" type="text" placeholder="会议标题">
        <input v-if="false" v-model="desc" class="text-input" type="text" placeholder="会议描述">
        <label>
            开始时间
            <input v-model="startTime" type="datetime-local">
        </label>
        <label>
            结束时间
            <input v-model="endTime" type="datetime-local">
        </label>
        <label>
            参与者开启摄像头、麦克风入会
            <input v-model="audience" type="checkbox">
        </label>
        <label>
            允许参与者自主开启摄像头和麦克风
            <input :disabled="audience" v-model="allowTurnOnMic" type="checkbox">
        </label>
        <div>
            <label>
                启用密码
                <input v-model="enablePin" type="checkbox">
            </label>
            <input v-if="enablePin" v-model="pin" class="text-input" style="margin-top: 10px" type="tel" maxlength="4" placeholder="123456">
        </div>
        <div>
            <label>
                使用个人会议号
                <input v-model="enableUserCallId" type="checkbox">
            </label>
            <p style="font-size: 12px">{{ callId }}</p>
        </div>
        <div>
            <label>
                大规模会议
                <input v-model="advance" type="checkbox">
            </label>
            <p class="advance_desc">参会人数大于50人</p>
        </div>

        <button :disabled="!actionEnable" @click="orderConference">预定会议
        </button>
    </div>
</template>

<script>
import ConferenceInfo from "../../../wfc/av/model/conferenceInfo";
import conferenceApi from "../../../api/conferenceApi";
import conferenceManager from "./conferenceManager";

export default {
    name: "CreateConferenceView",
    data() {
        return {
            title: '',
            desc: '',
            startTime: '',
            endTime: '',
            audioOnly: false,
            audience: false,
            advance: false,
            allowTurnOnMic: false,
            enablePin: false,
            pin: '',
            enableUserCallId: false,
            callId: '1234567',
        }
    },

    methods: {
        orderConference() {
            console.log('order Conference')
            let info = new ConferenceInfo();
            info.conferenceTitle = this.title;
            if (this.enableUserCallId) {
                info.conferenceId = this.callId;
            }
            if (this.password) {
                info.password = this.password;
            }
            info.pin = '' + Math.ceil((1 + Math.random() * 100000) / 10);

            info.owner = conferenceManager.selfUserId;
            info.startTime = Math.ceil(new Date(this.startTime).getTime() / 1000);
            info.endTime = Math.ceil(new Date(this.endTime).getTime() / 1000);
            info.audience = this.audience;
            info.allowSwitchMode = this.allowTurnOnMic;
            info.advance = this.advance;

            conferenceApi.createConference(info)
                .then(r => {
                    console.log('createConference success', r)
                })
                .catch(err => {
                    console.log('createConference error', err)
                })
            this.$modal.hide('order-conference-modal')
        }
    },
    computed: {
        actionEnable() {
            if (this.title && this.title.trim() && this.startTime && this.endTime) {
                let now = new Date().getTime();
                let start = new Date(this.startTime).getTime();
                let end = new Date(this.endTime).getTime();
                return start > now && end > start;
            }
            return false;
        }
    },
    watch: {
        advance() {
            // 超级会议模式，一般参会人员会很多，但不需要所有人都能发言；互动模式，是允许每个人发言
            // 开启超级会之后，需要再次确认开启互动模式
            if (this.advance) {
                this.audience = false;
            }
        },
        startTime() {
            if (this.startTime) {
                let start = new Date(this.startTime).getTime();
                if (start < new Date().getTime()) {
                    this.$notify({
                        text: '开始时间不能早于当前时间',
                        type: 'warn'
                    });
                    this.startTime = '';
                }
            }
        },
        endTime() {
            if (this.endTime) {
                let end = new Date(this.endTime).getTime();
                let now = new Date().getTime();
                if (end < now) {
                    this.$notify({
                        text: '开始时间不能早于当前时间',
                        type: 'warn'
                    });
                    this.endTime = '';
                }
                if (this.startTime) {
                    let start = new Date(this.startTime).getTime();
                    if (end < start) {
                        this.$notify({
                            text: '结束时间不能早于当前时间',
                            type: 'warn'
                        });
                        this.endTime = '';
                    }
                }
            }
        }
    }
}
</script>

<style scoped lang="css">

.create-conference-container {
    display: flex;
    flex-direction: column;
    padding: 0 20px;
}

.create-conference-container h2 {
    justify-content: center;
    font-weight: normal;
    font-style: normal;
    font-size: 18px;
    text-align: center;
}

.create-conference-container label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
}

.text-input {
    height: 30px;
    border: 1px solid #e5e5e5;
    border-radius: 3px;
    outline: none;
    width: 100%;
    padding: 0 5px;
}

.text-input:active {
    border: 1px solid #4168e0;
}

.text-input:focus {
    border: 1px solid #4168e0;
}

.create-conference-container button {
    height: 40px;
    border: none;
}

.create-conference-container button:active {
    border: 1px solid #4168e0;
}

.advance_desc {
    font-size: 12px;
    color: #F95569;
}

.create-conference-container > * {
    margin-top: 20px;
}

</style>
