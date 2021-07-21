<template>
    <div class="friend-request-container" @click.stop="">
        <img class="avatar" :src="userInfo.portrait" alt="">
        <div class="info-action-container">
            <div class="info-container">
                <p class="title">{{ $t('friend_request.request') }}</p>
                <p class="desc">{{ $t('friend_request.send_request_tip', [userInfo.displayName]) }}</p>
            </div>
            <label>
                <input type="text" :placeholder="defaultReason" v-model="reason">
            </label>
            <div class="action-container">
                <button class="cancel" @click="cancel">{{ $t('common.cancel') }}</button>
                <button class="confirm" @click="invite">{{ $t('common.send') }}</button>
            </div>
        </div>
    </div>

</template>

<script>
import wfc from "@/wfc/client/wfc";
import store from "@/store";

export default {
    name: "FriendRequestView",
    props: {
        userInfo: {
            type: Object,
            required: true,
        }
    },
    data() {
        return {
            reason: '',
            sharedContactState: store.state.contact,
        }
    },
    methods: {
        cancel() {
            this.$modal.hide('friend-request-modal')
        },
        invite() {
            wfc.sendFriendRequest(this.userInfo.uid, this.reason, null, () => {
                // TODO
                console.log('send friendRequest success', this.userInfo.uid)
            }, (err) => {
                // TODO
            });
            this.$modal.hide('friend-request-modal')
        }
    },
    computed: {
        defaultReason() {
            let userInfo = this.sharedContactState.selfUserInfo;
            return this.$t('friend_request.im') + userInfo.displayName;
        }
    }
}
</script>

<style lang="css" scoped>
.friend-request-container {
    display: flex;
    flex-direction: row;
    margin: 40px 30px 30px 30px
}

.avatar {
    width: 80px;
    height: 80px;
    border-radius: 3px;
}

.info-action-container {
    width: 100%;
    margin-left: 30px;
    display: flex;
    flex-direction: column;
    align-self: flex-start;
}

.info-action-container input {
    margin-top: 20px;
    height: 30px;
    width: 100%;
    padding: 0 5px;
}

.info-container {
    height: 80px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

.info-container .title {
    font-size: 20px;
    padding-top: 5px;
}

.info-container .desc {
    font-size: 16px;
    padding-bottom: 5px;
}

.info-action-container .action-container {
    margin-top: 20px;
    align-self: flex-end;
}

.info-action-container .action-container button {
    margin: 0 5px 0 20px;
    padding: 3px 20px;
    border-radius: 4px;
    outline: none;
}

.info-action-container .action-container .cancel {
    border: 1px solid #cccccc;
}

.info-action-container .action-container .cancel:active {
    background: #cccccc;
}

.info-action-container .action-container .confirm {
    background-color: #20bf64;
    color: white;
    border: 1px solid white;
}

.info-action-container .action-container .confirm:active {
    background-color: #209f64;
}

</style>
