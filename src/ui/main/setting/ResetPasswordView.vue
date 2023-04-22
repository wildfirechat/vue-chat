<template>
    <div class="password-form-container">
        <p class="title">重置密码</p>
        <div class="item">
            <input v-model="resetAuthCode" class="text-input" type="number" placeholder="验证码">
            <button class="request-auth-code-button" @click="requestResetAuthCode">获取验证码</button>
        </div>
        <div class="item">
            <input v-model="newPassword" class="text-input" type="text" placeholder="请输入新密码">
        </div>
        <div class="item">
            <input v-model="confirmPassword" class="text-input" type="text" placeholder="请再次输入新密码">
        </div>
        <p class="tip" v-if="newPassword && confirmPassword && newPassword !== confirmPassword">两次输入的密码不一致</p>
        <button class="confirm-button" :disabled="resetAuthCode.trim() === '' || newPassword.trim() === '' || confirmPassword.trim() === ''" @click="resetPassword">确定</button>
    </div>
</template>

<script>

import appServerApi from "../../../api/appServerApi";

export default {
    name: "CreateConferenceView",
    data() {
        return {
            resetAuthCode: '',
            newPassword: '',
            confirmPassword: '',
        }
    },

    methods: {
        async requestResetAuthCode() {
            this.$modal.hide('reset-password-modal')
            appServerApi.requestResetPasswordAuthCode()
                .then(response => {
                    this.$notify({
                        text: '发送重置验证码成功',
                        type: 'info'
                    });
                })
                .catch(err => {
                    this.mobile = '';
                    this.$notify({
                        title: '发送重置验证码失败',
                        text: err.message,
                        type: 'error'
                    });
                })
        },

        async resetPassword() {
            appServerApi.resetPassword(this.resetAuthCode, this.newPassword)
                .then(response => {
                    this.$notify({
                        text: '重置密码成功',
                        type: 'info'
                    });
                })
                .catch(err => {

                    this.mobile = '';
                    this.$notify({
                        title: '重置密码失败',
                        text: err.message,
                        type: 'error'
                    });
                })
        },
    },
}
</script>

<style scoped lang="css">

.password-form-container {
    width: 100%;
    padding: 0 20px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

.password-form-container .title {
    padding-top: 20px;
    font-size: 18px;
}

.password-form-container .tip {
    align-self: flex-start;
    font-size: 12px;
    color: #4168e0;
    margin-top: 10px;
}

.password-form-container .item {
    width: 100%;
    font-size: 13px;
    margin-top: 20px;
    position: relative;
}

.password-form-container .text-input {
    height: 40px;
    width: 100%;
    border: 1px solid #e5e5e5;
    border-radius: 3px;
    outline: none;
    padding: 0 5px;
    -moz-appearance: textfield;
}

input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}

.password-form-container .text-input:active {
    border: 1px solid #4168e0;
}

.password-form-container .text-input:focus {
    border: 1px solid #4168e0;
}

.password-form-container .confirm-button {
    height: 40px;
    width: 100%;
    margin-top: 20px;
    border: 1px solid #e5e5e5;
    border-radius: 3px;
}

.password-form-container .confirm-button:active {
    border: 1px solid #4168e0;
}

.password-form-container .request-auth-code-button {
    position: absolute;
    font-size: 12px;
    top: 50%;
    right: 0;
    transform: translateY(-50%);
    margin: 0 5px;
}

</style>
