<template>
    <div class="password-form-container">
        <p class="title">修改密码</p>
        <div class="item">
            <input v-model.trim="oldPassword" class="text-input" type="number" placeholder="请输入旧密码">
        </div>
        <div class="item">
            <input v-model.trim="newPassword" class="text-input" type="text" placeholder="请输入新密码">
        </div>
        <div class="item">
            <input v-model.trim="confirmPassword" class="text-input" type="text" placeholder="请再次输入新密码">
        </div>
        <p class="tip" v-if="newPassword && confirmPassword && newPassword !== confirmPassword">两次输入的密码不一致</p>
        <button class="confirm-button" :disabled="oldPassword === '' || newPassword === '' || confirmPassword === '' || newPassword !== confirmPassword" @click="showSlideVerify">确定</button>

        <!-- 滑动验证组件 -->
        <SlideVerifyDialog
            ref="slideVerifyDialog"
            @verify-success="onSlideVerifySuccess"
            @verify-failed="onSlideVerifyFailed"
            @load-failed="onSlideVerifyLoadFailed"
        />
    </div>
</template>

<script>

import appServerApi from "../../../api/appServerApi";
import SlideVerifyDialog from "../../common/SlideVerifyDialog.vue";

export default {
    name: "CreateConferenceView",
    components: {
        SlideVerifyDialog,
    },
    data() {
        return {
            oldPassword: '',
            newPassword: '',
            confirmPassword: '',
        }
    },

    methods: {
        showSlideVerify() {
            this.$refs.slideVerifyDialog.show();
        },

        async changePassword(slideVerifyToken) {
            this.$modal.hide('change-password-modal')
            appServerApi.changePassword(this.oldPassword, this.newPassword, slideVerifyToken)
                .then(response => {
                    this.$notify({
                        text: '修改密码成功',
                        type: 'info'
                    });
                    // 清空输入框
                    this.oldPassword = '';
                    this.newPassword = '';
                    this.confirmPassword = '';
                })
                .catch(err => {
                    this.$notify({
                        title: '修改密码失败',
                        text: err.message,
                        type: 'error'
                    });
                })
        },

        // 滑动验证成功回调
        onSlideVerifySuccess(token) {
            console.log('[ChangePassword] 滑动验证成功，token:', token);
            this.changePassword(token);
        },

        // 滑动验证失败回调
        onSlideVerifyFailed() {
            console.log('[ChangePassword] 滑动验证失败');
        },

        // 滑动验证加载失败回调
        onSlideVerifyLoadFailed() {
            console.log('[ChangePassword] 滑动验证加载失败');
            this.$notify({
                text: '验证码加载失败，请重试',
                type: 'error'
            });
        }
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
