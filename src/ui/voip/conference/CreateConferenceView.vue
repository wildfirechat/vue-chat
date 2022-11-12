<template>
    <div class="create-conference-container">
        <h2>发起会议</h2>
        <input v-model="title" class="text-input" type="text" placeholder="会议标题">
        <input v-if="false" v-model="desc" class="text-input" type="text" placeholder="会议描述">
        <label>
            开始时间
            <span>现在</span>
        </label>
        <label>
            结束时间
            <input v-model="endTime" :min="new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('.')[0]" type="datetime-local">
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
                <input v-model="enablePassword" type="checkbox">
            </label>
            <input v-if="enablePassword" v-model="password" class="text-input" style="margin-top: 10px" type="tel" maxlength="4" placeholder="123456">
        </div>
        <div>
            <label>
                使用个人会议号
                <!--                TODO -->
                <input v-model="enableUserCallId" :disabled="true" type="checkbox">
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

        <div class="action-container">
            <button class="create-button" :disabled="!actionEnable" @click="createConference">创建会议</button>
            <button class="join-button" :disabled="!actionEnable" @click="createAndJoinConference">进入会议</button>
        </div>
    </div>
</template>

<script>
import wfc from "../../../wfc/client/wfc";
import avenginekitproxy from "../../../wfc/av/engine/avenginekitproxy";
import conferenceApi from "../../../api/conferenceApi";
import ConferenceInfo from "../../../wfc/av/model/conferenceInfo";
import IpcSub from "../../../ipc/ipcSub";
import conferenceManager from "./conferenceManager";

export default {
    name: "CreateConferenceView",
    data() {
        return {
            title: '',
            desc: '',
            endTime: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000 + 1 * 60 * 60 * 1000).toISOString().split('.')[0],
            audience: false,
            advance: false,
            allowTurnOnMic: true,
            enablePassword: false,
            password: '',
            enableUserCallId: false,
            callId: '',
        }
    },
    async mounted() {
        this.callId = await conferenceApi.getMyPrivateConferenceId();
    },

    methods: {
        async _createConference() {
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
            info.startTime = Math.ceil(new Date().getTime() / 1000);
            info.endTime = Math.ceil(new Date(this.endTime).getTime() / 1000);
            info.audience = this.audience;
            info.allowSwitchMode = this.allowTurnOnMic;
            info.advance = this.advance;

            info.conferenceId = await conferenceApi.createConference(info)
            return info;
        },
        createConference() {
            this._createConference()
                .then(info => {
                    this.$notify({
                        text: '创建会议 成功',
                        type: 'info'
                    });
                })
                .catch(err => {
                    this.$notify({
                        title: '创建会议失败',
                        text: err.message,
                        type: 'error'
                    });
                })
            this.$modal.hide('create-conference-modal')
        },
        createAndJoinConference() {
            this._createConference()
                .then(info => {
                    console.log('createAndJoin conference', info);
                    avenginekitproxy.startConference(info.conferenceId, false, info.pin, info.owner, info.conferenceTitle, this.desc, info.audience, info.advance);
                })
                .catch(err => {
                    this.$notify({
                        title: '创建会议失败',
                        text: err.message,
                        type: 'error'
                    });
                })
            this.$modal.hide('create-conference-modal')
        }
    },
    computed: {
        actionEnable() {
            let now = new Date().getTime();
            return this.title && this.title.trim() && this.endTime && new Date(this.endTime).getTime() > now;
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
        endTime() {
            if (this.endTime) {
                if (new Date(this.endTime).getTime() < new Date().getTime()) {
                    this.endTime = '';
                    this.$notify({
                        text: '结束时间不能小于当前时间',
                        type: 'warn'
                    })
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
    height: 30px;
    border: 1px solid #e5e5e5;
    border-radius: 3px;
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

.action-container {
    display: flex;
    justify-content: space-between;
}

.action-container button {
    width: 50%;
    height: 40px;
    border: none;
}

.create-button {
    margin-right: 10px;
}

.create-button:enabled {
    color: gray;
}

.join-button:enabled {
    color: #4168e0;
}

</style>
