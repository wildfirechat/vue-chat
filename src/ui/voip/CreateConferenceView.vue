<template>
    <div class="create-conference-container">
        <h2>发起会议</h2>
        <input v-model="title" class="text-input" type="text" placeholder="会议标题">
        <input v-model="desc" class="text-input" type="text" placeholder="会议描述">
        <label>
            开启视频
            <input v-model="audioOnly" type="checkbox">
        </label>
        <label>
            互动会议
            <input v-model="audience" type="checkbox">
        </label>
        <label>
            超级会议
            <input v-model="advance" type="checkbox">
        </label>

        <button :disabled="title.trim() === '' || desc.trim() === ''" @click="createConference">开始会议
        </button>
    </div>
</template>

<script>
import wfc from "../../wfc/client/wfc";
import avenginekitproxy from "../../wfc/av/engine/avenginekitproxy";

export default {
    name: "CreateConferenceView",
    data() {
        return {
            title: '',
            desc: '',
            audioOnly: false,
            audience: false,
            advance: false,
        }
    },

    methods: {
        createConference() {
            let userId = wfc.getUserId();
            avenginekitproxy.startConference(null, !this.audioOnly, '', userId, this.title, this.desc, !this.audience, this.advance);
            this.$modal.hide('create-conference-modal')
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

.create-conference-container .text-input {
    height: 30px;
    border: 1px solid #e5e5e5;
    border-radius: 3px;
    outline: none;
    padding: 0 5px;
}

.create-conference-container .text-input:active {
    border: 1px solid #4168e0;
}

.create-conference-container .text-input:focus {
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

.create-conference-container > * {
    margin-top: 20px;
}

</style>
