<template>
    <section @click.stop="" class="user-info-container">
        <div class="header">
            <div class="desc">
                <h2>{{ userInfo.displayName }}</h2>
                <label>{{ $t('common.wfc_id') + ': ' + userInfo.name }}</label>
            </div>
            <div>
                <img class="avatar" draggable="false" v-bind:src="userInfo.portrait"/>
            </div>
        </div>
        <div class="content">
            <ul>
                <li v-if="isFriend">
                    <label>{{ $t('common.alias') }}</label>
                    <div class="alias">
                        <input @click.stop="" type="text"
                               v-model="friendAlias"
                               @keyup.enter="updateFriendAlias"
                               placeholder="备注名"/>
                    </div>
                </li>
                <li>
                    <label>{{ $t('common.area') }}</label>
                    <div>{{ $t('misc.beijing') }}</div>
                </li>
                <li>
                    <label>{{ $t('common.label') }}</label>
                    <div>{{ $t('misc.test_user') }}</div>
                </li>
            </ul>
        </div>
        <div class="action">
            <a href="#"><i class="icon-ion-ios-shuffle" @click="share"></i></a>
            <a v-if="isFriend" href="#"><i class="icon-ion-ios-chatboxes" @click="chat"></i></a>
            <a v-if="!isFriend" href="#"><i class="icon-ion-person-add" @click="addFriend"></i></a>
        </div>
    </section>
</template>

<script>
import store from "@/store";
import Conversation from "@/wfc/model/conversation";
import ConversationType from "@/wfc/model/conversationType";
import FriendRequestView from "@/ui/main/contact/FriendRequestView";
import wfc from "@/wfc/client/wfc";

export default {
    name: "UserCardView",
    props: {
        userInfo: {
            type: Object,
            required: true,
        },
    },
    data() {
        return {
            friendAlias: this.userInfo.friendAlias,
        }
    },
    methods: {
        share() {
            // TODO share
            this.close();
        },
        chat() {
            let conversation = new Conversation(ConversationType.Single, this.userInfo.uid, 0);
            store.setCurrentConversation(conversation)
            this.close();
        },

        addFriend() {
            this.close();
            this.$modal.show(
                FriendRequestView,
                {
                    userInfo: this.userInfo,
                },
                {
                    name: 'friend-request-modal',
                    width: 600,
                    height: 250,
                    clickToClose: false,
                }, {})
        },
        updateFriendAlias() {
            if (this.friendAlias !== this.userInfo.friendAlias) {
                wfc.setFriendAlias(this.userInfo.uid, this.friendAlias,
                    () => {
                        // do nothing
                    },
                    (error) => {
                        // do nothing
                    })
            }
        },
        close() {
            this.$emit('close');
        }
    },

    computed: {
        isFriend() {
            return this.userInfo.uid === wfc.getUserId() || wfc.isMyFriend(this.userInfo.uid)
        }
    }
};
</script>

<style lang="css" scoped>
.user-info-container {
    width: 300px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: #292a2c;
    background-color: #fcfcfc;
}

.user-info-container .avatar {
    width: 60px;
    height: 60px;
    border-radius: 3px;
}

.header {
    width: calc(100% - 40px);
    margin: 10px 20px;
    padding-bottom: 20px;
    display: flex;
    justify-content: space-between;
    border-bottom: 1px solid lightgray;
}


.header .desc {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
}

.content {
    width: 100%;
    text-align: left;
}

.content ul {
    border: 1px solid white;
    list-style: none;
    margin: 10px 20px;
}

.content ul li {
    margin-left: 0;
    height: 40px;
    line-height: 40px;
    display: flex;
}

.content ul li label {
    margin-right: 20px;
}

.content ul li .alias {
    border: none;
    background: none;
}

.content ul li .alias > input {
    width: 100%;
}

.content ul li > div {
    display: inline-block;
    flex: 1;
}

.action {
    width: calc(100% - 40px);
    display: flex;
    justify-content: flex-end;

    padding-top: 20px;
    padding-bottom: 10px;
}

.action a {
    display: inline-block;
    text-decoration: none;
}

.action a i {
    font-size: 24px;
    padding: 5px 30px;
}

.action a i:last-of-type {
    padding-right: 0;
}

i:hover {
    color: #34b7f1;
}


</style>
