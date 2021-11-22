<template>
    <section class="user-detail-container">
        <div class="header">
            <div>
                <h2>{{ name }}</h2>
                <p>你好，野火</p>
            </div>
            <div>
                <img class="avatar" :src="sharedStateContact.currentFriend.portrait">
            </div>
        </div>
        <div class="content">
            <ul>
                <li>
                    <label>{{ $t('common.alias') }}</label>
                    <div class="alias">
                        <input type="text" v-model="friendAlias" placeholder="备注名" @keyup.enter="updateFriendAlias"/>
                    </div>
                </li>
                <li>
                    <label>{{ $t('common.wfc_id') }}</label>
                    <p>{{ user.name }}</p>
                </li>
                <li>
                    <label>{{ $t('common.area') }}</label>
                    <p>{{ $t('common.unknown') }}</p>
                </li>
                <li>
                    <label>{{ $t('common.label') }}</label>
                    <p>{{ $t('misc.test_user') }}</p>
                </li>
            </ul>
        </div>
        <div class="footer">
            <a @click="this.chat">{{ $t('message.send_message') }}</a>
        </div>
    </section>
</template>

<script>
import store from "@/store";
import ConversationType from "@/wfc/model/conversationType";
import Conversation from "@/wfc/model/conversation";
import wfc from "../../../wfc/client/wfc";

export default {
    name: "UserDetailView",
    props: {
        user: null,
    },
    data() {
        return {
            sharedStateContact: store.state.contact,
            friendAlias: store.state.contact.currentFriend.friendAlias
        }
    },

    methods: {
        chat() {
            let conversation = new Conversation(ConversationType.Single, this.user.uid, 0);
            store.setCurrentConversation(conversation);
            this.$router.replace('/home');
        },
        updateFriendAlias() {
            if (this.friendAlias !== this.sharedStateContact.currentFriend.friendAlias) {
                wfc.setFriendAlias(this.user.uid, this.friendAlias,
                    () => {
                        // do nothing
                    },
                    (error) => {
                        // do nothing
                    })
        }
    },
    },
    computed: {
        name: function () {
            let name;
            let friend = this.sharedStateContact.currentFriend;
            if (friend.displayName) {
                name = friend.displayName;
            } else {
                name = friend.name;
            }
            // side
            (async () => {
                wfc.getUserInfo(friend.uid, true)
            })();
            return name;
        }
    }
}
</script>

<style lang="css" scoped>

.user-detail-container {
    margin-left: 90px;
    margin-right: 90px;
    border-top-right-radius: var(--main-border-radius);
    border-bottom-right-radius: var(--main-border-radius);
}

.header {
    margin-top: 60px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 15px;
    border-bottom: 1px solid #e6e6e6;
}

.header .avatar {
    width: 80px;
    height: 80px;
    border-radius: 2px;
}

.header h2 {
    font-size: 20px;
    font-style: normal;
    font-weight: normal;
    margin-bottom: 5px;
}

.content {
    width: 100%;
    text-align: left;
}

.content ul {
    list-style: none;
    margin: 20px 0;
}

.content ul li {
    margin-left: 0;
    height: 40px;
    line-height: 40px;
    display: flex;
}

.content ul li label {
    margin-right: 20px;
    width: 50px;
    text-align: justify;
    text-align-last: justify;
}

.content ul li .alias > input {
    width: 100%;
    border: none;
    height: 20px;
}

.content ul li > div {
    display: inline-block;
    flex: 1;
}

.footer {
    display: flex;
    justify-content: center;
}

.footer a {
    margin-top: 30px;
    color: white;
    padding: 10px 40px;
    background-color: #34b7f1;
    border-radius: 5px;
    border: 1px solid transparent;
}

.footer a:active {
    background-color: #4168e0;
}

</style>
