<template>
    <div ref="userCardTippy"
         :name="'userCardInfoTrigger' + message.messageId"
         class="user-card-content-container">
        <div class="portrait-name-container">
            <img :src="message.messageContent.portrait">
            <p>{{ message.messageContent.displayName }}</p>
        </div>
        <p class="desc single-line">个人名片</p>
        <tippy
            :to="'userCardInfoTrigger' + message.messageId"
            interactive
            :animate-fill="false"
            placement="left"
            distant="7"
            theme="light"
            animation="fade"
            trigger="click"
        >
            <UserCardView v-on:close="closeUserCard" :user-info="userInfo()"/>
        </tippy>
    </div>
</template>

<script>
import Message from "../../../../../wfc/messages/message";
import UserCardView from "../../../user/UserCardView";
import wfc from "../../../../../wfc/client/wfc";

export default {
    name: "UserCardMessageContentView",
    props: {
        message: {
            required: true,
            type: Message,
        }
    },
    components: {
        UserCardView,
    },

    methods: {
        closeUserCard() {
            console.log('closeUserCard')
            this.$refs["userCardTippy"]._tippy.hide();
        },
        userInfo() {
            let userCard = this.message.messageContent;
            if (userCard.cardType === 0) {
                return wfc.getUserInfo(userCard.target)
            }
        }
    }
}
</script>

<style scoped lang="css">
.user-card-content-container {
    width: 230px;
    height: 100px;
    margin: 0 10px;
    padding: 10px;
    background-color: white;
    position: relative;
    border-radius: 5px;
}

.portrait-name-container {
    display: flex;
    align-items: center;
    padding-bottom: 10px;
    border-bottom: 1px solid #eeeeee;
}

.portrait-name-container img {
    width: 45px;
    height: 45px;
    border-radius: 3px;
}

.portrait-name-container p {
    padding-left: 10px;
    padding-right: 10px;
}

.desc {
    padding-top: 8px;
    font-size: 13px;
    color: #b8b8b8;
}

</style>