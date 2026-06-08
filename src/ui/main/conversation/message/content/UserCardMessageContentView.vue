<template>
    <div ref="userCardTippy"
         :id="'userCardInfoTrigger' + message.messageId"
         class="user-card-content-container">
        <div class="portrait-name-container">
            <img :src="message.messageContent.portrait">
            <p>{{ message.messageContent.displayName }}</p>
        </div>
        <p class="desc single-line">个人名片</p>
        <tippy
            :to="'#userCardInfoTrigger' + message.messageId"
            interactive
            :animate-fill="false"
            placement="left"
            distant="7"
            theme="light"
            animation="fade"
            trigger="click"
        >
            <template #content>
                <UserCardView v-on:close="closeUserCard" :user-info="userInfo()"/>
            </template>
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
            if (userCard.cardType === 0 || !userCard.cardType) {
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
    margin: 0 8px;
    padding: 8px;
    background-color: var(--background-primary);
    position: relative;
    border-radius: var(--radius-md);
}

.portrait-name-container {
    display: flex;
    align-items: center;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border-secondary);
}

.portrait-name-container img {
    width: 45px;
    height: 45px;
    border-radius: var(--radius-sm);
}

.portrait-name-container p {
    padding-left: 8px;
    padding-right: 8px;
}

.desc {
    padding-top: 8px;
    font-size: var(--font-size-sm);
    color: var(--text-placeholder);
}

.rightarrow:before {
    border-left-color: var(--text-on-accent);
}

</style>
