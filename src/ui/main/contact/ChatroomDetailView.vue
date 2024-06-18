<template>
    <section class="chatroom-info-container">
        <div class="chatroom-info" v-if="chatroomInfo">
            <img :src="chatroomInfo.portrait">
            <p>{{ chatroomInfo.title }}</p>
            <p>{{ chatroomInfo.desc }}</p>
        </div>
        <a @click="chat">进入聊天室</a>
    </section>
</template>

<script>
import store from "../../../store";
import Conversation from "../../../wfc/model/conversation";
import ConversationType from "../../../wfc/model/conversationType";
import wfc from "../../../wfc/client/wfc";
import ConversationInfo from "../../../wfc/model/conversationInfo";

export default {
    name: "ChatroomDetailView",
    props: {},
    data() {
        return {
            sharedContactState: store.state.contact,
            chatroomInfo: null,
        }
    },
    mounted() {
        this.getCurrentChatroomInfo();
    },
    methods: {
        chat() {
            wfc.joinChatroom(this.chatroomInfo.chatRoomId, () => {
                let conversation = new Conversation(ConversationType.ChatRoom, this.chatroomInfo.chatRoomId, 0);
                conversation._target = this.chatroomInfo;
                conversation._target._displayName = this.chatroomInfo.title;
                let conversationInfo = new ConversationInfo();
                conversationInfo.conversation = conversation;
                store.setCurrentConversationInfo(conversationInfo);
                this.$router.replace('/home');
            }, err => {
                console.error('joinChatRoom error', err)
            })
        },
        getCurrentChatroomInfo() {
            let chatroomId = this.sharedContactState.currentChatroom.chatRoomId;
            wfc.getChatroomInfo(chatroomId, 0, info => {
                this.chatroomInfo = info;
                console.log('getChatroomInfo success', info);
            }, err => {
                console.error('getChatroomInfo error', chatroomId, err)
            })
        }
    },

    watch: {
        sharedContactState: {
            deep: true,
            handler(newValue, oldValue) {
                console.log('watch currentChatroom', oldValue, newValue)
                let chatroomId = this.sharedContactState.currentChatroom.chatRoomId;
                wfc.getChatroomInfo(chatroomId, 0, info => {
                    this.chatroomInfo = info;
                    console.log('getChatroomInfo success', info);
                }, err => {
                    console.error('getChatroomInfo error', chatroomId, err)
                })
            }
        }
    }
}
</script>

<style lang="css" scoped>

.chatroom-info-container {
    display: flex;
    height: 100%;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    border-top-right-radius: var(--main-border-radius);
    border-bottom-right-radius: var(--main-border-radius);
    position: relative;
}

.chatroom-info-container a {
    color: white;
    padding: 10px 40px;
    background-color: #3861e0;
    border-radius: 5px;
    font-size: 14px;
    border: 1px solid transparent;
    margin-bottom: 150px;
}

.chatroom-info-container a:active {
    background-color: #4168e0;
}

.chatroom-info {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

.chatroom-info img {
    height: 120px;
    width: 120px;
    border-radius: 5px;
}

.chatroom-info p {
    margin-top: 20px;
    font-size: 20px;
}

.chatroom-info p:last-of-type {
    margin-top: 20px;
    font-size: 15px;
    margin-bottom: 100px;
}

</style>
