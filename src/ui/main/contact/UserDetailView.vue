<template>
    <section class="user-detail-container">
        <div class="user-header-content-container">
            <div class="header">
                <div>
                    <img class="avatar" :src="sharedStateContact.currentFriend.portrait">
                </div>
                <div class="name">
                    <div style="display: flex; align-items: center">
                        <h2>{{ name }}</h2>
                        <p v-if="isExternalDomainUser" class="single-line" style="color: #F0A040; border-radius: 2px;  padding: 1px 2px; font-size: 9px">{{ domainName }}</p>
                    </div>
                    <p>你好，野火</p>
                </div>
            </div>
            <div class="content">
                <ul>
                    <li>
                        <label>{{ $t('common.alias') }}</label>
                        <div class="alias">
                            <input type="text" ref="input" :value="sharedStateContact.currentFriend.friendAlias" placeholder="备注名" @keyup.enter="updateFriendAlias"/>
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
                <div class="action" @click="chat">
                    <i class="icon-ion-ios-chatboxes-outline"></i>
                    <a>{{ $t('message.send_message') }}</a>
                </div>
                <div class="action" @click="startAudioCall">
                    <i class="icon-ion-ios-telephone-outline"></i>
                    <a>语音通话</a>
                </div>
                <div class="action" @click="startVideoCall">
                    <i class="icon-ion-ios-videocam-outline"></i>
                    <a>视频通话</a>
                </div>
            </div>
        </div>
    </section>
</template>

<script>
import store from "../../../store";
import ConversationType from "../../../wfc/model/conversationType";
import Conversation from "../../../wfc/model/conversation";
import wfc from "../../../wfc/client/wfc";
import WfcUtil from "../../../wfc/util/wfcUtil";

export default {
    name: "UserDetailView",
    props: {
        user: null,
    },
    data() {
        return {
            sharedStateContact: store.state.contact,
        }
    },

    methods: {
        chat() {
            let conversation = new Conversation(ConversationType.Single, this.user.uid, 0);
            store.setCurrentConversation(conversation);
            this.$router.replace('/home');
        },
        updateFriendAlias() {
            let friendAlias = this.$refs.input.value;
            if (friendAlias.trim() && friendAlias !== this.sharedStateContact.currentFriend.friendAlias) {
                wfc.setFriendAlias(this.user.uid, friendAlias,
                    () => {
                        // do nothing
                        console.log('setFriendAlias success', this.user, friendAlias);
                    },
                    (error) => {
                        // do nothing
                    })
            }
        },
        startAudioCall() {
            let conversation = new Conversation(ConversationType.Single, this.user.uid, 0);
            this.$startVoipCall({audioOnly: true, conversation: conversation});
        },

        startVideoCall() {
            let conversation = new Conversation(ConversationType.Single, this.user.uid, 0);
            this.$startVoipCall({audioOnly: false, conversation: conversation});
        },
    },
    computed: {
        name() {
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
        },
        isExternalDomainUser() {
            let user = this.sharedStateContact.currentFriend;
            return WfcUtil.isExternal(user.uid);

        },
        domainName() {
            let user = this.sharedStateContact.currentFriend;
            if (WfcUtil.isExternal(user.uid)) {
                let domainId = WfcUtil.getExternalDomainId(user.uid);
                let domainInfo = wfc.getDomainInfo(domainId);
                return '@' + domainInfo.name;
        }
            return '';
        },
    }
}
</script>

<style lang="css" scoped>

.user-detail-container {
    border-top-right-radius: var(--main-border-radius);
    border-bottom-right-radius: var(--main-border-radius);
    display: flex;
    justify-content: center;
}

.user-header-content-container {
    width: 400px;
}

.header {
    margin-top: 60px;
    height: 75px;
    display: flex;
    align-items: center;
    padding-bottom: 15px;
    border-bottom: 1px solid #e6e6e6;
}

.header .avatar {
    width: 60px;
    height: 60px;
    border-radius: 5px;
    margin-right: 20px;
}

.header .name {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
}

.header .name h2 {
    font-size: 15px;
    font-style: normal;
    font-weight: normal;
}

.header .name p {
    font-size: 13px;
    color: #7f7f7f;
}

.content {
    width: 100%;
    text-align: left;
    border-bottom: 1px solid #e6e6e6;
}

.content ul {
    list-style: none;
    margin: 20px 0 10px 0;
}

.content ul li {
    margin-left: 0;
    height: 40px;
    line-height: 40px;
    display: flex;
    font-size: 12px;
}

.content ul li label {
    margin-right: 20px;
    width: 40px;
    text-align: justify;
    text-align-last: justify;
    color: #7f7f7f;
}

.content ul li p {
    font-size: 12px;
}

.content ul li .alias > input {
    width: 100%;
    border: none;
    border-radius: 3px;
    outline: none;
    padding: 5px;
    color: #bfbfbf;
    font-size: 13px;
}

.content ul li .alias > input:active {
    border: 1px solid #4168e0;
}

.content ul li .alias input:focus {
    border: 1px solid #4168e0;
}

.content ul li > div {
    display: inline-block;
    flex: 1;
}

.footer {
    display: flex;
    justify-content: center;
    padding-top: 30px;
}

.footer .action {
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    align-items: center;
    color: #5d7ce8;
}

.footer .action a {
    font-size: 10px;
    padding-top: 1px;
}

.footer .action i {
    font-size: 20px;
}

</style>
