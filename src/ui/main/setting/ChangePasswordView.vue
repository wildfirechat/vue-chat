<template>
    <div class="password-form-container">
        <p class="title">修改密码</p>
        <div class="item">
            <input v-model="oldPassword" class="text-input" type="number" placeholder="请输入旧密码">
        </div>
        <div class="item">
            <input v-model="newPassword" class="text-input" type="text" placeholder="请输入新密码">
        </div>
        <div class="item">
            <input v-model="confirmPassword" class="text-input" type="text" placeholder="请再次输入新密码">
        </div>
        <p class="tip" v-if="newPassword && confirmPassword && newPassword !== confirmPassword">两次输入的密码不一致</p>
        <button class="confirm-button" :disabled="oldPassword.trim() === '' || newPassword.trim() === '' || confirmPassword.trim() === ''" @click="changePassword">确定</button>
    </div>
</template>

<script>

import axios from "axios";

export default {
    name: "CreateConferenceView",
    data() {
        return {
            oldPassword: '',
            newPassword: '',
            confirmPassword: '',
        }
    },

    methods: {
        async changePassword() {
            this.$modal.hide('change-password-modal')
            let response = await axios.post('/change_pwd', {
                oldPassword: this.oldPassword,
                newPassword: this.newPassword,
            }, {withCredentials: true});
            if (response.data) {
                if (response.data.code === 0) {
                    this.$notify({
                        text: '修改密码成功',
                        type: 'info'
                    });
                } else {
                    this.$notify({
                        title: '修改密码失败',
                        text: response.data.message,
                        type: 'error'
                    });
                }
            } else {
                console.error('changePassword error', response)
            }
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

.password-form-container .confirm-auth-code-button {
    position: absolute;
    font-size: 12px;
    top: 50%;
    right: 0;
    transform: translateY(-50%);
    margin: 0 5px;
}

</style>
