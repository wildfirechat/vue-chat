<template>
    <div class="join-conference-container">
        <h2>加入会议</h2>
        <div class="conf-item">
            <p>会议号</p>
            <input class="conf-item input" v-model="conferenceId" type="text" placeholder="请输入会议号">
        </div>
        <div class="conf-item">
            <p>会议密码</p>
            <input class="conf-item input" v-model="password" type="text" placeholder="请输入会议密码，如果没有，忽略">
        </div>
        <div class="action-container">
            <button class="join" :disabled="conferenceId.trim() === '' " @click="joinConference">
                加入会议
            </button>
            <button @click="cancel">
                取消
            </button>
        </div>
    </div>
</template>

<script>
import conferenceApi from "../../../api/conferenceApi";
import ConferenceInfoView from "./ConferenceInfoView.vue";

export default {
    name: "CreateConferenceView",
    data() {
        return {
            conferenceId: '',
            password: '',
        }
    },

    methods: {
        joinConference() {
            conferenceApi.queryConferenceInfo(this.conferenceId, this.password)
                .then(info => {
                    console.log('conferenceInfo', info);
                    this.$modal.show(
                        ConferenceInfoView,
                        {
                            conferenceInfo: info,
                        }, null, {
                            name: 'conference-info-modal',
                            width: 320,
                            height: 580,
                            clickToClose: true,
                        }, {})
                    this.$modal.hide('join-conference-modal')
                })
                .catch(reason => {
                    console.log('queryConferenceInfo failed', reason);
                    this.$modal.hide('join-conference-modal')
                    this.$notify({
                        text: '获取会议信息失败',
                        type: 'warn'
                    });
                })
        },
        cancel() {
            this.$modal.hide('join-conference-modal')
        }
    },
    watch: {
        advance() {
            // 超级会议模式，一般参会人员会很多，但不需要所有人都能发言；互动模式，是允许每个人发言
            // 开启超级会之后，需要再次确认开启互动模式
            if (this.advance) {
                this.audience = false;
            }
        }
    }
}
</script>

<style scoped lang="css">

.join-conference-container {
    display: flex;
    flex-direction: column;
    padding: 0 20px;
}

.join-conference-container h2 {
    justify-content: center;
    font-weight: normal;
    font-style: normal;
    font-size: 18px;
    text-align: center;
}

.join-conference-container label {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
}

.conf-item {

}

.conf-item input {
    width: 100%;
    height: 30px;
    margin-top: 10px;
    border: 1px solid #e5e5e5;
    border-radius: 3px;
    outline: none;
    padding: 0 5px;
}

.conf-item input:active {
    border: 1px solid #4168e0;
}

.conf-item input:focus {
    border: 1px solid #4168e0;
}

.action-container {
    display: flex;
}

.action-container button {
    height: 40px;
    width: 50%;
    border: none;
}

.action-container button.join {
    margin-right: 10px;
}

.action-container button:active {
    width: 50%;
    border: 1px solid #4168e0;
}

.advance_desc {
    font-size: 12px;
    color: #F95569;
}

.join-conference-container > * {
    margin-top: 20px;
}

</style>
